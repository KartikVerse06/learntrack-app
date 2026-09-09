import bcrypt from "bcryptjs";

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory data store for Phase 2 authentication validation (swaps to Prisma in Phase 3)
const globalUsers = globalThis as unknown as { __learntrack_users?: Map<string, UserRecord> };
if (!globalUsers.__learntrack_users) {
  globalUsers.__learntrack_users = new Map<string, UserRecord>();

  // Pre-seed default test learner account
  const defaultSalt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync("Password123!", defaultSalt);

  const demoUser: UserRecord = {
    id: "usr_demo_learner_01",
    name: "Alex Learner",
    email: "demo@learntrack.app",
    passwordHash: defaultHash,
    timezone: "UTC",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  globalUsers.__learntrack_users.set(demoUser.email.toLowerCase(), demoUser);
}

const users = globalUsers.__learntrack_users;

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  return users.get(normalized) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  for (const user of Array.from(users.values())) {
    if (user.id === id) return user;
  }
  return null;
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  timezone?: string;
}): Promise<UserRecord> {
  const normalized = data.email.trim().toLowerCase();
  if (users.has(normalized)) {
    throw new Error("A user with this email address already exists.");
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newUser: UserRecord = {
    id,
    name: data.name.trim(),
    email: normalized,
    passwordHash: data.passwordHash,
    timezone: data.timezone ?? "UTC",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.set(normalized, newUser);
  return newUser;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
