import { describe, it, expect } from "vitest";
import { LoginSchema, RegisterSchema } from "@/server/validators/auth";

describe("Auth Validation Schemas", () => {
  describe("LoginSchema", () => {
    it("should accept valid credentials", () => {
      const result = LoginSchema.safeParse({
        email: "alex@example.com",
        password: "Password123!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email formats", () => {
      const result = LoginSchema.safeParse({
        email: "not-an-email",
        password: "Password123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email");
      }
    });

    it("should normalize email to lowercase and trim whitespace", () => {
      const result = LoginSchema.safeParse({
        email: "  ALEX.LEARNER@Example.COM  ",
        password: "Password123!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("alex.learner@example.com");
      }
    });

    it("should reject empty password", () => {
      const result = LoginSchema.safeParse({
        email: "alex@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RegisterSchema", () => {
    it("should accept valid registration details", () => {
      const result = RegisterSchema.safeParse({
        name: "Alex Learner",
        email: "alex@example.com",
        password: "SecurePassword1!",
        timezone: "America/New_York",
      });
      expect(result.success).toBe(true);
    });

    it("should normalize email to lowercase and trim whitespace on register", () => {
      const result = RegisterSchema.safeParse({
        name: "  Alex Learner  ",
        email: "  NEW.USER@Example.COM  ",
        password: "Password123!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("new.user@example.com");
        expect(result.data.name).toBe("Alex Learner");
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const result = RegisterSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        password: "Pass1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("8 characters"))).toBe(true);
      }
    });

    it("should reject password without numbers", () => {
      const result = RegisterSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        password: "PasswordOnlyLetters",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes("at least one number"))).toBe(true);
      }
    });

    it("should reject name shorter than 2 characters", () => {
      const result = RegisterSchema.safeParse({
        name: "A",
        email: "alex@example.com",
        password: "Password123!",
      });
      expect(result.success).toBe(false);
    });
  });
});
