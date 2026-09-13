import dynamic from "next/dynamic";
import { requireAuth } from "@/lib/session";
import { Loader2 } from "lucide-react";

const CalendarClient = dynamic(
  () => import("@/features/calendar/calendar-client").then((mod) => mod.CalendarClient),
  {
    ssr: false,
    loading: () => (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading interactive learning calendar...</p>
      </div>
    ),
  }
);

export default async function CalendarPage() {
  await requireAuth();

  return <CalendarClient />;
}
