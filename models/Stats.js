const { pool } = require("../db/database");

const METRICS = ["visits", "call_clicks", "zalo_clicks", "facebook_clicks"];

const Stats = {
  METRICS,
  async increment(metric) {
    if (!METRICS.includes(metric)) return;
    await pool.query(
      `INSERT INTO site_stats (metric, count) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE count = count + 1`,
      [metric]
    );
  },
  async getAll() {
    const [rows] = await pool.query("SELECT metric, count FROM site_stats");
    const map = Object.fromEntries(METRICS.map((m) => [m, 0]));
    rows.forEach((r) => {
      map[r.metric] = r.count;
    });
    return map;
  }
};

module.exports = Stats;
