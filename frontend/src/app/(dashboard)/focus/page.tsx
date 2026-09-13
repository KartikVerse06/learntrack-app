import { requireAuth } from "@/lib/session";
import { getActiveFocusSessionApi } from "@/lib/api/focus";
import { getTaskByIdApi, getTasksApi } from "@/lib/api/tasks";
import type { TaskWithCategory } from "@/types";
import { getTodayISO } from "@/lib/date-utils";
import { FocusClient } from "@/features/focus/focus-client";

interface FocusPageProps {
  searchParams?: {
    taskId?: string;
  };
}

export const metadata = {
  title: "Focus Block — LearnTrack",
  description: "45-Minute Deliberate Single-Task Focus Session",
};

export default async function FocusPage({ searchParams }: FocusPageProps) {
  const { token } = await requireAuth();

  // 1. Fetch any currently running or paused session for this user
  const activeRes = await getActiveFocusSessionApi(token);
  const activeSession = activeRes.success && activeRes.data ? activeRes.data : null;

  // 2. If no active session and taskId provided in URL, retrieve the planned task
  let selectedTask: TaskWithCategory | null = null;
  if (!activeSession && searchParams?.taskId) {
    try {
      const taskRes = await getTaskByIdApi(searchParams.taskId, token);
      selectedTask = taskRes.success && taskRes.data ? taskRes.data : null;
    } catch {
      selectedTask = null;
    }
  }

  // 3. If no active session, fetch today's tasks for quick start
  let availableTasks: TaskWithCategory[] = [];
  if (!activeSession) {
    try {
      const tasksRes = await getTasksApi(getTodayISO(), token);
      availableTasks = tasksRes.success && tasksRes.data ? tasksRes.data : [];
    } catch {
      availableTasks = [];
    }
  }

  return (
    <FocusClient
      initialSession={activeSession}
      selectedTask={selectedTask}
      availableTasks={availableTasks}
    />
  );
}
