import { describe, it, expect, vi } from "vitest";
import { UnauthorizedError } from "@/lib/session";

// Mock the auth module
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/auth";
import { requireAuth } from "@/lib/session";

describe("requireAuth Zero-Trust Guard", () => {
  it("should throw UnauthorizedError when no session exists", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);

    await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
  });

  it("should throw UnauthorizedError when session user lacks an ID", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { name: "Ghost User" },
      expires: "2099-01-01",
    } as any);

    await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
  });

  it("should return verified user identity when valid session exists", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: {
        id: "usr_verified_123",
        email: "verified@learntrack.app",
        name: "Verified Learner",
      },
      expires: "2099-01-01",
    } as any);

    const identity = await requireAuth();
    expect(identity.userId).toBe("usr_verified_123");
    expect(identity.userEmail).toBe("verified@learntrack.app");
    expect(identity.userName).toBe("Verified Learner");
  });
});
