const { pool } = require("../db/database");

const AdBanner = {
  async all({ position, status } = {}) {
    let sql = "SELECT * FROM ad_banners WHERE 1=1";
    const params = [];
    if (position) {
      sql += " AND position = ?";
      params.push(position);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY sort_order ASC, id ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM ad_banners WHERE id = ?", [id]);
    return rows[0];
  },
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO ad_banners (position, image, link_url, alt_text, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.position === "right" ? "right" : "left",
        data.image,
        data.link_url || "",
        data.alt_text || "",
        data.status === "hidden" ? "hidden" : "active",
        parseInt(data.sort_order, 10) || 0
      ]
    );
    return result.insertId;
  },
  async update(id, data) {
    await pool.query(
      `UPDATE ad_banners SET position = ?, image = ?, link_url = ?, alt_text = ?, status = ?, sort_order = ? WHERE id = ?`,
      [
        data.position === "right" ? "right" : "left",
        data.image,
        data.link_url || "",
        data.alt_text || "",
        data.status === "hidden" ? "hidden" : "active",
        parseInt(data.sort_order, 10) || 0,
        id
      ]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM ad_banners WHERE id = ?", [id]);
  }
};

module.exports = AdBanner;
