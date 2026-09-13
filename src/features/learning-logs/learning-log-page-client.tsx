"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { LearningLogForm } from "./learning-log-form";
import type { LearningLogWithRelations } from "@/server/repositories/learning-log-repository";

interface LearningLogPageClientProps {
  taskId: string;
  sessionId: string;
  taskTitle: string;
  taskCategory?: { name: string; color: string } | null;
}

export function LearningLogPageClient({
  taskId,
  sessionId,
  taskTitle,
  taskCategory,
}: LearningLogPageClientProps) {
  const router = useRouter();

  const handleSuccess = (
    log: LearningLogWithRelations,
    nextAction: "return_planner" | "another_session" | "view_task"
  ) => {
    if (nextAction === "another_session") {
      router.push(`/focus?taskId=${taskId}`);
    } else if (nextAction === "view_task") {
      router.push(`/tasks/${taskId}`);
    } else {
      router.push("/planner");
    }
  };

  return (
    <Card className="max-w-xl mx-auto shadow-md">
      <CardContent className="p-6">
        <LearningLogForm
          taskId={taskId}
          sessionId={sessionId}
          taskTitle={taskTitle}
          taskCategory={taskCategory}
          onSuccess={handleSuccess}
        />
      </CardContent>
    </Card>
  );
}
