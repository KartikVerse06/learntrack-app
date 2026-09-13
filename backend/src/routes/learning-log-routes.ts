import { Router } from "express";
import {
  getLogs,
  getSessionsWithoutLogs,
  getLogById,
  createLog,
  updateLog,
} from "../controllers/learning-log-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getLogs);
router.get("/unlogged-sessions", getSessionsWithoutLogs);
router.get("/:id", getLogById);
router.post("/", createLog);
router.patch("/:id", updateLog);

export default router;
