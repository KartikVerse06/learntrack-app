import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { LoginSchema } from "@/server/validators/auth";
import { findUserByEmail, verifyPassword } from "@/server/repositories/user-repository";

const authSecret = process.env.AUTH_SECRET;
if (!authSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "CRITICAL SECURITY CONFIGURATION ERROR: AUTH_SECRET must be defined in production environments."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await findUserByEmail(parsed.data.email);
        if (!user) return null;

        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  secret: authSecret || "development-fallback-secret-for-learn-track-auth",
});
