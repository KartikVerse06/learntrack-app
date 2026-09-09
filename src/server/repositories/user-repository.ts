import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!user || !user.passwordHash) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || !user.passwordHash) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    timezone: user.timezone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  timezone?: string;
}): Promise<UserRecord> {
  const normalized = data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (existing) {
    throw new Error("A user with this email address already exists.");
  }

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: normalized,
      passwordHash: data.passwordHash,
      timezone: data.timezone ?? "UTC",
      settings: {
        create: {
          defaultFocusDuration: 2700,
          soundEnabled: true,
          soundVolume: 0.8,
          soundChoice: "bell",
          notificationsEnabled: true,
        },
      },
    },
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    passwordHash: newUser.passwordHash ?? data.passwordHash,
    timezone: newUser.timezone,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
