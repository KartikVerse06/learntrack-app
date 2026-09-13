import { Router } from "express";
import {
  getRevisions,
  getMetrics,
  getRevisionById,
  complete,
  markLearned,
} from "../controllers/revision-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getRevisions);
router.get("/metrics", getMetrics);
router.get("/:id", getRevisionById);
router.post("/:id/complete", complete);
router.post("/mark-learned", markLearned);

export default router;
