const { pool } = require("../db/database");

const ContactMessage = {
  async all({ status } = {}) {
    let sql = "SELECT * FROM contact_messages";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY id DESC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async count({ status } = {}) {
    let sql = "SELECT COUNT(*) as c FROM contact_messages";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM contact_messages WHERE id = ?", [id]);
    return rows[0];
  },
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, phone, email, message) VALUES (?, ?, ?, ?)`,
      [data.name, data.phone || "", data.email || "", data.message || ""]
    );
    return result.insertId;
  },
  async updateStatus(id, status) {
    await pool.query("UPDATE contact_messages SET status = ? WHERE id = ?", [status, id]);
  },
  async delete(id) {
    await pool.query("DELETE FROM contact_messages WHERE id = ?", [id]);
  }
};

module.exports = ContactMessage;
