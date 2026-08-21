const { pool } = require("../db/database");

const Setting = {
  async all() {
    const [rows] = await pool.query("SELECT `key`, value FROM settings");
    const obj = {};
    rows.forEach((r) => (obj[r.key] = r.value));
    return obj;
  },
  async get(key, fallback = "") {
    const [rows] = await pool.query("SELECT value FROM settings WHERE `key` = ?", [key]);
    return rows[0] ? rows[0].value : fallback;
  },
  async setMany(obj) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const [key, value] of Object.entries(obj)) {
        await connection.query(
          `INSERT INTO settings (\`key\`, value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [key, value]
        );
      }
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = Setting;
