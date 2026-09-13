"use client";

import { useState } from "react";
import { BookOpen, Plus, Sparkles, Filter, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/tasks/task-card";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { DeleteTaskDialog } from "@/features/tasks/delete-task-dialog";
import { TaskDetailsDialog } from "@/features/tasks/task-details-dialog";
import type { TaskWithCategory } from "@/server/repositories/learning-task-repository";
import type { Category } from "@/types";

interface TaskListProps {
  tasks: TaskWithCategory[];
  currentDate: string;
  categories: Category[];
}

type StatusFilter = "ALL" | "PLANNED" | "IN_PROGRESS" | "COMPLETED";

export function TaskList({ tasks, currentDate, categories }: TaskListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskWithCategory | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithCategory | null>(null);
  const [taskForDetails, setTaskForDetails] = useState<TaskWithCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");

  const filteredTasks = tasks.filter((task) => {
    const categoryMatch =
      selectedCategory === "ALL" || task.categoryId === selectedCategory;

    let statusMatch = true;
    if (selectedStatus === "PLANNED") {
      statusMatch = task.status === "PLANNED";
    } else if (selectedStatus === "IN_PROGRESS") {
      statusMatch = task.status === "IN_PROGRESS";
    } else if (selectedStatus === "COMPLETED") {
      statusMatch =
        task.status === "LEARNING_COMPLETED" ||
        task.status === "REVISION_PENDING" ||
        task.status === "FULLY_COMPLETED";
    }

    return categoryMatch && statusMatch;
  });

  const totalSessions = tasks.reduce((sum, t) => sum + t.estimatedSessions, 0);
  const completedSessions = tasks.reduce((sum, t) => sum + t.completedSessions, 0);

  const hasActiveFilters = selectedCategory !== "ALL" || selectedStatus !== "ALL";

  const clearFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Count, Filters & Add Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border bg-card/40 backdrop-blur shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {tasks.length} {tasks.length === 1 ? "Topic" : "Topics"} Planned
            </span>
          </div>

          {tasks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 px-2.5 py-1 rounded-md border">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">
                {completedSessions} / {totalSessions} 45m blocks ({completedSessions * 45} min completed)
              </span>
            </div>
          )}
        </div>

        {/* Filter Controls & Primary Add CTA */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0">
          {/* Status Filter Tabs - Scrollable on mobile */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs max-w-full overflow-x-auto no-scrollbar">
            {(["ALL", "PLANNED", "IN_PROGRESS", "COMPLETED"] as StatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all min-h-[34px] ${
                  selectedStatus === status
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status === "ALL"
                  ? "All"
                  : status === "PLANNED"
                  ? "Planned"
                  : status === "IN_PROGRESS"
                  ? "In Progress"
                  : "Completed"}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Filter tasks by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-2.5 text-xs rounded-md border border-input bg-background font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Primary Add CTA */}
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            variant="default"
            className="gap-1.5 text-xs font-semibold h-9 min-h-[36px] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Plan Topic</span>
          </Button>
        </div>
      </div>

      {/* Empty State: No tasks planned for this date at all */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed bg-card/40 backdrop-blur">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <BookOpen className="h-7 w-7" />
          </div>
          <h4 className="text-lg font-bold text-foreground">
            No learning topics planned for this date
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mt-1.5 mb-6 leading-relaxed">
            Deliberate practice begins with a clear plan. Structure your learning agenda with 45-minute focus session estimates.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 shadow-sm font-semibold"
          >
            <Sparkles className="h-4 w-4" />
            <span>Plan Your First Topic</span>
          </Button>
        </div>
      )}

      {/* Empty State: Filter matched nothing */}
      {tasks.length > 0 && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed bg-card/20">
          <Filter className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <h4 className="text-sm font-semibold text-foreground">
            No topics match the selected filters
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            Try adjusting your category or status filter to see other planned tasks.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Filters</span>
          </Button>
        </div>
      )}

      {/* Task Cards Grid/List */}
      {filteredTasks.length > 0 && (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => setTaskToEdit(t)}
              onDelete={(t) => setTaskToDelete(t)}
              onViewDetails={(t) => setTaskForDetails(t)}
            />
          ))}
        </div>
      )}

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={taskForDetails}
        open={Boolean(taskForDetails)}
        onOpenChange={(open) => {
          if (!open) setTaskForDetails(null);
        }}
        onEdit={(t) => setTaskToEdit(t)}
        onDelete={(t) => setTaskToDelete(t)}
      />

      {/* Create / Edit Dialog */}
      <TaskFormDialog
        open={isCreateOpen || Boolean(taskToEdit)}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setTaskToEdit(null);
          }
        }}
        defaultDate={currentDate}
        categories={categories}
        taskToEdit={taskToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteTaskDialog
        task={taskToDelete}
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null);
        }}
      />
    </div>
  );
}
