const { pool } = require("../db/database");

const Job = {
  async all({ status } = {}) {
    let sql = "SELECT * FROM jobs";
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
    let sql = "SELECT COUNT(*) as c FROM jobs";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [id]);
    return rows[0];
  },
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO jobs (title, department, location, type, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.department || "",
        data.location || "",
        data.type || "Toàn thời gian",
        data.description || "",
        data.status || "open"
      ]
    );
    return result.insertId;
  },
  async update(id, data) {
    await pool.query(
      `UPDATE jobs SET title=?, department=?, location=?, type=?, description=?, status=? WHERE id=?`,
      [
        data.title,
        data.department || "",
        data.location || "",
        data.type || "Toàn thời gian",
        data.description || "",
        data.status || "open",
        id
      ]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM jobs WHERE id = ?", [id]);
  }
};

module.exports = Job;
