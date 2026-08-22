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
│   ├── database.js        # Kết nối MySQL pool + hàm init() tạo schema & seed dữ liệu mẫu lần đầu
│   └── schema.sql          # DDL đầy đủ các bảng
├── models/                 # 1 file / 1 bảng, mỗi hàm = 1 câu query đã tham số hoá (chống SQL injection)
├── routes/admin/           # Toàn bộ route /admin/* (đã có middleware requireAuth ở index.js)
├── middleware/
│   ├── auth.js             # requireAuth, requireRole('superadmin'|'admin'|'editor')
│   ├── validate.js         # Validate form công khai (liên hệ, đặt hàng)
│   ├── upload.js           # multer, giới hạn ảnh jpg/png/webp/gif (đã bỏ svg vì rủi ro XSS)
│   └── asyncHandler.js     # Bọc async route để lỗi tự rơi vào error handler, khỏi try/catch lặp lại
├── views/
│   ├── layout.ejs          # Layout trang công khai — SEO meta, JSON-LD, nạp theme qua data-theme
│   ├── partials/           # header (nav + nút gọi + FAB mobile), footer, page-header dùng chung
│   ├── pages/              # 1 file / 1 trang công khai
│   └── admin/              # Toàn bộ giao diện quản trị (layout riêng, không dùng theme công khai)
├── public/
│   ├── css/style.css       # File CSS đã build — PHẢI build lại sau khi sửa src/input.css hoặc *.ejs
│   ├── js/                 # site.js (menu mobile, popup chọn số gọi), admin.js, post-editor.js (Quill)
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
| Sản phẩm | `/admin/san-pham` | CRUD, upload ảnh, giá tiền lưu bằng số nguyên (VNĐ) |
| Tin tức | `/admin/tin-tuc` | Trình soạn thảo Quill, nội dung được **sanitize-html** trước khi lưu (chống XSS lưu trữ) |
| Khu vực giao hàng | `/admin/dai-ly` | Trước đây là "Đại lý", đã đổi ý nghĩa thành khu vực/quận huyện phục vụ |
| Tuyển dụng | `/admin/tuyen-dung` | CRUD tin tuyển dụng |
| Đơn hàng | `/admin/don-hang` | Trạng thái: `new → confirmed → shipping → completed` hoặc `cancelled` |
| Liên hệ | `/admin/lien-he` | Form liên hệ công khai đổ vào đây |
| Cài đặt | `/admin/cai-dat` | Thông tin công ty, 2 hotline, **chọn giao diện (theme)** — xem mục 6 |
| Người dùng | `/admin/nguoi-dung` | Chỉ superadmin |

Bảo mật đã áp dụng (xem `server.js`, `routes/admin/auth.js`):
- Rate-limit đăng nhập theo IP (15 lần/15 phút) **+** khoá tài khoản 15 phút sau 5 lần sai liên tiếp.
- Session ID được cấp lại (`regenerate`) khi đăng nhập thành công — chống session fixation.
- CSP nghiêm ngặt qua `helmet` — **mọi script phải là file ngoài** (`public/js/*.js`), không được
  viết `<script>` inline hay `onclick=` trong `.ejs`, sẽ bị CSP chặn im lặng.
- CSRF: chặn request POST/PUT/DELETE vào `/admin/*` nếu header Origin/Referer khác domain (kết hợp
  cookie `SameSite=Lax`).

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

## 9. Repo

- GitHub: https://github.com/luckylucky2017/bmb-web (nhánh `main`)
- Lịch sử commit đầy đủ, message giải thích rõ lý do từng thay đổi — nên đọc `git log` khi cần hiểu
  bối cảnh của một đoạn code cụ thể.
