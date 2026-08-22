const express = require("express");
const path = require("path");
const compression = require("compression");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const flash = require("connect-flash");
const methodOverride = require("method-override");

const db = require("./db/database");
const asyncHandler = require("./middleware/asyncHandler");
const { validateContact, validateOrder } = require("./middleware/validate");

const Product = require("./models/Product");
const Post = require("./models/Post");
const Distributor = require("./models/Distributor");
const Job = require("./models/Job");
const Order = require("./models/Order");
const ContactMessage = require("./models/ContactMessage");
const Setting = require("./models/Setting");

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";
const SITE_URL = (process.env.SITE_URL || "https://laviewaterhanoi.vn").replace(/\/$/, "");

// Trust exactly one reverse-proxy hop (nginx origin) so req.ip / req.protocol
// and rate-limit keys reflect the real client instead of the proxy.
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        // Disabled: the reverse-proxy chain in front of this app terminates
        // TLS externally (Cloudflare) and talks plain HTTP to this origin,
        // so forcing HTTPS upgrades on same-origin asset requests here
        // would break every page load.
        upgradeInsecureRequests: null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(compression());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));
app.use(express.json({ limit: "200kb" }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Own dedicated pool for the session store (express-mysql-session uses a
// callback-style pool internally, separate from the app's mysql2/promise
// pool). Persists sessions in MySQL instead of process memory, so they
// survive restarts/deploys and work correctly if this ever scales past
// a single Node process.
const sessionStore = new MySQLStore({
  ...db.dbConfig,
  createDatabaseTable: true,
  schema: {
    tableName: "sessions",
    columnNames: { session_id: "session_id", expires: "expires", data: "data" }
  }
});
sessionStore.onReady().catch((err) => console.error("Session store lỗi:", err));

app.use(
  session({
    name: "bmb.sid",
    secret: process.env.SESSION_SECRET || "bmb-vietnam-cms-dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd
    }
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.flashSuccess = req.flash("success");
  res.locals.flashError = req.flash("error");
  res.locals.formatVND = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;
  res.locals.formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");
  next();
});

// Lightweight CSRF defense-in-depth: SameSite=Lax cookies already stop
// cross-site POSTs from sending our session cookie; this rejects any
// state-changing admin request whose Origin/Referer doesn't match our host.
app.use("/admin", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && !req.path.startsWith("/login")) {
    const origin = req.get("origin") || req.get("referer");
    if (origin) {
      const originHost = (() => {
        try {
          return new URL(origin).host;
        } catch {
          return null;
        }
      })();
      if (originHost && originHost !== req.get("host")) {
        return res.status(403).send("Yêu cầu bị từ chối (kiểm tra nguồn gốc thất bại).");
      }
    }
  }
  next();
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút."
});

// ---- Admin CMS ----
app.use("/admin", require("./routes/admin/index"));

// ---- Public site ----
app.use(
  asyncHandler(async (req, res, next) => {
    res.locals.layout = "layout";
    const settings = await Setting.all();
    res.locals.site = settings;
    res.locals.siteName = settings.site_name || "BMB Việt Nam";
    res.locals.siteUrl = SITE_URL;
    next();
  })
);

// robots.txt / sitemap.xml — plain text/XML, no layout wrapping needed.
app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    ["User-agent: *", "Allow: /", "Disallow: /admin", `Sitemap: ${SITE_URL}/sitemap.xml`].join("\n")
  );
});

app.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    const [products, posts] = await Promise.all([
      Product.all({ status: "published" }),
      Post.all({ status: "published" })
    ]);
    const staticUrls = [
      { loc: "/", priority: "1.0" },
      { loc: "/gioi-thieu", priority: "0.7" },
      { loc: "/san-pham", priority: "0.9" },
      { loc: "/phat-trien-ben-vung", priority: "0.6" },
      { loc: "/tin-tuc", priority: "0.7" },
      { loc: "/dai-ly", priority: "0.8" },
      { loc: "/tuyen-dung", priority: "0.5" },
      { loc: "/lien-he", priority: "0.6" }
    ];
    const productUrls = products.map((p) => ({
      loc: `/san-pham/${p.slug}`,
      priority: "0.8",
      lastmod: p.updated_at
    }));
    const postUrls = posts.map((p) => ({
      loc: `/tin-tuc/${p.slug}`,
      priority: "0.6",
      lastmod: p.updated_at
    }));
    const all = [...staticUrls, ...productUrls, ...postUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : ""}
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
    res.type("application/xml").send(xml);
  })
);

