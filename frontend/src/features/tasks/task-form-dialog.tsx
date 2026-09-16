"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Plus, Edit2, Loader2, Sparkles, FolderPlus } from "lucide-react";
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
import { createTaskApi, updateTaskApi } from "@/lib/api/tasks";
import { createCategoryApi } from "@/lib/api/categories";
import { getClientAuthToken } from "@/lib/api/client";
import { formatDateToISO } from "@/lib/date-utils";
import type { TaskWithCategory, Category } from "@/types";

interface TaskFormValues {
  title: string;
  description: string;
  categoryId: string;
  plannedDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedSessions: number;
  status?: "PLANNED" | "IN_PROGRESS";
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
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = Boolean(taskToEdit);

  // Maintain local category list for instant additions
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    setCategoryList(categories);
  }, [categories]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  const selectedCategoryId = watch("categoryId");

  useEffect(() => {
    if (taskToEdit) {
      reset({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        categoryId: taskToEdit.categoryId || "",
        plannedDate: taskToEdit.plannedDate
          ? formatDateToISO(new Date(taskToEdit.plannedDate))
          : defaultDate,
        priority: taskToEdit.priority,
        estimatedSessions: taskToEdit.estimatedSessions,
        status: (taskToEdit.status === "IN_PROGRESS" ? "IN_PROGRESS" : "PLANNED") as "PLANNED" | "IN_PROGRESS",
      });
    } else {
      reset({
        title: "",
        description: "",
        categoryId: "",
        plannedDate: defaultDate,
        priority: "MEDIUM",
        estimatedSessions: 2,
        status: "PLANNED",
      });
    }
    setNewCategoryName("");
    setServerError(null);
  }, [taskToEdit, defaultDate, reset, open]);

  const handleCreateNewCategory = async (): Promise<string | null> => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return null;

    setIsCreatingCategory(true);
    setServerError(null);
    try {
      const token = getClientAuthToken();
      if (!token) {
        setServerError("Authentication required. Please sign in again.");
        setIsCreatingCategory(false);
        return null;
      }

      const res = await createCategoryApi({ name: trimmed, color: "#2563EB" }, token);
      if (!res.success || !res.data) {
        setServerError(res.error?.message || "Failed to create category");
        setIsCreatingCategory(false);
        return null;
      }

      const newCat: Category = res.data;
      setCategoryList((prev) => {
        if (prev.some((c) => c.id === newCat.id)) return prev;
        return [...prev, newCat];
      });
      setValue("categoryId", newCat.id);
      setNewCategoryName("");
      setIsCreatingCategory(false);
      return newCat.id;
    } catch (err: any) {
      setServerError(err?.message || "Error creating category");
      setIsCreatingCategory(false);
      return null;
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    setServerError(null);
    try {
      const token = getClientAuthToken();
      if (!token) {
        setServerError("Authentication required. Please sign in to create or edit tasks.");
        return;
      }

      let finalCategoryId: string | null = data.categoryId ? data.categoryId : null;

      // If user selected "__OTHER__"
      if (data.categoryId === "__OTHER__") {
        if (!newCategoryName.trim()) {
          setServerError("Please enter a name for the new category, or select an existing one.");
          return;
        }
        const createdId = await handleCreateNewCategory();
        if (!createdId) {
          // Error is already set in handleCreateNewCategory
          return;
        }
        finalCategoryId = createdId;
      }

      const payload = {
        title: data.title,
        description: data.description?.trim() ? data.description.trim() : null,
        categoryId: finalCategoryId,
        plannedDate: data.plannedDate,
        priority: data.priority,
        estimatedSessions: Number(data.estimatedSessions),
      };

      if (isEditing && taskToEdit) {
        const result = await updateTaskApi(
          taskToEdit.id,
          { ...payload, status: data.status },
          token
        );

        if (!result.success) {
          setServerError(result.error?.message || "Failed to update task.");
          return;
        }
      } else {
        const result = await createTaskApi(payload, token);
        if (!result.success) {
          setServerError(result.error?.message || "Failed to create task.");
          return;
        }
      }

      onOpenChange(false);
      router.refresh();
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
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__OTHER__">+ Other (Add New Category)</option>
              </select>

              {/* Expandable New Category Input when "Other" is selected */}
              {selectedCategoryId === "__OTHER__" && (
                <div className="space-y-2 mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 animate-in fade-in-50 duration-150">
                  <Label htmlFor="new-category-name" className="text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-primary">
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>New Category Name <span className="text-destructive">*</span></span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Saves to your categories
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateNewCategory();
                        }
                      }}
                      placeholder="e.g. System Design, Rust, Biology"
                      className="text-sm h-9 bg-background flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!newCategoryName.trim() || isCreatingCategory}
                      onClick={handleCreateNewCategory}
                      className="h-9 text-xs gap-1.5 px-3 shrink-0"
                    >
                      {isCreatingCategory ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              )}
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

          {/* Status Selection (Visible in Edit Mode) */}
          {isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="task-status" className="text-xs font-semibold">
                Task Status
              </Label>
              <select
                id="task-status"
                {...register("status")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          )}

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
