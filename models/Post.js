const { pool } = require("../db/database");
const { slugify } = require("./Product");

const Post = {
  async all({ status, limit } = {}) {
    let sql = "SELECT * FROM posts";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY published_at DESC, id DESC";
    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async count({ status } = {}) {
    let sql = "SELECT COUNT(*) as c FROM posts";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM posts WHERE id = ?", [id]);
    return rows[0];
  },
  async findBySlug(slug) {
    const [rows] = await pool.query("SELECT * FROM posts WHERE slug = ?", [slug]);
    return rows[0];
  },
  async related(excludeId, limit = 2) {
    const [rows] = await pool.query(
      "SELECT * FROM posts WHERE id != ? AND status = 'published' ORDER BY RAND() LIMIT ?",
      [excludeId, limit]
    );
    return rows;
  },
  async create(data, authorId) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const [result] = await pool.query(
      `INSERT INTO posts (slug, title, category, excerpt, content, image, status, author_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        data.title,
        data.category || "",
        data.excerpt || "",
        data.content || "",
        data.image || "/images/news/news-1.svg",
        data.status || "published",
        authorId,
        data.published_at || new Date().toISOString().slice(0, 10)
      ]
    );
    return result.insertId;
  },
  async update(id, data) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    await pool.query(
      `UPDATE posts SET
        slug = ?, title = ?, category = ?, excerpt = ?,
        content = ?, image = ?, status = ?, published_at = ?
       WHERE id = ?`,
      [
        slug,
        data.title,
        data.category || "",
        data.excerpt || "",
        data.content || "",
        data.image,
        data.status || "published",
        data.published_at || new Date().toISOString().slice(0, 10),
        id
      ]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM posts WHERE id = ?", [id]);
  }
};

module.exports = Post;
