import { describe, it, expect } from "vitest";
import {
  findUserByEmail,
  findUserById,
  createUser,
  hashPassword,
} from "@/server/repositories/user-repository";

describe("User Repository Foundation", () => {
  it("should retrieve default seeded demo user", async () => {
    const demo = await findUserByEmail("demo@learntrack.app");
    expect(demo).not.toBeNull();
    expect(demo?.name).toBe("Alex Learner");
    expect(demo?.email).toBe("demo@learntrack.app");
  });

  it("should create new unique user and find by ID", async () => {
    const uniqueEmail = `test_learner_${Date.now()}@example.com`;
    const passwordHash = await hashPassword("ValidPass123!");

    const user = await createUser({
      name: "Jordan Student",
      email: uniqueEmail,
      passwordHash,
      timezone: "America/Chicago",
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(uniqueEmail);

    const retrieved = await findUserById(user.id);
    expect(retrieved?.email).toBe(uniqueEmail);
    expect(retrieved?.name).toBe("Jordan Student");
  });

  it("should prevent duplicate registration with identical email", async () => {
    const duplicateEmail = `duplicate_${Date.now()}@example.com`;
    const passwordHash = await hashPassword("ValidPass123!");

    await createUser({
      name: "User One",
      email: duplicateEmail,
      passwordHash,
    });

    await expect(
      createUser({
        name: "User Two",
        email: duplicateEmail,
        passwordHash,
      })
    ).rejects.toThrow("already exists");
  });
});
