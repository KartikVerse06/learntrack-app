// Root route routing is handled entirely by the Next.js middleware (src/middleware.ts).
// Authenticated → /dashboard, Unauthenticated → /login.
// This component is never rendered in practice; the middleware redirects before it runs.
export default function RootPage() {
  return null;
}
