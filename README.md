# BMB Việt Nam — Website + CMS

Website công khai và hệ thống quản trị nội dung (CMS) cho **Công ty TNHH BMB Việt Nam** —
đại lý phân phối chính thức nước khoáng **Lavie** khu vực Hà Nội.

Tài liệu này để bàn giao code cho người tiếp theo — đọc hết trước khi sửa gì.

---

## 1. Tổng quan kiến trúc

- **Backend:** Node.js + Express, render HTML server-side bằng **EJS** (không phải SPA/React).
- **Database:** MySQL (không dùng SQLite/ORM — query thuần qua `mysql2/promise`, xem `models/*.js`).
- **CSS:** Tailwind CSS, biên dịch tĩnh ra `public/css/style.css` (không dùng Tailwind CLI watch lúc chạy production).
- **Session:** lưu trong MySQL (bảng `sessions`, tự tạo bởi `express-mysql-session`) — **không** dùng MemoryStore, để sống sót qua restart/deploy.
- **Không có framework frontend** (không React/Vue) — mọi tương tác JS nằm trong `public/js/*.js`, thuần vanilla JS.

```
bmb-vietnam/
├── server.js              # Toàn bộ route công khai (trang chủ, sản phẩm, tin tức...) + khởi tạo app
├── db/
│   ├── database.js        # Kết nối MySQL pool + hàm init() tạo schema, seed dữ liệu mẫu lần đầu,
│   │                       # và các hàm backfillXxxIfEmpty() tự di trú dữ liệu cũ khi thêm bảng mới
│   └── schema.sql          # DDL đầy đủ các bảng
├── models/                 # 1 file / 1 bảng, mỗi hàm = 1 câu query đã tham số hoá (chống SQL injection)
│   ├── sanitizeContent.js  # Cấu hình sanitize-html dùng chung cho Post.description & Product.description
│   └── safeUrl.js          # Chặn scheme nguy hiểm (javascript:, data:...) trong link menu/quảng cáo
├── routes/admin/           # Toàn bộ route /admin/* (đã có middleware requireAuth ở index.js)
├── middleware/
│   ├── auth.js             # requireAuth, requireRole('superadmin'|'admin'|'editor')
│   ├── validate.js         # Validate form công khai (liên hệ, đặt hàng)
│   ├── upload.js           # multer + kiểm tra magic-byte thật của file (không chỉ tin đuôi/mimetype
│   │                       # client gửi lên) + rate-limit riêng cho upload — xem mục 4b
│   └── asyncHandler.js     # Bọc async route để lỗi tự rơi vào error handler, khỏi try/catch lặp lại
├── views/
│   ├── layout.ejs          # Layout trang công khai — SEO meta, JSON-LD, nạp theme qua data-theme
│   ├── partials/           # header (nav động từ DB + nút gọi + FAB mobile), footer, ad-banners.ejs
│   │                       # (quảng cáo dọc 2 bên), page-header dùng chung
│   ├── pages/              # 1 file / 1 trang công khai
│   └── admin/              # Toàn bộ giao diện quản trị (layout riêng, không dùng theme công khai)
├── public/
│   ├── css/style.css       # File CSS đã build — PHẢI build lại sau khi sửa src/input.css hoặc *.ejs
│   ├── js/                 # site.js (menu mobile, popup chọn số gọi), admin.js,
│   │                       # post-editor.js (Quill, dùng cho Tin tức), product-editor.js (TinyMCE,
│   │                       # dùng cho mô tả Sản phẩm — xem mục 4c)
│   ├── images/             # SVG logo + minh hoạ chai nước tự vẽ (không phải ảnh thật)
│   └── uploads/            # Ảnh admin upload qua CMS — KHÔNG xoá, KHÔNG có trong git (.gitignore)
├── src/input.css           # Nguồn Tailwind — sửa ở đây, không sửa trực tiếp public/css/style.css
└── tailwind.config.js      # Định nghĩa màu brand/accent theo CSS variable (xem mục Theme bên dưới)
```

---

## 2. Chạy local

```bash
cd bmb-vietnam
npm install
cp .env.example .env      # rồi điền DB_USER/DB_PASSWORD/DB_NAME trỏ vào MySQL local của bạn
npm run build:css         # build 1 lần, hoặc `npm run dev:css` để watch khi sửa CSS
npm run dev                # nodemon, tự restart khi sửa .js/.ejs
```

