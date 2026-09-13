import { Router } from "express";
import {
  getActive,
  getSession,
  startSession,
  pause,
  resume,
  complete,
  cancel,
} from "../controllers/focus-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/active", getActive);
router.get("/:id", getSession);
router.post("/start", startSession);
router.post("/:id/pause", pause);
router.post("/:id/resume", resume);
router.post("/:id/complete", complete);
router.post("/:id/cancel", cancel);

export default router;
