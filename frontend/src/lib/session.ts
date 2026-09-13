import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMeApi } from "./api/auth";

export async function getSessionToken(): Promise<string | undefined> {
  try {
    const cookieStore = cookies();
    return (
      cookieStore.get("learntrack_token")?.value ||
      cookieStore.get("token")?.value
    );
  } catch {
    return undefined;
  }
}

export async function requireAuth() {
  const token = await getSessionToken();
  if (!token) {
    redirect("/login");
  }

  const res = await getMeApi(token);
  if (!res.success || !res.data?.user) {
    redirect("/login");
  }

  return {
    token,
    userId: res.data.user.id,
    user: res.data.user,
  };
}

export async function getCurrentUser() {
  try {
    const token = await getSessionToken();
    if (!token) return null;
    const res = await getMeApi(token);
    return res.success ? res.data?.user ?? null : null;
  } catch {
    return null;
  }
}
