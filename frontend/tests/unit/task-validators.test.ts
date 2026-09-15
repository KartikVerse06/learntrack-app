import { describe, it, expect } from "vitest";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
} from "@/server/validators/task";

describe("Learning Task Validators", () => {
  it("should accept valid task creation payload", () => {
    const valid = {
      title: "Binary Search Tree Invariants",
      description: "Understand left < root < right property and balance factors.",
      plannedDate: "2026-09-10",
      priority: "HIGH" as const,
      estimatedSessions: 3,
    };

    const result = CreateTaskSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Binary Search Tree Invariants");
      expect(result.data.priority).toBe("HIGH");
      expect(result.data.estimatedSessions).toBe(3);
    }
  });

  it("should reject title shorter than 3 characters", () => {
    const invalid = {
      title: "AB",
      plannedDate: "2026-09-10",
    };

    const result = CreateTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject title longer than 120 characters", () => {
    const invalid = {
      title: "A".repeat(121),
      plannedDate: "2026-09-10",
    };

    const result = CreateTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject malformed date format", () => {
    const invalid = {
      title: "Data Structures Review",
      plannedDate: "10-09-2026", // DD-MM-YYYY instead of YYYY-MM-DD
    };

    const result = CreateTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject estimatedSessions below 1 or above 12", () => {
    const tooLow = {
      title: "Valid Title Here",
      plannedDate: "2026-09-10",
      estimatedSessions: 0,
    };
    expect(CreateTaskSchema.safeParse(tooLow).success).toBe(false);

    const tooHigh = {
      title: "Valid Title Here",
      plannedDate: "2026-09-10",
      estimatedSessions: 13,
    };
    expect(CreateTaskSchema.safeParse(tooHigh).success).toBe(false);
  });

  it("should accept empty string categoryId", () => {
    const withEmptyCategory = {
      title: "Graph Traversal Algorithms",
      plannedDate: "2026-09-10",
      categoryId: "",
    };

    const result = CreateTaskSchema.safeParse(withEmptyCategory);
    expect(result.success).toBe(true);
  });

  it("should validate UpdateTaskSchema requires valid CUID ID", () => {
    const missingId = {
      title: "Updated Title",
    };
    expect(UpdateTaskSchema.safeParse(missingId).success).toBe(false);

    const validUpdate = {
      id: "cmffw54450000r39g4f4b4r87",
      title: "Updated Valid Title",
      priority: "LOW" as const,
    };
    expect(UpdateTaskSchema.safeParse(validUpdate).success).toBe(true);
  });
});
