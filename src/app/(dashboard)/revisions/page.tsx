import { Repeat, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RevisionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="h-6 w-6 text-purple-600" />
            <span>Spaced Revision Center</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Defeat the forgetting curve via 4 automated retention milestones: Day 0, +3, +15, and +30.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1 px-3 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
          <ShieldCheck className="h-4 w-4" />
          <span>Full Mastery: All 4 Required</span>
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Due & Upcoming Revisions</CardTitle>
          <CardDescription>Scheduled active recall sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
            No revisions scheduled yet. Mark a learning task as completed to initiate its 30-day revision cycle.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
