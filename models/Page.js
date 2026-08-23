const { pool } = require("../db/database");
const { slugify } = require("./Product");
const sanitizeContent = require("./sanitizeContent");

const Page = {
  async all({ status } = {}) {
    let sql = "SELECT * FROM pages";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY title ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM pages WHERE id = ?", [id]);
    return rows[0];
  },
  async findBySlug(slug) {
    const [rows] = await pool.query("SELECT * FROM pages WHERE slug = ?", [slug]);
    return rows[0];
  },
  async create(data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const [result] = await pool.query(
      `INSERT INTO pages (slug, title, content, meta_description, status) VALUES (?, ?, ?, ?, ?)`,
      [
        slug,
        data.title,
        sanitizeContent(data.content),
        (data.meta_description || "").slice(0, 500),
        data.status === "draft" ? "draft" : "published"
      ]
    );
    return result.insertId;
  },
  async update(id, data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    await pool.query(
      `UPDATE pages SET slug = ?, title = ?, content = ?, meta_description = ?, status = ? WHERE id = ?`,
      [
        slug,
        data.title,
        sanitizeContent(data.content),
        (data.meta_description || "").slice(0, 500),
        data.status === "draft" ? "draft" : "published",
        id
      ]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM pages WHERE id = ?", [id]);
  }
};

module.exports = Page;