app.get(
  "/",
  asyncHandler(async (req, res) => {
    const [products, news] = await Promise.all([
      Product.all({ status: "published" }),
      Post.all({ status: "published", limit: 3 })
    ]);
    res.render("pages/home", {
      title: "Đại Lý Nước Khoáng La Vie Hà Nội - Phân Phối Nước Sạch, Giao Tận Nhà | BMB Việt Nam",
      description:
        "BMB Việt Nam - đại lý nước La Vie chính hãng tại Hà Nội. Chuyên phân phối nước khoáng, nước tinh khiết, nước sạch đóng bình 19L, giao nước tận nhà trong ngày.",
      keywords:
        "nước khoáng, nước lavie, nước sạch, phân phối nước, đại lý nước, đại lý nước lavie hà nội, nước khoáng la vie, giao nước tận nhà hà nội, nước đóng bình 19l, nước tinh khiết hà nội, đặt nước lavie, mua nước lavie giá rẻ",
      products: products.slice(0, 4),
      news
    });
  })
);

app.get("/gioi-thieu", (req, res) => {
  res.render("pages/about", {
    title: "Giới Thiệu Đại Lý Nước La Vie Hà Nội | BMB Việt Nam",
    description:
      "BMB Việt Nam là đại lý phân phối nước khoáng La Vie chính thức tại Hà Nội, chuyên cung cấp nước sạch, nước tinh khiết cho hộ gia đình và văn phòng.",
    keywords: "đại lý nước lavie hà nội, phân phối nước lavie, giới thiệu đại lý nước, nước sạch hà nội, đại lý nước khoáng"
  });
});

app.get(
  "/san-pham",
  asyncHandler(async (req, res) => {
    const products = await Product.all({ status: "published" });
    res.render("pages/products", {
      title: "Bảng Giá Nước Khoáng La Vie - Đầy Đủ Các Loại | BMB Việt Nam",
      description:
        "Bảng giá đầy đủ nước khoáng La Vie, nước tinh khiết, nước đóng bình 19L chính hãng. Đại lý nước La Vie Hà Nội, giao hàng tận nơi, giá tốt nhất thị trường.",
      keywords:
        "giá nước lavie, bảng giá nước khoáng lavie, nước lavie 500ml, nước lavie 19l, mua nước khoáng, đại lý nước khoáng hà nội, nước tinh khiết",
      products
    });
  })
);

app.get(
  "/san-pham/:slug",
  asyncHandler(async (req, res) => {
    const product = await Product.findBySlug(req.params.slug);
    if (!product || product.status !== "published") {
      return res.status(404).render("pages/404", { title: `Không tìm thấy trang | ${res.locals.siteName}` });
    }
    const related = await Product.related(product.id, 3);
    res.render("pages/product-detail", {
      title: `${product.name} - Giá ${res.locals.formatVND(product.price)} | Đại Lý La Vie Hà Nội`,
      description: `${product.short_description} Mua ${product.name} chính hãng, giao tận nhà tại Hà Nội qua đại lý BMB Việt Nam.`,
      keywords: `${product.name}, nước lavie, nước khoáng, ${product.category}, mua nước lavie, giá nước lavie`,
      product,
      related,
      orderSubmitted: false
    });
  })
);

app.post(
  "/san-pham/:slug/dat-hang",
  publicFormLimiter,
  validateOrder,
  asyncHandler(async (req, res) => {
    const product = await Product.findBySlug(req.params.slug);
    if (!product) return res.status(404).send("Không tìm thấy sản phẩm");
    await Order.createFromProduct(product, req.body);
    const related = await Product.related(product.id, 3);
    res.render("pages/product-detail", {
      title: `${product.name} - Giá ${res.locals.formatVND(product.price)} | Đại Lý La Vie Hà Nội`,
      description: `${product.short_description} Mua ${product.name} chính hãng, giao tận nhà tại Hà Nội qua đại lý BMB Việt Nam.`,
      keywords: `${product.name}, nước lavie, nước khoáng, ${product.category}, mua nước lavie, giá nước lavie`,
      product,
      related,
      orderSubmitted: true
    });
  })
);

app.get("/phat-trien-ben-vung", (req, res) => {
  res.render("pages/sustainability", {
    title: "Cam Kết Dịch Vụ - Nước Sạch Chính Hãng | BMB Việt Nam",
    description:
      "Cam kết của BMB Việt Nam về nguồn nước lavie chính hãng, chất lượng nước sạch và dịch vụ giao nhận đúng hẹn tại Hà Nội.",
    keywords: "nước sạch, nước lavie chính hãng, cam kết chất lượng nước, đại lý nước uy tín"
  });
});

