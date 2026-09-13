import { Router } from "express";
import {
  getSummary,
  getHistory,
  setBudget,
  createExpenseEntry,
  removeExpense,
} from "../controllers/money-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/summary", getSummary);
router.get("/history", getHistory);
router.post("/budget", setBudget);
router.post("/expenses", createExpenseEntry);
router.delete("/expenses/:id", removeExpense);

export default router;
