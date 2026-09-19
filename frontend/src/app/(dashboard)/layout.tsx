import { auth } from "@/auth";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { MobileNav } from "@/components/common/mobile-nav";
import { AuthGuard } from "@/components/common/auth-guard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AuthGuard />

      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        <Header user={session?.user} />
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
        <Footer />
        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
