import { Router } from "express";
import authRoutes from "./auth.js";
import hazardRoutes from "./hazards.js";
import userRoutes from "./users.js";
import notificationRoutes from "./notifications.js";
import adminRoutes from "./admin.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/hazards", hazardRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

router.get("/health", (_req, res) => res.json({ status: "ok" }));

export default router;
