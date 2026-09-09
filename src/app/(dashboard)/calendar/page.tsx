import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <span>Interactive Learning Calendar</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visual schedule of planned topics, 45-minute focus blocks, and upcoming spaced revision dates.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Visualizer</CardTitle>
          <CardDescription>Month, week, and day view integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-20 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
            FullCalendar integration will render here in Phase 8 with color-coded tasks, focus blocks, and revision events.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
