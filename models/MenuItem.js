const { pool } = require("../db/database");

const MenuItem = {
  async all({ status } = {}) {
    let sql = "SELECT * FROM menu_items";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY sort_order ASC, id ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM menu_items WHERE id = ?", [id]);
    return rows[0];
  },
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO menu_items (label, url, open_new_tab, status, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [data.label, data.url, data.open_new_tab ? 1 : 0, data.status === "hidden" ? "hidden" : "active", parseInt(data.sort_order, 10) || 0]
    );
    return result.insertId;
  },
  async update(id, data) {
    await pool.query(
      `UPDATE menu_items SET label = ?, url = ?, open_new_tab = ?, status = ?, sort_order = ? WHERE id = ?`,
      [data.label, data.url, data.open_new_tab ? 1 : 0, data.status === "hidden" ? "hidden" : "active", parseInt(data.sort_order, 10) || 0, id]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM menu_items WHERE id = ?", [id]);
  }
};

module.exports = MenuItem;
