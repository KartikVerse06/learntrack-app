import { Router } from "express";
import { getCategories, createNewCategory } from "../controllers/category-controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCategories);
router.post("/", createNewCategory);

export default router;
