import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const token = cookies.get("learntrack_token")?.value || cookies.get("token")?.value;
  const isAuthenticated = !!token;

  const isRootRoute = nextUrl.pathname === "/";

  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/planner") ||
    nextUrl.pathname.startsWith("/focus") ||
    nextUrl.pathname.startsWith("/revisions") ||
    nextUrl.pathname.startsWith("/calendar") ||
    nextUrl.pathname.startsWith("/analytics") ||
    nextUrl.pathname.startsWith("/money") ||
    nextUrl.pathname.startsWith("/reports") ||
    nextUrl.pathname.startsWith("/settings") ||
    nextUrl.pathname.startsWith("/tasks") ||
    nextUrl.pathname.startsWith("/learning-logs");

  // Root route: resolve auth state explicitly before redirecting.
  // authenticated → /dashboard, unauthenticated → /login (never /dashboard blindly).
  if (isRootRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  const response = NextResponse.next();
  if (isProtectedRoute) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.js|sounds|icons).*)",
  ],
};
