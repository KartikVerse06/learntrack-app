import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/index.js";

export interface TokenPayload {
  userId: string;
  email: string;
  name?: string | null;
}

export function signToken(payload: TokenPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string {
  return jwt.sign(payload, config.authSecret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.authSecret) as TokenPayload;
  } catch {
    return null;
  }
}
