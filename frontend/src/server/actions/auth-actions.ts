"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginApi, registerApi, logoutApi } from "@/lib/api/auth";
import type { ActionResult } from "@/types";

export async function loginUserAction(
  rawInput: {
    email: string;
    password: string;
  },
  callbackUrl?: string
): Promise<ActionResult<any>> {
  const res = await loginApi(rawInput);
  if (!res.success || !res.data) {
    return {
      success: false,
      error: {
        code: res.error?.code || "LOGIN_FAILED",
        message: res.error?.message || "Invalid credentials.",
      },
    };
  }

  // Set auth cookie in Next.js Server Action
  const cookieStore = cookies();
  cookieStore.set("learntrack_token", res.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return {
    success: true,
    data: res.data.user,
  };
}

export async function registerUserAction(rawInput: {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}): Promise<ActionResult<any>> {
  const res = await registerApi(rawInput);
  if (!res.success || !res.data) {
    return {
      success: false,
      error: {
        code: res.error?.code || "REGISTRATION_FAILED",
        message: res.error?.message || "Registration failed.",
      },
    };
  }

  const cookieStore = cookies();
  cookieStore.set("learntrack_token", res.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return {
    success: true,
    data: res.data.user,
  };
}

export async function signOutAction(): Promise<void> {
  await logoutApi();
  const cookieStore = cookies();
  cookieStore.delete("learntrack_token");
  redirect("/login");
}
