import dynamic from "next/dynamic";
import { requireAuth } from "@/lib/session";
import { getFullAnalyticsPayload } from "@/server/repositories/analytics-repository";
import { Loader2, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Dynamically import AnalyticsClient with SSR disabled to prevent Recharts SVG ResponsiveContainer hydration errors
const AnalyticsClient = dynamic(
  () =>
    import("@/features/analytics/analytics-client").then(
      (mod) => mod.AnalyticsClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
          <div className="space-y-2 max-w-full">
            <div className="h-7 w-48 sm:w-64 bg-muted rounded-md max-w-full" />
            <div className="h-4 w-60 sm:w-80 bg-muted/60 rounded-md max-w-full" />
          </div>
          <div className="h-8 w-40 sm:w-60 bg-muted rounded-md max-w-full" />
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-7 w-20 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted/60 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading learning analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  }
);

export default async function AnalyticsPage() {
  const { userId } = await requireAuth();

  // Load initial 30-day analytics payload server-side
  const initialPayload = await getFullAnalyticsPayload(userId, "30d", "UTC");

  return <AnalyticsClient initialPayload={initialPayload} userTimezone="UTC" />;
}
