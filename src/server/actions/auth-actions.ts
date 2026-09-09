"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { RegisterSchema, LoginSchema, type RegisterInput, type LoginInput } from "@/server/validators/auth";
import { createUser, findUserByEmail, hashPassword } from "@/server/repositories/user-repository";
import type { ActionResult } from "@/types";

export async function registerUserAction(
  rawInput: RegisterInput
): Promise<ActionResult<{ id: string; name: string | null; email: string }>> {
  try {
    const parseResult = RegisterSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid registration details. Please check form errors.",
          details: fieldErrors,
        },
      };
    }

    const { name, email, password, timezone } = parseResult.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        error: {
          code: "USER_EXISTS",
          message: "An account with this email address already exists.",
        },
      };
    }

    const passwordHash = await hashPassword(password);
    const newUser = await createUser({
      name,
      email,
      passwordHash,
      timezone,
    });

    return {
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    };
  } catch (error) {
    console.error("registerUserAction error:", error);
    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred during registration. Please try again.",
      },
    };
  }
}

export async function loginUserAction(
  rawInput: LoginInput,
  callbackUrl = "/dashboard"
): Promise<ActionResult<{ redirected: boolean }>> {
  try {
    const parseResult = LoginSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please enter a valid email and password.",
        },
      };
    }

    await signIn("credentials", {
      email: parseResult.data.email,
      password: parseResult.data.password,
      redirectTo: callbackUrl,
    });

    return {
      success: true,
      data: { redirected: true },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password. Please try again.",
            },
          };
        default:
          return {
            success: false,
            error: {
              code: "AUTH_ERROR",
              message: "Authentication service temporarily unavailable.",
            },
          };
      }
    }
    // Next.js redirects throw a NEXT_REDIRECT internal error which must be re-thrown
    throw error;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
