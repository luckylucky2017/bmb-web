const { pool } = require("../db/database");

const Distributor = {
  async all({ status } = {}) {
    let sql = "SELECT * FROM distributors";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    sql += " ORDER BY region ASC, sort_order ASC, id ASC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async grouped() {
    const rows = await Distributor.all({ status: "active" });
    const map = new Map();
    rows.forEach((d) => {
      if (!map.has(d.region)) map.set(d.region, []);
      map.get(d.region).push(d);
    });
    return Array.from(map.entries()).map(([region, items]) => ({ region, items }));
  },
  async count() {
    const [rows] = await pool.query("SELECT COUNT(*) as c FROM distributors");
    return rows[0].c;
  },
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM distributors WHERE id = ?", [id]);
    return rows[0];
  },
  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO distributors (region, name, city, address, phone, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.region,
        data.name,
        data.city || "",
        data.address || "",
        data.phone || "",
        data.status || "active",
        data.sort_order || 0
      ]
    );
    return result.insertId;
  },
  async update(id, data) {
    await pool.query(
      `UPDATE distributors SET region=?, name=?, city=?, address=?, phone=?, status=? WHERE id=?`,
      [data.region, data.name, data.city || "", data.address || "", data.phone || "", data.status || "active", id]
    );
  },
  async delete(id) {
    await pool.query("DELETE FROM distributors WHERE id = ?", [id]);
  }
};

module.exports = Distributor;
