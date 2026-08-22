const { pool } = require("../db/database");
const { slugify } = require("./Product");

const Category = {
  async all({ type } = {}) {
    let sql = "SELECT * FROM categories";
    const params = [];
    if (type) {
      sql += " WHERE type = ?";
      params.push(type);
    }
    sql += " ORDER BY sort_order ASC, name ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
    return rows[0];
  },
  async create(data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const [result] = await pool.query(
      `INSERT INTO categories (type, name, slug, sort_order) VALUES (?, ?, ?, ?)`,
      [data.type === "post" ? "post" : "product", data.name, slug, parseInt(data.sort_order, 10) || 0]
    );
    return result.insertId;
  },
  async update(id, data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    await pool.query(
      `UPDATE categories SET type = ?, name = ?, slug = ?, sort_order = ? WHERE id = ?`,
      [data.type === "post" ? "post" : "product", data.name, slug, parseInt(data.sort_order, 10) || 0, id]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
  }
};

module.exports = Category;