Lần chạy đầu tiên, `db.init()` trong `server.js` sẽ tự **tạo toàn bộ bảng + seed dữ liệu mẫu**
(6 sản phẩm Lavie, 4 bài tin tức, danh sách quận huyện Hà Nội, 1 tài khoản admin) — xem
`db/database.js` hàm `seed()`. Tài khoản admin mặc định in ra console khi seed chạy lần đầu
(`admin@bmbvietnam.vn` / `Admin@123`) — **đổi ngay sau khi đăng nhập lần đầu trên môi trường thật**.

Truy cập:
- Trang công khai: http://localhost:3000
- Trang quản trị: http://localhost:3000/admin

---

## 3. Biến môi trường (`.env`)

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng chạy app |
| `SESSION_SECRET` | Khoá ký session — **bắt buộc đổi giá trị ngẫu nhiên mạnh trên production** |
| `SITE_URL` | Domain đầy đủ (vd `https://laviewaterhanoi.vn`) — dùng cho canonical URL, sitemap.xml, Open Graph |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Kết nối MySQL |
| `NODE_ENV=production` | Bật cookie `secure`, tắt log chi tiết |

**Không commit `.env` thật** — đã có trong `.gitignore`. Xem `.env.example` để biết cần những biến gì.

---

## 4. Hệ thống quản trị (CMS) — `/admin`

Vai trò (`role` trong bảng `users`): `superadmin` > `admin` > `editor`.
- **superadmin**: toàn quyền, kể cả quản lý người dùng khác (`/admin/nguoi-dung`).
- **admin**: toàn quyền trừ quản lý người dùng, sửa được Cài đặt (`/admin/cai-dat`).
- **editor**: quản lý nội dung (sản phẩm, tin tức, đơn hàng, liên hệ...), **không** sửa được Cài đặt.

Các module chính (đường dẫn dưới `/admin`):

| Module | Đường dẫn | Ghi chú |
|---|---|---|
| Dashboard | `/admin` | Thống kê nhanh: doanh thu, đơn mới, liên hệ chưa đọc |
| Sản phẩm | `/admin/san-pham` | CRUD, upload ảnh, giá tiền lưu bằng số nguyên (VNĐ), mô tả chi tiết dùng **TinyMCE** (xem mục 4c) |
| Tin tức | `/admin/tin-tuc` | Trình soạn thảo Quill, nội dung được **sanitize-html** trước khi lưu (chống XSS lưu trữ) |
| Danh mục | `/admin/danh-muc` | Danh mục dùng chung cho Sản phẩm & Tin tức (tab riêng theo `type`), sản phẩm/bài viết vẫn lưu tên danh mục dạng text — đổi tên ở đây không tự cập nhật các bản ghi cũ đã lưu |
| Menu điều hướng | `/admin/menu` | CRUD các mục trên header trang công khai — xem mục 6b |
| Quảng cáo 2 bên | `/admin/quang-cao` | Banner dọc cột trái/phải, chỉ admin/superadmin — xem mục 6b |
| Khu vực giao hàng | `/admin/dai-ly` | Trước đây là "Đại lý", đã đổi ý nghĩa thành khu vực/quận huyện phục vụ |
| Tuyển dụng | `/admin/tuyen-dung` | CRUD tin tuyển dụng |
| Đơn hàng | `/admin/don-hang` | Trạng thái: `new → confirmed → shipping → completed` hoặc `cancelled` |
| Liên hệ | `/admin/lien-he` | Form liên hệ công khai đổ vào đây |
| Cài đặt | `/admin/cai-dat` | Thông tin công ty, 2 hotline, **banner trang chủ** (mục 6b), **chọn giao diện (theme)** — xem mục 6 |
| Người dùng | `/admin/nguoi-dung` | Chỉ superadmin |

