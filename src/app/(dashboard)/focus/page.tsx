import { requireAuth } from "@/lib/session";
import { getActiveFocusSession } from "@/server/repositories/focus-session-repository";
import {
  getTaskById,
  getTasksForDate,
  type TaskWithCategory,
} from "@/server/repositories/learning-task-repository";
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
  const { userId } = await requireAuth();

  // 1. Fetch any currently running or paused session for this user
  const activeSession = await getActiveFocusSession(userId);

  // 2. If no active session and taskId provided in URL, retrieve the planned task
  let selectedTask: TaskWithCategory | null = null;
  if (!activeSession && searchParams?.taskId) {
    try {
      selectedTask = await getTaskById(userId, searchParams.taskId);
    } catch {
      selectedTask = null;
    }
  }

  // 3. If no active session, fetch today's tasks for quick start
  let availableTasks: TaskWithCategory[] = [];
  if (!activeSession) {
    try {
      availableTasks = await getTasksForDate(userId, getTodayISO());
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
