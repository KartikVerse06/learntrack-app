import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getTaskByIdApi } from "@/lib/api/tasks";
import { getCategoriesApi } from "@/lib/api/categories";
import { TaskDetailClient } from "@/features/tasks/task-detail-client";

interface TaskPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TaskPageProps): Promise<Metadata> {
  try {
    const { token } = await requireAuth();
    const res = await getTaskByIdApi(params.id, token);
    const task = res.success && res.data ? res.data : null;
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
  const { token } = await requireAuth();

  const [taskRes, categoriesRes] = await Promise.all([
    getTaskByIdApi(params.id, token),
    getCategoriesApi(token),
  ]);

  const task = taskRes.success && taskRes.data ? taskRes.data : null;
  const categories = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];

  if (!task) {
    notFound();
  }

  return <TaskDetailClient task={task} categories={categories} />;
}
