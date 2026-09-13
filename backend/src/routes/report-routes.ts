import { Router } from "express";
import { getStats, downloadReport } from "../controllers/report-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getStats);
router.get("/download", downloadReport);

export default router;