Bảo mật đã áp dụng (xem `server.js`, `routes/admin/auth.js`, `middleware/upload.js`):
- Rate-limit đăng nhập theo IP (15 lần/15 phút) **+** khoá 15 phút sau 5 lần sai liên tiếp **+** bắt
  buộc giải CAPTCHA (tự sinh SVG qua `svg-captcha`, không phụ thuộc dịch vụ ngoài như Google reCAPTCHA)
  sau 3 lần sai — xem `routes/admin/auth.js`. Bộ đếm khoá/CAPTCHA tính theo **IP + email cùng lúc**
  (không phải email đơn thuần) — cố ý, để ai đó biết được email admin (email này lộ ra khá dễ, vd
  `admin@bmbvietnam.vn`) không thể khoá tài khoản thật từ xa chỉ bằng cách nhập sai mật khẩu liên tục;
  chủ tài khoản đăng nhập từ IP khác vẫn vào được bình thường trong lúc IP đang tấn công bị khoá riêng.
  Đánh đổi: bộ đếm dùng chung 1 `Map` trong bộ nhớ, chỉ đúng khi app chạy **1 tiến trình** (đúng với
  cách deploy hiện tại qua systemd), và một kẻ tấn công đổi IP liên tục có thể né được ngưỡng này —
  rate-limit theo IP ở trên vẫn áp dụng độc lập để chặn bớt trường hợp đó.
- Session ID được cấp lại (`regenerate`) khi đăng nhập thành công — chống session fixation.
- CSP nghiêm ngặt qua `helmet` — **mọi script phải là file ngoài** (`public/js/*.js`), không được
  viết `<script>` inline hay `onclick=` trong `.ejs`, sẽ bị CSP chặn im lặng.
- CSRF: chặn request POST/PUT/DELETE vào `/admin/*` nếu header Origin/Referer khác domain (kết hợp
  cookie `SameSite=Lax`).
- **Upload ảnh (mục 4b):** đuôi file + `Content-Type` client gửi lên đều không đáng tin (dễ giả) —
  `middleware/upload.js` đọc **magic-byte thật** của file sau khi lưu, xoá ngay và từ chối nếu nội
  dung không khớp định dạng ảnh đã khai; kèm rate-limit riêng (60 lần/15 phút) để tránh 1 tài khoản
  bị chiếm quyền spam upload làm đầy ổ đĩa.
- **Link do admin nhập** (menu điều hướng, link quảng cáo, link nút CTA banner) đi qua
  `models/safeUrl.js` — chỉ chấp nhận đường dẫn nội bộ (`/...`) hoặc `http(s)://`, chặn
  `javascript:`/`data:` để tránh XSS khi link được render thẳng vào `href="..."`.

### 4b. Upload ảnh — vì sao không chỉ tin đuôi file

`middleware/upload.js` export thêm 2 hàm ngoài `upload` (instance multer):
- `assertValidImage(file)` — đọc 12 byte đầu của file đã lưu, so với magic number thật của
  jpg/png/gif/webp; nếm không khớp thì xoá file và `throw`. Gọi hàm này **sau** khi multer lưu file,
  **trước** khi ghi vào DB.
- `runUpload(fieldName)` — bọc `upload.single(fieldName)` thành hàm trả Promise, để `await` được
  ngay trong `try/catch` của route thay vì đặt `upload.single(...)` làm middleware riêng (nếu đặt
  riêng, lỗi validate sẽ rơi thẳng ra trang lỗi 500 chung thay vì flash message đẹp — đã từng là bug
  thật, xem lịch sử commit).

Mẫu dùng đúng (xem `routes/admin/products.js`):
```js
const { assertValidImage, runUpload, uploadLimiter } = require("../../middleware/upload");
const uploadImageFile = runUpload("image_file");

router.post("/moi", uploadLimiter, asyncHandler(async (req, res) => {
  try {
    await uploadImageFile(req, res);
    assertValidImage(req.file);
    // ... lưu DB
  } catch (err) {
    req.flash("error", "..." + err.message);
    res.redirect(back);
  }
}));
```

### 4c. Editor mô tả sản phẩm — TinyMCE (inline mode)

Ô "Mô tả chi tiết" trong `/admin/san-pham` dùng **TinyMCE 6** (self-hosted qua jsdelivr CDN, lõi
MIT license, không cần API key) ở **chế độ `inline: true`** — soạn thảo trực tiếp trên trang, không
qua `<iframe>` nội bộ như chế độ mặc định của TinyMCE. Lý do chọn inline: tránh phải nới lỏng CSP
`script-src` thêm `'unsafe-inline'` (chế độ iframe mặc định của TinyMCE cần điều đó để bootstrap
vùng soạn thảo, sẽ làm yếu CSP nghiêm ngặt đã cấu hình).

