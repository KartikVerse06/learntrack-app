import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getTaskDetailsById } from "@/server/repositories/learning-task-repository";
import { getUserCategories } from "@/server/repositories/category-repository";
import { TaskDetailClient } from "@/features/tasks/task-detail-client";

interface TaskPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TaskPageProps): Promise<Metadata> {
  try {
    const { userId } = await requireAuth();
    const task = await getTaskDetailsById(userId, params.id);
    if (!task) {
      return { title: "Task Not Found | LearnTrack" };
    }
    return {
      title: `${task.title} | LearnTrack`,
      description: task.description || "Deliberate learning task detail and retention roadmap.",
    };
  } catch {
    return { title: "Learning Task | LearnTrack" };
  }
}

export default async function TaskDetailPage({ params }: TaskPageProps) {
  const { userId } = await requireAuth();

  const [task, categories] = await Promise.all([
    getTaskDetailsById(userId, params.id),
    getUserCategories(userId),
  ]);

  if (!task) {
    notFound();
  }

  return <TaskDetailClient task={task} categories={categories} />;
}
