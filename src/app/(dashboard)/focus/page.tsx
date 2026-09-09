import { Timer, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FocusPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] space-y-8 max-w-xl mx-auto text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Timer className="h-6 w-6 text-emerald-600" />
          <span>45-Minute Focus Block</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Deliberate single-task practice without multitasking or distractions.
        </p>
      </div>

      <Card className="w-full p-8 shadow-md border-emerald-200/50 dark:border-emerald-950/50">
        <CardContent className="flex flex-col items-center space-y-8 p-0">
          <div className="text-7xl md:text-8xl font-mono font-bold tracking-tighter text-foreground py-4 tabular-nums">
            45:00
          </div>
          <div className="flex items-center gap-4">
            <Button size="lg" variant="focus" className="gap-2 px-8">
              <Play className="h-5 w-5" />
              <span>Start Focus</span>
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        Timestamp-based delta tracking with audio chime and browser notification alerts upon completion.
      </p>
    </div>
  );
}
