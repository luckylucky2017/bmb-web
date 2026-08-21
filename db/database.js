const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bmb_vietnam"
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

async function ensureSchema() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function isFreshDatabase() {
  const [rows] = await pool.query("SELECT COUNT(*) as c FROM users");
  return rows[0].c === 0;
}

async function seed() {
  const { products } = require("../data/products");
  const { news } = require("../data/news");
  const { distributors } = require("../data/distributors");
  const { jobs } = require("../data/jobs");

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    await pool.query(
      `INSERT INTO products (slug, name, category, volume, price, image, short_description, description, highlights, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
      [
        p.slug,
        p.name,
        p.category,
        p.volume,
        parseInt(String(p.price).replace(/[^\d]/g, ""), 10) || 0,
        p.image,
        p.shortDescription,
        p.description,
        JSON.stringify(p.highlights || []),
        i
      ]
    );
  }

  for (const n of news) {
    const htmlContent = n.content
      .split("\n\n")
      .map((para) => `<p>${para.trim()}</p>`)
      .join("\n");
    await pool.query(
      `INSERT INTO posts (slug, title, category, excerpt, content, image, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`,
      [n.slug, n.title, n.category, n.excerpt, htmlContent, n.image, n.date]
    );
  }

  let order = 0;
  for (const group of distributors) {
    for (const d of group.items) {
      await pool.query(
        `INSERT INTO distributors (region, name, city, address, phone, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [group.region, d.name, d.city, d.address, d.phone, order++]
      );
    }
  }

  for (const j of jobs) {
    await pool.query(
      `INSERT INTO jobs (title, department, location, type, description)
       VALUES (?, ?, ?, ?, ?)`,
      [j.title, j.department, j.location, j.type, j.description || ""]
    );
  }

  const defaultSettings = {
    site_name: "BMB Việt Nam",
    company_full_name: "Công ty TNHH BMB Việt Nam",
    tagline: "Đại lý phân phối chính thức nước khoáng La Vie khu vực Hà Nội",
    hotline: "096 884 5580",
    hotline_2: "097 511 8889",
    email: "lienhe@bmbvietnam.vn",
    address: "Kho số 01: K15/120 phố Định Công, Hà Nội",
    address_2: "Kho số 02: A280/286 Nguyễn Xiển, Hà Nội",
    working_hours: "Thứ 2 – Chủ nhật: 7:00 – 20:00",
    facebook_url: "https://web.facebook.com/profile.php?id=100083084025572",
    zalo_url: "https://zalo.me/0968845580",
    tax_code: "0123456789"
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await pool.query(`INSERT INTO settings (\`key\`, value) VALUES (?, ?)`, [key, value]);
  }

  const passwordHash = bcrypt.hashSync("Admin@123", 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'superadmin')`,
    ["Quản trị viên", "admin@bmbvietnam.vn", passwordHash]
  );

  console.log("✔ Đã khởi tạo cơ sở dữ liệu MySQL và tài khoản quản trị mặc định:");
  console.log("  Email: admin@bmbvietnam.vn");
  console.log("  Mật khẩu: Admin@123");
}

async function init() {
  await ensureSchema();
  if (await isFreshDatabase()) {
    await seed();
  }
}

module.exports = { pool, init, dbConfig };