Vài cấu hình KHÔNG hiển nhiên trong `public/js/product-editor.js`, đừng xoá nếu không hiểu tại sao có:
- `fixed_toolbar_container_target` (không phải `fixed_toolbar_container` — đó là API TinyMCE 5 cũ,
  không còn tác dụng ở bản 6) — gắn toolbar cố định vào `#description-toolbar-mount` thay vì để nó
  nổi (floating) theo con trỏ.
- `toolbar_mode: "wrap"` — nếu bỏ, các nút thừa sẽ gộp vào 1 nút "..." ẩn đi thay vì xuống dòng.
- `entity_encoding: "raw"` — nếu bỏ, TinyMCE tự mã hoá tiếng Việt có dấu thành HTML entity
  (`&agrave;`...) khi lưu, phá vỡ tìm kiếm bằng `LIKE` trong DB.
- `convert_urls: false` — nếu bỏ, TinyMCE tự "tương đối hoá" đường dẫn ảnh vừa upload
  (`/uploads/x.png` → `../../uploads/x.png`), sai vị trí khi hiển thị ở URL khác.

Nội dung lưu qua `models/sanitizeContent.js` (dùng chung với Tin tức) — cho phép thêm bảng
(`<table>`), căn chỉnh (`text-align`), màu chữ/nền, và nhúng video **chỉ từ YouTube/Vimeo**
(`allowedIframeHostnames`, kèm CSP `frame-src` tương ứng trong `server.js` — thiếu 1 trong 2 chỗ
này thì video sẽ bị chặn câm, không báo lỗi rõ ràng).

---

## 5. SEO đã triển khai

- Mỗi route trong `server.js` truyền `title`, `description`, `keywords` riêng — xem cách đặt trong
  từng `res.render(...)`. Từ khoá chính đang nhắm: *nước khoáng, nước lavie, nước sạch, phân phối
  nước, đại lý nước* + các biến thể theo địa bàn Hà Nội.
- `views/layout.ejs`: canonical URL, Open Graph, Twitter Card, và **JSON-LD structured data**
  (`@type: Store`) lấy dữ liệu trực tiếp từ Cài đặt (`site.address`, `site.hotline`...).
- `/robots.txt` và `/sitemap.xml` là route động trong `server.js` (không phải file tĩnh) — sitemap
  tự liệt kê toàn bộ sản phẩm/bài viết đang published, không cần cập nhật tay.
- **Việc còn thiếu:** ảnh thật (hiện toàn bộ minh hoạ sản phẩm là SVG tự vẽ, không phải ảnh chụp
  thật — nên thay bằng ảnh thật để tốt cho SEO hình ảnh + tỷ lệ chuyển đổi), Google Search Console
  chưa được submit sitemap, chưa có Google Business Profile liên kết.

---

## 6. Hệ thống đổi giao diện (Theme) — mới thêm

Trang công khai đổi được **màu sắc + font chữ toàn site** ngay trong `/admin/cai-dat`, không cần
sửa code hay deploy lại. Cơ chế:

1. `src/input.css` định nghĩa các biến CSS `--c-brand-*`, `--c-accent-*`, `--font-sans`,
   `--font-display` trong `:root` (theme mặc định) và override lại trong `[data-theme="tin-cay"]`,
   `[data-theme="nang-dong"]`.
2. `tailwind.config.js`: màu `brand.*` và `accent.*` **không phải hex cứng** mà trỏ vào các biến CSS
   đó (`rgb(var(--c-brand-600) / <alpha-value>)`) — đây là lý do đổi được màu mà không cần build lại
   Tailwind.
3. `views/layout.ejs` in `<html data-theme="<%= site.theme %>">` — giá trị lấy từ setting `theme`
   trong DB (`default` | `tin-cay` | `nang-dong`).
4. Toàn bộ Google Fonts của cả 3 theme được nạp sẵn trong `<head>` (Be Vietnam Pro, Plus Jakarta
   Sans, Inter, Manrope) — chỉ font đang được chọn mới thực sự áp dụng.
5. **Trang quản trị không bao giờ đổi theme** — `views/admin/layout.ejs` không set `data-theme`,
   luôn dùng bộ màu mặc định trong `:root`, tách biệt hoàn toàn với giao diện công khai.

**Muốn thêm theme thứ 4:**
1. Thêm 1 block `[data-theme="ten-theme-moi"] { ... }` trong `src/input.css` (copy 1 block có sẵn,
   đổi giá trị RGB — lưu ý format là `"R G B"` cách nhau bằng dấu cách, không phải hex).
