import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/repositories/user-repository";

describe("Password Hashing & Verification", () => {
  it("should generate salted hash and verify correctly", async () => {
    const plain = "SecretStudyPassword2026!";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix

    const isMatch = await verifyPassword(plain, hash);
    expect(isMatch).toBe(true);
  });

  it("should reject incorrect password comparison", async () => {
    const plain = "CorrectPassword123!";
    const hash = await hashPassword(plain);

    const isMatch = await verifyPassword("WrongPassword456!", hash);
    expect(isMatch).toBe(false);
  });
});
