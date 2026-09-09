import { CalendarRange, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PlannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" />
            <span>Daily Learning Planner</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Structure your learning agenda, set priorities, and track 45-minute focus session estimates.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Learning Task</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Agenda</CardTitle>
          <CardDescription>Planned tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
            No tasks planned yet. Click &quot;Add Learning Task&quot; to schedule your first topic.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
