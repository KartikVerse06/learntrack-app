import { Request, Response } from "express";
import { createUser, findUserByEmail, hashPassword, verifyPassword } from "../repositories/user-repository.js";
import { signToken } from "../lib/jwt.js";
import { RegisterSchema, LoginSchema } from "../validators/auth.js";

function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export async function register(req: Request, res: Response) {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid registration data",
      },
    });
  }

  const { name, email, password, timezone } = parseResult.data;
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        code: "USER_ALREADY_EXISTS",
        message: "An account with this email address already exists.",
      },
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash, timezone });
  const token = signToken({ userId: user.id, email: user.email, name: user.name });

  res.cookie("token", token, getAuthCookieOptions());

  return res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  });
}

export async function login(req: Request, res: Response) {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parseResult.error.errors[0]?.message || "Invalid login credentials",
      },
    });
  }

  const { email, password } = parseResult.data;
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  }

  const token = signToken({ userId: user.id, email: user.email, name: user.name });

  res.cookie("token", token, getAuthCookieOptions());

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  });
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      },
    });
  }

  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User account not found.",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
}

export async function logout(req: Request, res: Response) {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    data: { message: "Logged out successfully" },
  });
}
