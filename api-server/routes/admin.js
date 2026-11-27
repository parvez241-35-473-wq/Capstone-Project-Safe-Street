import { Router } from "express";
import { pool } from "../db/connection.js";
import { requireAuth } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/adminOnly.js";

const router = Router();

router.use(requireAuth, adminOnly);

router.get("/stats", async (_req, res) => {
  try {
    const totals = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM hazards) AS total_reports,
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM hazards WHERE status = 'resolved') AS resolved,
        (SELECT COUNT(*)::int FROM hazards WHERE status = 'reported') AS pending,
        (SELECT COUNT(*)::int FROM hazards WHERE status = 'in_progress') AS in_progress
    `);
    const byCategory = await pool.query(`
      SELECT category, COUNT(*)::int AS count FROM hazards GROUP BY category ORDER BY count DESC
    `);
    const byStatus = await pool.query(`
      SELECT status, COUNT(*)::int AS count FROM hazards GROUP BY status
    `);
    const recent = await pool.query(`
      SELECT h.*, u.full_name AS reporter_name FROM hazards h
      JOIN users u ON u.id = h.reported_by
      ORDER BY h.created_at DESC LIMIT 5
    `);
    const mostReportedCategory = byCategory.rows[0]?.category || null;

    res.json({
      ...totals.rows[0],
      mostReportedCategory,
      byCategory: byCategory.rows,
      byStatus: byStatus.rows,
      recent: recent.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.role, u.created_at,
        (SELECT COUNT(*)::int FROM hazards h WHERE h.reported_by = u.id) AS report_count
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Admins cannot delete their own account." });
  }
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

export default router;
