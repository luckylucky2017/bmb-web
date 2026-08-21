const { pool } = require("../db/database");
const bcrypt = require("bcryptjs");

const User = {
  async all() {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, avatar, active, created_at FROM users ORDER BY id ASC"
    );
    return rows;
  },
  async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, avatar, active, created_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  },
  async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },
  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },
  async create(data) {
    const hash = bcrypt.hashSync(data.password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [data.name, data.email, hash, data.role || "editor"]
    );
    return result.insertId;
  },
  async update(id, data) {
    if (data.password) {
      const hash = bcrypt.hashSync(data.password, 10);
      await pool.query(
        "UPDATE users SET name=?, email=?, role=?, active=?, password_hash=? WHERE id=?",
        [data.name, data.email, data.role, data.active ? 1 : 0, hash, id]
      );
    } else {
      await pool.query("UPDATE users SET name=?, email=?, role=?, active=? WHERE id=?", [
        data.name,
        data.email,
        data.role,
        data.active ? 1 : 0,
        id
      ]);
    }
  },
  async delete(id) {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
  }
};

module.exports = User;
