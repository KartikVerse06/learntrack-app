"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit2, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  createTaskAction,
  updateTaskAction,
} from "@/server/actions/task-actions";
import type { TaskWithCategory } from "@/server/repositories/learning-task-repository";
import type { Category } from "@/types";

interface TaskFormValues {
  title: string;
  description: string;
  categoryId: string;
  plannedDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedSessions: number;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  categories: Category[];
  taskToEdit?: TaskWithCategory | null;
  onSuccess?: () => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  defaultDate,
  categories,
  taskToEdit,
  onSuccess,
}: TaskFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(taskToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      plannedDate: defaultDate,
      priority: "MEDIUM",
      estimatedSessions: 2,
    },
  });

  useEffect(() => {
    if (taskToEdit) {
      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        categoryId: taskToEdit.categoryId || "",
        plannedDate: taskToEdit.plannedDate
          ? new Date(taskToEdit.plannedDate).toISOString().split("T")[0]
          : defaultDate,
        priority: taskToEdit.priority,
        estimatedSessions: taskToEdit.estimatedSessions,
      });
    } else {
      reset({
        title: "",
        description: "",
        categoryId: "",
        plannedDate: defaultDate,
        priority: "MEDIUM",
        estimatedSessions: 2,
      });
    }
    setServerError(null);
  }, [taskToEdit, defaultDate, reset, open]);

  const onSubmit = async (data: TaskFormValues) => {
    setServerError(null);
    try {
      const payload = {
        title: data.title,
        description: data.description?.trim() ? data.description.trim() : null,
        categoryId: data.categoryId ? data.categoryId : null,
        plannedDate: data.plannedDate,
        priority: data.priority,
        estimatedSessions: Number(data.estimatedSessions),
      };

      if (isEditing && taskToEdit) {
        const result = await updateTaskAction({
          id: taskToEdit.id,
          ...payload,
        });

        if (!result.success) {
          setServerError(result.error.message);
          return;
        }
      } else {
        const result = await createTaskAction(payload);
        if (!result.success) {
          setServerError(result.error.message);
          return;
        }
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {isEditing ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? "Edit Learning Task" : "Plan Learning Task"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update topic details, estimated focus blocks, or category."
                  : "Structure a dedicated learning topic for deliberate focus."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {serverError && (
          <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title Field */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-semibold">
              Topic Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="e.g. Distributed Consensus (Raft vs Paxos)"
              {...register("title", {
                required: "Title is required",
                minLength: { value: 3, message: "Title must be at least 3 characters" },
                maxLength: { value: 120, message: "Title cannot exceed 120 characters" },
              })}
              className="text-sm"
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description" className="text-xs font-semibold">
              Study Notes / Resources <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="task-description"
              placeholder="Key concepts to master, paper links, or chapter goals..."
              {...register("description", {
                maxLength: { value: 2000, message: "Description cannot exceed 2000 characters" },
              })}
              className="text-sm min-h-[70px]"
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Row: Category & Planned Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-category" className="text-xs font-semibold">
                Category
              </Label>
              <select
                id="task-category"
                {...register("categoryId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-date" className="text-xs font-semibold">
                Planned Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-date"
                type="date"
                {...register("plannedDate", {
                  required: "Planned date is required",
                })}
                className="text-sm font-mono"
              />
              {errors.plannedDate && (
                <p className="text-xs text-destructive">
                  {errors.plannedDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Row: Priority & Estimated 45m Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-priority" className="text-xs font-semibold">
                Priority
              </Label>
              <select
                id="task-priority"
                {...register("priority")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-sessions" className="text-xs font-semibold flex items-center justify-between">
                <span>Estimated 45m Sessions</span>
                <span className="text-muted-foreground font-normal text-[11px]">
                  (1–12 blocks)
                </span>
              </Label>
              <Input
                id="task-sessions"
                type="number"
                min={1}
                max={12}
                {...register("estimatedSessions", {
                  valueAsNumber: true,
                  min: { value: 1, message: "At least 1 session required" },
                  max: { value: 12, message: "Maximum 12 sessions allowed" },
                })}
                className="text-sm font-mono"
              />
              {errors.estimatedSessions && (
                <p className="text-xs text-destructive">
                  {errors.estimatedSessions.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{isEditing ? "Update Task" : "Add to Agenda"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
