import { Request, Response } from "express";
import { getUserCategories, createCategory } from "../repositories/category-repository.js";
import { z } from "zod";

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
});

export async function getCategories(req: Request, res: Response) {
  const userId = req.user!.userId;
  const categories = await getUserCategories(userId);

  return res.status(200).json({
    success: true,
    data: categories,
  });
}

export async function createNewCategory(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const parseResult = CreateCategorySchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.errors[0]?.message || "Invalid category data",
        },
      });
    }

    const { name, color } = parseResult.data;
    const category = await createCategory(userId, name, color);

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: "CATEGORY_CREATE_ERROR",
        message: error?.message || "Failed to create category",
      },
    });
  }
}
