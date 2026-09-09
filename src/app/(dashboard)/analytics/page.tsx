import { BarChart3, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span>Learning Analytics & Retention</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track daily study hours, revision adherence, confidence curves, and verified practice streaks.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1 px-3 border-amber-300 bg-amber-50 text-amber-800">
          <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>Qualifying Day: &gt;= 45m Focus or 1 Revision</span>
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Focus Hours Trajectory</CardTitle>
            <CardDescription>Daily study time over last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-16 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
              Recharts bar chart integration will render here in Phase 9.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confidence & Retention Curve</CardTitle>
            <CardDescription>Average confidence score progression across Revisions 1..4</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-16 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
              Retention trajectory visualization will render here in Phase 9.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
