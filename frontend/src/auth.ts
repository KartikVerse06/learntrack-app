import { getCurrentUser } from "@/lib/session";

export async function auth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user };
}
