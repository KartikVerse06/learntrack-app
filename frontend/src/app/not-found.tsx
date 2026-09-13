import Link from "next/link";
import { BookX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
        <BookX className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Page Not Found
      </h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        The learning page, task, or revision milestone you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Button asChild variant="default" className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
