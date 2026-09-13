import { Router } from "express";
import {
  getTasks,
  getSummary,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  toggleStatus,
} from "../controllers/task-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getTasks);
router.get("/summary", getSummary);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/toggle", toggleStatus);

export default router;
