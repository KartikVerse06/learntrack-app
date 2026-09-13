import { Router } from "express";
import authRoutes from "./auth-routes.js";
import taskRoutes from "./task-routes.js";
import focusRoutes from "./focus-routes.js";
import learningLogRoutes from "./learning-log-routes.js";
import revisionRoutes from "./revision-routes.js";
import calendarRoutes from "./calendar-routes.js";
import analyticsRoutes from "./analytics-routes.js";
import moneyRoutes from "./money-routes.js";
import reportRoutes from "./report-routes.js";
import categoryRoutes from "./category-routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/focus", focusRoutes);
router.use("/learning-logs", learningLogRoutes);
router.use("/revisions", revisionRoutes);
router.use("/calendar", calendarRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/money", moneyRoutes);
router.use("/reports", reportRoutes);
router.use("/categories", categoryRoutes);

export default router;
