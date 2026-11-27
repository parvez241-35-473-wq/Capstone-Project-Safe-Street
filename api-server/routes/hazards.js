import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";
import { pool } from "../db/connection.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

const hazardSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.enum([
    "pothole", "broken_streetlight", "waterlogging", "open_manhole",
    "damaged_road", "traffic_signal_failure", "other",
  ]),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().min(3, "Address is required."),
});

// GET /api/hazards - public, with filters
router.get("/", async (req, res) => {
  const { search, category, status } = req.query;
  const clauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(h.title ILIKE $${params.length} OR h.address ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    clauses.push(`h.category = $${params.length}`);
  }
  if (status) {
    params.push(status);
    clauses.push(`h.status = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT h.*, u.full_name AS reporter_name
       FROM hazards h
       JOIN users u ON u.id = h.reported_by
       ${where}
       ORDER BY h.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hazards." });
  }
});

// GET /api/hazards/stats - public aggregate stats
router.get("/stats", async (_req, res) => {
  try {
    const totals = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'reported')::int AS reported,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved
      FROM hazards
    `);
    const byCategory = await pool.query(`
      SELECT category, COUNT(*)::int AS count FROM hazards GROUP BY category ORDER BY count DESC
    `);
    const byStatus = await pool.query(`
      SELECT status, COUNT(*)::int AS count FROM hazards GROUP BY status
    `);
    res.json({ totals: totals.rows[0], byCategory: byCategory.rows, byStatus: byStatus.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// GET /api/hazards/my - current user's reports
router.get("/my", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, u.full_name AS reporter_name
       FROM hazards h JOIN users u ON u.id = h.reported_by
       WHERE h.reported_by = $1
       ORDER BY h.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch your reports." });
  }
});

// GET /api/hazards/:id
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, u.full_name AS reporter_name
       FROM hazards h JOIN users u ON u.id = h.reported_by
       WHERE h.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Hazard not found." });
    }

    let userHasVoted = false;
    if (req.user) {
      const voteCheck = await pool.query(
        "SELECT 1 FROM votes WHERE user_id = $1 AND hazard_id = $2",
        [req.user.id, req.params.id]
      );
      userHasVoted = voteCheck.rows.length > 0;
    }

    res.json({ ...result.rows[0], userHasVoted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hazard." });
  }
});

// POST /api/hazards - authenticated
router.post("/", requireAuth, async (req, res) => {
  const parsed = hazardSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { title, description, category, latitude, longitude, address } = parsed.data;

  try {
    const result = await pool.query(
      `INSERT INTO hazards (title, description, category, latitude, longitude, address, reported_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, category, latitude, longitude, address, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create hazard report." });
  }
});

// PUT /api/hazards/:id - owner or admin
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM hazards WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Hazard not found." });
    }
    const hazard = existing.rows[0];
    const isOwner = hazard.reported_by === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can only edit your own reports." });
    }

    const allowedFields = ["title", "description", "category", "latitude", "longitude", "address"];
    if (isAdmin) allowedFields.push("status");

    const updates = [];
    const params = [];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }
    params.push(req.params.id);
    updates.push("updated_at = now()");

    const result = await pool.query(
      `UPDATE hazards SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );

    // Notify report owner if status changed
    if (req.body.status && req.body.status !== hazard.status) {
      const statusLabel = req.body.status.replace("_", " ");
      await pool.query(
        `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
        [hazard.reported_by, `Your report "${hazard.title}" status changed to ${statusLabel}.`]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update hazard." });
  }
});

// DELETE /api/hazards/:id - owner or admin
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await pool.query("SELECT * FROM hazards WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Hazard not found." });
    }
    const hazard = existing.rows[0];
    const isOwner = hazard.reported_by === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can only delete your own reports." });
    }

    await pool.query("DELETE FROM hazards WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete hazard." });
  }
});

// POST /api/hazards/:id/upvote - toggle
router.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const hazardCheck = await pool.query("SELECT id FROM hazards WHERE id = $1", [req.params.id]);
    if (hazardCheck.rows.length === 0) {
      return res.status(404).json({ error: "Hazard not found." });
    }

    const existingVote = await pool.query(
      "SELECT id FROM votes WHERE user_id = $1 AND hazard_id = $2",
      [req.user.id, req.params.id]
    );

    let voted;
    if (existingVote.rows.length > 0) {
      await pool.query("DELETE FROM votes WHERE id = $1", [existingVote.rows[0].id]);
      voted = false;
    } else {
      await pool.query("INSERT INTO votes (user_id, hazard_id) VALUES ($1, $2)", [req.user.id, req.params.id]);
      voted = true;
    }

    const updated = await pool.query(
      `UPDATE hazards SET upvotes = (SELECT COUNT(*) FROM votes WHERE hazard_id = $1) WHERE id = $1 RETURNING upvotes`,
      [req.params.id]
    );

    res.json({ voted, upvotes: updated.rows[0].upvotes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle upvote." });
  }
});

// POST /api/hazards/:id/image - upload/replace hazard image
router.post("/:id/image", requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }
    const existing = await pool.query("SELECT * FROM hazards WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Hazard not found." });
    }
    const hazard = existing.rows[0];
    const isOwner = hazard.reported_by === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can only update images on your own reports." });
    }

    const imageUrl = `/api/uploads/${req.file.filename}`;
    const result = await pool.query(
      "UPDATE hazards SET image_url = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [imageUrl, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload image." });
  }
});

export default router;
