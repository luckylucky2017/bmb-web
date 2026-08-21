const { pool } = require("../db/database");

function genCode() {
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BMB${ymd}${rand}`;
}

const Order = {
  async all({ status, q } = {}) {
    let sql = "SELECT * FROM orders WHERE 1=1";
    const params = [];
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (q) {
      sql += " AND (customer_name LIKE ? OR phone LIKE ? OR code LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY id DESC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async count({ status } = {}) {
    let sql = "SELECT COUNT(*) as c FROM orders";
    const params = [];
    if (status) {
      sql += " WHERE status = ?";
      params.push(status);
    }
    const [rows] = await pool.query(sql, params);
    return rows[0].c;
  },
  async revenueSum(statuses = ["confirmed", "shipping", "completed"]) {
    const placeholders = statuses.map(() => "?").join(",");
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE status IN (${placeholders})`,
      statuses
    );
    return rows[0].total;
  },
  async findById(id) {
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    const order = orders[0];
    if (!order) return null;
    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [id]);
    order.items = items;
    return order;
  },
  async createFromProduct(product, data) {
    const quantity = Math.max(1, parseInt(data.quantity, 10) || 1);
    const total = product.price * quantity;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO orders (code, customer_name, phone, email, address, note, status, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
        [genCode(), data.customer_name, data.phone, data.email || "", data.address || "", data.note || "", total]
      );
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, product.id, product.name, product.price, quantity]
      );
      await connection.commit();
      return result.insertId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },
  async updateStatus(id, status) {
    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
  },
  async delete(id) {
    await pool.query("DELETE FROM orders WHERE id = ?", [id]);
  }
};

module.exports = Order;
