"use client";

import { useState } from "react";
import { BookOpen, Plus, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/tasks/task-card";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { DeleteTaskDialog } from "@/features/tasks/delete-task-dialog";
import type { TaskWithCategory } from "@/server/repositories/learning-task-repository";
import type { Category } from "@prisma/client";

interface TaskListProps {
  tasks: TaskWithCategory[];
  currentDate: string;
  categories: Category[];
}

export function TaskList({ tasks, currentDate, categories }: TaskListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskWithCategory | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredTasks =
    selectedCategory === "ALL"
      ? tasks
      : tasks.filter((t) => t.categoryId === selectedCategory);

  const totalSessions = tasks.reduce((sum, t) => sum + t.estimatedSessions, 0);
  const completedSessions = tasks.reduce((sum, t) => sum + t.completedSessions, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar with Count & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {tasks.length} {tasks.length === 1 ? "Topic" : "Topics"} Planned
          </span>
          {tasks.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              • {completedSessions} / {totalSessions} 45m blocks finished
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter Pill Dropdown */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-background text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
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

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-2 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Learning Task</span>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed bg-card/40 backdrop-blur">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
            <BookOpen className="h-7 w-7" />
          </div>
          <h4 className="text-lg font-bold text-foreground">
            {selectedCategory === "ALL"
              ? "No learning topics planned for this date"
              : "No topics match this category filter"}
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mt-1.5 mb-6 leading-relaxed">
            Deliberate practice begins with a clear plan. Schedule a focused study module with target 45-minute blocks.
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

      {/* Task Cards Grid/List */}
      {filteredTasks.length > 0 && (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => setTaskToEdit(t)}
              onDelete={(t) => setTaskToDelete(t)}
            />
          ))}
        </div>
      )}

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
