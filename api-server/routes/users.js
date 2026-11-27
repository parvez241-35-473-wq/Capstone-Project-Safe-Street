import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/connection.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const updateSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role, created_at, updated_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

router.put("/me", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  try {
    const result = await pool.query(
      `UPDATE users SET full_name = $1, updated_at = now() WHERE id = $2
       RETURNING id, full_name, email, role, created_at, updated_at`,
      [parsed.data.fullName, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

export default router;