2. Thêm 1 `<option>`/thẻ chọn tương ứng trong `views/admin/settings.ejs`.
3. Thêm tên theme vào mảng `ALLOWED_THEMES` trong `routes/admin/settings.js` (nếu không thêm, giá
   trị sẽ bị lọc bỏ khi lưu — đây là whitelist chống mass-assignment).
4. `npm run build:css` rồi deploy.

Nút "Đặt nước" và giá tiền trước đây dùng thẳng `red-*` của Tailwind — đã đổi hết sang `accent-*`
(xem 5 file: `header.ejs`, `home.ejs`, `products.ejs`, `product-detail.ejs`, `contact.ejs`) để chúng
đổi màu theo theme. **Nếu thêm section mới có nút CTA hoặc giá tiền, dùng `accent-600`/`accent-700`,
đừng dùng `red-*` trực tiếp**, nếu không nó sẽ không đổi theo theme.

---

## 6b. Tuỳ biến giao diện: Banner / Menu / Quảng cáo 2 bên

Ba phần trước đây hardcode trong `.ejs`, giờ chỉnh được hoàn toàn qua `/admin`, không cần sửa code
hay deploy lại:

| Phần | Quản lý ở | Lưu ở đâu | Render ở |
|---|---|---|---|
| Banner trang chủ (hero) | `/admin/cai-dat#banner` | Bảng `settings`, các key `hero_*` | `views/pages/home.ejs` |
| Menu điều hướng (header) | `/admin/menu` | Bảng `menu_items` | `views/partials/header.ejs`, đọc qua `res.locals.menuItems` (nạp 1 lần cho mọi trang công khai trong `server.js`) |
| Quảng cáo dọc 2 bên | `/admin/quang-cao` | Bảng `ad_banners` (cột `position`: `left`/`right`) | `views/partials/ad-banners.ejs`, include trong `layout.ejs` |

**Quảng cáo 2 bên** chỉ hiện ở màn hình **≥ 1536px** (`2xl:flex`, ẩn mặc định) — vì container chính
rộng tối đa 1440px, dưới 1536px không có đủ khoảng trống 2 bên để đặt banner mà không đè lên nội
dung. Đừng hạ breakpoint này xuống thấp hơn nếu chưa kiểm tra kỹ trên các độ rộng màn hình phổ biến.

**Migrate dữ liệu cũ:** khi thêm 3 phần này, `db/database.js` có thêm 2 hàm chạy ở mỗi lần khởi
động (`backfillMenuItemsIfEmpty()`, `backfillHeroSettingsIfMissing()`), tự sinh dữ liệu mặc định
đúng bằng nội dung cũ đang hiển thị — nên deploy xong site **không đổi giao diện**, admin chỉ thấy
thêm chỗ để sửa. Cùng pattern với `backfillCategoriesIfEmpty()` đã có trước đó. Nếu sau này thêm
bảng mới tương tự (có dữ liệu cũ cần giữ), nên theo đúng pattern này thay vì bắt admin nhập lại tay.

**An toàn:** `label`/`url` của menu và `link_url` của quảng cáo là text admin tự nhập, render thẳng
vào `href="..."` — đều đi qua `models/safeUrl.js` (chặn `javascript:`, `data:`...) trước khi lưu.
Quản lý cả 3 phần này yêu cầu role `admin`/`superadmin` (không cho `editor`), cùng mức với Cài đặt.

---

## 7. Quy trình sửa code + build + deploy

**Bắt buộc sau khi sửa `.ejs` hoặc `src/input.css`:**
```bash
npm run build:css
```
Tailwind chỉ generate class thực sự xuất hiện trong `views/**/*.ejs` — quên bước này thì giao diện
mới sẽ "vô hình" (class không tồn tại trong file CSS đã build).

**Kiểm tra CSP trước khi thêm bất kỳ `<script>` nào:** `server.js` có cấu hình `helmet`
`contentSecurityPolicy` khá chặt (`script-src 'self' https://cdn.jsdelivr.net`). Script inline
(`<script>...</script>` viết thẳng trong `.ejs`) và `onclick="..."` **sẽ bị trình duyệt chặn âm
thầm, không báo lỗi rõ ràng** — nếu cần thêm hành vi JS, viết vào file trong `public/js/` rồi
`<script src="/js/ten-file.js">`.

