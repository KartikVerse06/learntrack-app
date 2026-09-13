import Link from "next/link";
import { BookOpen, ArrowLeft, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TaskNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in-50 duration-200">
      <div className="p-4 rounded-full bg-muted/40 border mb-4">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Learning Task Not Found
      </h2>

      <p className="text-sm text-muted-foreground max-w-md mt-2 mb-6 leading-relaxed">
        The requested topic does not exist, may have been deleted, or you do not have permission to view it under your account.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default" className="gap-2">
          <Link href="/planner">
            <CalendarRange className="h-4 w-4" />
            <span>Return to Planner</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
