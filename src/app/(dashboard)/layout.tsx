import { auth } from "@/auth";
import { Sidebar } from "@/components/common/sidebar";
import { Header } from "@/components/common/header";
import { MobileNav } from "@/components/common/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pb-20 lg:pb-0 min-w-0">
        <Header user={session?.user} />
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
