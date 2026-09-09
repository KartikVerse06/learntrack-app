import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required to access this resource.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Server-side guard to guarantee zero-trust user isolation.
 * Extracts verified user ID directly from the authenticated session.
 * Never trust a client-supplied user ID!
 */
export async function requireAuth(): Promise<{ userId: string; userEmail: string; userName: string | null }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email ?? "",
    userName: session.user.name ?? null,
  };
}
