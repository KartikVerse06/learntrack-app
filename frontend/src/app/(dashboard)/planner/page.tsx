import { CalendarRange } from "lucide-react";
import { requireAuth } from "@/lib/session";
import { getTasksApi } from "@/lib/api/tasks";
import { getCategoriesApi } from "@/lib/api/categories";
import { getTodayISO } from "@/lib/date-utils";
import { DateNavigator } from "@/features/tasks/date-navigator";
import { TaskList } from "@/features/tasks/task-list";

interface PlannerPageProps {
  searchParams?: {
    date?: string;
  };
}

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const { token } = await requireAuth();

  const todayISO = getTodayISO();
  const selectedDate = searchParams?.date || todayISO;

  const [tasksRes, categoriesRes] = await Promise.all([
    getTasksApi(selectedDate, token),
    getCategoriesApi(token),
  ]);

  const tasks = tasksRes.success && tasksRes.data ? tasksRes.data : [];
  const categories = categoriesRes.success && categoriesRes.data ? categoriesRes.data : [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" />
            <span>Daily Learning Planner</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structure your learning agenda, set priorities, and track 45-minute focus session estimates.
          </p>
        </div>
      </div>

      {/* Date Navigation Strip */}
      <DateNavigator currentDate={selectedDate} />

      {/* Task Agenda List & Action Modals */}
      <TaskList
        tasks={tasks}
        currentDate={selectedDate}
        categories={categories}
      />
    </div>
  );
}
