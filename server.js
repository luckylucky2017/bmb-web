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
    next();
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
      title: `${res.locals.siteName} | Đại lý phân phối nước khoáng La Vie khu vực Hà Nội`,
      description:
        "Công ty TNHH BMB Việt Nam - đại lý phân phối chính thức nước khoáng, nước tinh khiết La Vie tại Hà Nội, giao hàng tận nơi nhanh chóng.",
      products: products.slice(0, 4),
      news
    });
  })
);

app.get("/gioi-thieu", (req, res) => {
  res.render("pages/about", {
    title: `Giới thiệu | ${res.locals.siteName}`,
    description: "Tìm hiểu về hành trình, sứ mệnh và giá trị cốt lõi của Công ty TNHH BMB Việt Nam - đại lý phân phối La Vie tại Hà Nội."
  });
});

app.get(
  "/san-pham",
  asyncHandler(async (req, res) => {
    const products = await Product.all({ status: "published" });
    res.render("pages/products", {
      title: `Sản phẩm | ${res.locals.siteName}`,
      description: "Danh mục sản phẩm nước khoáng và nước tinh khiết La Vie do BMB Việt Nam phân phối chính thức tại Hà Nội.",
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
      title: `${product.name} | ${res.locals.siteName}`,
      description: product.short_description,
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
      title: `${product.name} | ${res.locals.siteName}`,
      description: product.short_description,
      product,
      related,
      orderSubmitted: true
    });
  })
);

app.get("/phat-trien-ben-vung", (req, res) => {
  res.render("pages/sustainability", {
    title: `Cam kết dịch vụ | ${res.locals.siteName}`,
    description: "Cam kết của BMB Việt Nam về nguồn hàng chính hãng La Vie, chất lượng giao nhận và bảo vệ môi trường."
  });
});

app.get(
  "/tin-tuc",
  asyncHandler(async (req, res) => {
    const news = await Post.all({ status: "published" });
    res.render("pages/news", {
      title: `Tin tức | ${res.locals.siteName}`,
      description: "Cập nhật tin tức, chương trình khuyến mãi và hoạt động mới nhất từ BMB Việt Nam.",
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
      title: `${article.title} | ${res.locals.siteName}`,
      description: article.excerpt,
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
      title: `Khu vực giao hàng | ${res.locals.siteName}`,
      description: "Các điểm giao nhận và khu vực phục vụ của BMB Việt Nam trên địa bàn Hà Nội.",
      distributors
    });
  })
);

app.get(
  "/tuyen-dung",
  asyncHandler(async (req, res) => {
    const jobs = await Job.all({ status: "open" });
    res.render("pages/careers", {
      title: `Tuyển dụng | ${res.locals.siteName}`,
      description: "Cơ hội nghề nghiệp và văn hóa làm việc tại BMB Việt Nam.",
      jobs
    });
  })
);

app.get("/lien-he", (req, res) => {
  res.render("pages/contact", {
    title: `Liên hệ | ${res.locals.siteName}`,
    description: "Thông tin liên hệ Công ty TNHH BMB Việt Nam - đại lý phân phối La Vie tại Hà Nội.",
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
      title: `Liên hệ | ${res.locals.siteName}`,
      description: "Thông tin liên hệ Công ty TNHH BMB Việt Nam - đại lý phân phối La Vie tại Hà Nội.",
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
