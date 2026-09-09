import { prisma } from "@/lib/db";
import type { Category } from "@prisma/client";

/**
 * Retrieves all categories belonging strictly to the specified user.
 */
export async function getUserCategories(userId: string): Promise<Category[]> {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

/**
 * Creates a new category scoped to the authenticated user, enforcing uniqueness per user.
 */
export async function createCategory(
  userId: string,
  name: string,
  color = "#2563EB"
): Promise<Category> {
  const trimmedName = name.trim();
  const existing = await prisma.category.findUnique({
    where: {
      userId_name: {
        userId,
        name: trimmedName,
      },
    },
  });

  if (existing) {
    throw new Error(`Category "${trimmedName}" already exists for this user.`);
  }

  return prisma.category.create({
    data: {
      userId,
      name: trimmedName,
      color,
    },
  });
}

/**
 * Retrieves a single category by ID, verifying user ownership.
 */
export async function getCategoryById(
  userId: string,
  categoryId: string
): Promise<Category | null> {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
  });
}