### Deploy lên production

- **Server:** `192.168.68.109` (LAN nội bộ, không phải IP public), SSH bằng key riêng do chủ dự án
  giữ, user `dev` có `sudo` không cần mật khẩu.
- **App chạy dưới systemd**, user hệ thống riêng `bmbvietnam` (không có quyền login), thư mục
  `/opt/bmb-vietnam`, service tên `bmb-vietnam.service`, lắng nghe cổng **3010**.
- **Domain:** `laviewaterhanoi.vn` qua Cloudflare → một máy nginx khác (`119.17.200.65`, không phải
  server ứng dụng) → `proxy_pass http://192.168.68.109:3010`. TLS chỉ có ở tầng Cloudflare
  (Cloudflare SSL mode: **Flexible**) — bản thân app chạy HTTP thuần, đây là lý do CSP tắt
  `upgradeInsecureRequests` (xem comment trong `server.js`).
- **MySQL** chạy sẵn trên chính server đó (không phải server riêng), database `bmb_vietnam`, user
  `bmb_user` — mật khẩu nằm trong `/opt/bmb-vietnam/.env` trên server, **không có trong repo**.
- **Quy trình deploy thủ công** (chưa có CI/CD):
  ```bash
  rsync -avz --exclude node_modules --exclude .git --exclude .env --exclude 'public/uploads/*' \
    ./ dev@192.168.68.109:/tmp/bmb-deploy/
  ssh dev@192.168.68.109 '
    sudo rsync -a --exclude .env --exclude "public/uploads/*" --exclude node_modules \
      /tmp/bmb-deploy/ /opt/bmb-vietnam/
    sudo chown -R bmbvietnam:bmbvietnam /opt/bmb-vietnam
    rm -rf /tmp/bmb-deploy
    sudo -u bmbvietnam bash -c "cd /opt/bmb-vietnam && npm install"
    sudo -u bmbvietnam bash -c "cd /opt/bmb-vietnam && npx tailwindcss -i ./src/input.css -o ./public/css/style.css --minify"
    sudo systemctl restart bmb-vietnam.service
  '
  ```
  Luôn `--exclude .env` và `--exclude 'public/uploads/*'` — 2 thứ này chỉ tồn tại trên server, rsync
  đè lên sẽ xoá mất cấu hình thật hoặc ảnh khách hàng đã upload.
- **Xem log lỗi khi có sự cố:** `sudo journalctl -u bmb-vietnam.service -n 100 --no-pager`

---

## 8. Việc nên làm tiếp theo (chưa làm)

- [ ] Thay toàn bộ ảnh SVG minh hoạ sản phẩm bằng ảnh chụp thật.
- [ ] Submit `sitemap.xml` lên Google Search Console, tạo Google Business Profile cho địa chỉ kho.
- [ ] Cân nhắc thêm CI (GitHub Actions) tự build + deploy thay vì chạy tay qua SSH.
- [ ] Thêm theme thứ 3 (Phương án C — "Cao cấp", đã có mockup trong buổi review nhưng chưa lên code
      thật, chỉ mới làm 2 theme "Tin cậy" và "Năng động").
- [ ] Cân nhắc thêm test tự động (hiện chưa có test nào, toàn bộ kiểm thử đang làm thủ công qua
      trình duyệt).
- [ ] Danh mục (`/admin/danh-muc`) hiện chỉ là danh sách gợi ý cho dropdown — sản phẩm/bài viết lưu
      **tên danh mục dạng text**, không phải khoá ngoại tới bảng `categories`. Đổi tên danh mục sẽ
      **không** tự cập nhật các sản phẩm/bài viết đã lưu trước đó. Nếu cần tính nhất quán chặt hơn
      (đổi tên 1 chỗ, cập nhật khắp nơi), cân nhắc migrate sang khoá ngoại `category_id` thật.
- [ ] Quảng cáo 2 bên hiện chưa đo lượt click/hiển thị (không có analytics riêng cho banner).

## 9. Repo

- GitHub: https://github.com/luckylucky2017/bmb-web (nhánh `main`)
- Lịch sử commit đầy đủ, message giải thích rõ lý do từng thay đổi — nên đọc `git log` khi cần hiểu
  bối cảnh của một đoạn code cụ thể.
