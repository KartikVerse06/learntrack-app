import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import {
  getUserCategories,
  createCategory,
  getCategoryById,
} from "@/server/repositories/category-repository";
import { createUser, hashPassword } from "@/server/repositories/user-repository";

describe("Database Multi-Tenant Isolation & Constraints", () => {
  it("should isolate categories between distinct users", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("Secret123!");

    const userA = await createUser({
      name: "User Alpha",
      email: `alpha_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const userB = await createUser({
      name: "User Beta",
      email: `beta_${timestamp}@example.com`,
      passwordHash: hash,
    });

    // Create category for user A
    const catA = await createCategory(userA.id, "Compiler Design", "#EF4444");

    // User A should have the category
    const alphaCats = await getUserCategories(userA.id);
    expect(alphaCats.some((c) => c.id === catA.id)).toBe(true);

    // User B should NOT have user A's category
    const betaCats = await getUserCategories(userB.id);
    expect(betaCats.some((c) => c.id === catA.id)).toBe(false);

    // User B attempting to access User A's category by ID returns null
    const unauthorizedAccess = await getCategoryById(userB.id, catA.id);
    expect(unauthorizedAccess).toBeNull();
  });

  it("should allow distinct users to have same category name, but reject duplicates for same user", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("Secret123!");

    const userA = await createUser({
      name: "User Gamma",
      email: `gamma_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const userB = await createUser({
      name: "User Delta",
      email: `delta_${timestamp}@example.com`,
      passwordHash: hash,
    });

    // Both users can create a category with the same name
    const catA = await createCategory(userA.id, "Databases", "#3B82F6");
    const catB = await createCategory(userB.id, "Databases", "#10B981");

    expect(catA.name).toBe("Databases");
    expect(catB.name).toBe("Databases");
    expect(catA.userId).not.toBe(catB.userId);

    // Creating duplicate category for user A should throw
    await expect(
      createCategory(userA.id, "Databases", "#F59E0B")
    ).rejects.toThrow('Category "Databases" already exists');
  });

  it("should enforce unique constraint on revision milestones for a learning task", async () => {
    const timestamp = Date.now();
    const hash = await hashPassword("Secret123!");

    const user = await createUser({
      name: "User Epsilon",
      email: `epsilon_${timestamp}@example.com`,
      passwordHash: hash,
    });

    const task = await prisma.learningTask.create({
      data: {
        userId: user.id,
        title: "Distributed Consensus Raft",
        plannedDate: new Date(),
        priority: "HIGH",
      },
    });

    // Create Revision 1
    const rev1 = await prisma.revision.create({
      data: {
        userId: user.id,
        learningTaskId: task.id,
        revisionNumber: 1,
        scheduledDate: new Date(),
        status: "PENDING",
      },
    });
    expect(rev1.revisionNumber).toBe(1);

    // Attempting to create duplicate Revision 1 for same task must fail unique constraint
    await expect(
      prisma.revision.create({
        data: {
          userId: user.id,
          learningTaskId: task.id,
          revisionNumber: 1,
          scheduledDate: new Date(),
          status: "PENDING",
        },
      })
    ).rejects.toThrow();
  });
});
