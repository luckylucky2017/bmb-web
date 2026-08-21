const { pool } = require("../db/database");

function parseRow(row) {
  if (!row) return row;
  return { ...row, highlights: row.highlights ? JSON.parse(row.highlights) : [] };
}

function slugify(str) {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const Product = {
  async all({ status } = {}) {
    let sql = "SELECT * FROM products";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY sort_order ASC, id DESC";
    const [rows] = await pool.query(sql, params);
    return rows.map(parseRow);
  },
  async count({ status } = {}) {
    let sql = "SELECT COUNT(*) as c FROM products";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    return parseRow(rows[0]);
  },
  async findBySlug(slug) {
    const [rows] = await pool.query("SELECT * FROM products WHERE slug = ?", [slug]);
    return parseRow(rows[0]);
  },
  async related(excludeId, limit = 3) {
    const [rows] = await pool.query(
      "SELECT * FROM products WHERE id != ? AND status = 'published' ORDER BY RAND() LIMIT ?",
      [excludeId, limit]
    );
    return rows.map(parseRow);
  },
  async create(data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const highlights = JSON.stringify(
      (data.highlights || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const [result] = await pool.query(
      `INSERT INTO products (slug, name, category, volume, price, image, short_description, description, highlights, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        data.name,
        data.category || "",
        data.volume || "",
        parseInt(data.price, 10) || 0,
        data.image || "/images/products/product-500.svg",
        data.short_description || "",
        data.description || "",
        highlights,
        data.status || "published",
        data.sort_order || 0
      ]
    );
    return result.insertId;
  },
  async update(id, data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const highlights = JSON.stringify(
      (data.highlights || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    await pool.query(
      `UPDATE products SET
        slug = ?, name = ?, category = ?, volume = ?, price = ?,
        image = ?, short_description = ?, description = ?,
        highlights = ?, status = ?
       WHERE id = ?`,
      [
        slug,
        data.name,
        data.category || "",
        data.volume || "",
        parseInt(data.price, 10) || 0,
        data.image,
        data.short_description || "",
        data.description || "",
        highlights,
        data.status || "published",
        id
      ]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM products WHERE id = ?", [id]);
  },
  slugify
};

module.exports = Product;