app.get(
  "/tin-tuc",
  asyncHandler(async (req, res) => {
    const news = await Post.all({ status: "published" });
    res.render("pages/news", {
      title: "Tin Tức Đại Lý Nước La Vie Hà Nội | BMB Việt Nam",
      description: "Cập nhật tin tức, chương trình khuyến mãi nước khoáng La Vie và hoạt động mới nhất từ đại lý BMB Việt Nam tại Hà Nội.",
      keywords: "tin tức nước lavie, khuyến mãi nước khoáng, đại lý nước hà nội, tin tức đại lý nước",
      news
    });
  })
);

app.get(
  "/tin-tuc/:slug",
  asyncHandler(async (req, res) => {
    const article = await Post.findBySlug(req.params.slug);
    if (!article || article.status !== "published") {
      return res.status(404).render("pages/404", { title: `Không tìm thấy trang | ${res.locals.siteName}` });
    }
    const related = await Post.related(article.id, 2);
    res.render("pages/news-detail", {
      title: `${article.title} | BMB Việt Nam`,
      description: article.excerpt,
      keywords: `${article.category}, nước lavie, đại lý nước hà nội, tin tức nước khoáng`,
      article,
      related
    });
  })
);

app.get(
  "/dai-ly",
  asyncHandler(async (req, res) => {
    const distributors = await Distributor.grouped();
    res.render("pages/distributors", {
      title: "Khu Vực Giao Nước La Vie Tại Hà Nội - Tất Cả Quận Huyện | BMB Việt Nam",
      description:
        "BMB Việt Nam giao nước La Vie, nước sạch tận nhà tại tất cả các quận huyện Hà Nội: Cầu Giấy, Đống Đa, Hà Đông, Thanh Xuân... Giao nhanh 2-4 giờ.",
      keywords:
        "giao nước tận nhà hà nội, phân phối nước hà nội, đại lý nước theo quận, giao nước cầu giấy, giao nước đống đa, giao nước hà đông, giao nước thanh xuân",
      distributors
    });
  })
);

app.get(
  "/tuyen-dung",
  asyncHandler(async (req, res) => {
    const jobs = await Job.all({ status: "open" });
    res.render("pages/careers", {
      title: "Tuyển Dụng Nhân Viên Giao Nước Hà Nội | BMB Việt Nam",
      description: "Cơ hội nghề nghiệp tại đại lý nước La Vie BMB Việt Nam - tuyển nhân viên giao nước, kinh doanh, kho vận tại Hà Nội.",
      keywords: "tuyển dụng nhân viên giao nước, việc làm đại lý nước hà nội, tuyển tài xế giao nước",
      jobs
    });
  })
);

app.get("/lien-he", (req, res) => {
  res.render("pages/contact", {
    title: "Liên Hệ Đại Lý Nước La Vie Hà Nội - Hotline Đặt Nước | BMB Việt Nam",
    description: "Liên hệ đại lý nước La Vie BMB Việt Nam tại Hà Nội. Hotline đặt nước nhanh, giao nước sạch tận nhà trong ngày.",
    keywords: "liên hệ đại lý nước, hotline đặt nước lavie, số điện thoại đại lý nước hà nội",
    submitted: false
  });
});

app.post(
  "/lien-he",
  publicFormLimiter,
  validateContact,
  asyncHandler(async (req, res) => {
    await ContactMessage.create(req.body);
    res.render("pages/contact", {
      title: "Liên Hệ Đại Lý Nước La Vie Hà Nội - Hotline Đặt Nước | BMB Việt Nam",
      description: "Liên hệ đại lý nước La Vie BMB Việt Nam tại Hà Nội. Hotline đặt nước nhanh, giao nước sạch tận nhà trong ngày.",
      keywords: "liên hệ đại lý nước, hotline đặt nước lavie, số điện thoại đại lý nước hà nội",
      submitted: true
    });
  })
);

app.use((req, res) => {
  res.status(404).render("pages/404", { title: `Không tìm thấy trang | ${res.locals.siteName || "BMB Việt Nam"}`, description: "" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.");
});

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`BMB Việt Nam website đang chạy tại http://localhost:${PORT}`);
      console.log(`Trang quản trị CMS tại http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error("Không thể kết nối MySQL:", err);
    process.exit(1);
  });
