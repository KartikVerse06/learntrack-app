"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteTaskApi } from "@/lib/api/tasks";
import { getClientAuthToken, ensureClientAuthToken } from "@/lib/api/client";
import type { TaskWithCategory } from "@/types";

interface DeleteTaskDialogProps {
  task: TaskWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTaskDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const handleDelete = async () => {
    setError(null);
    try {
      setIsDeleting(true);
      let token = getClientAuthToken();
      if (!token) {
        token = await ensureClientAuthToken();
      }
      if (!token) {
        setError("Authentication required. Please sign in again.");
        return;
      }

      const apiRes = await deleteTaskApi(task.id, token);
      if (!apiRes.success) {
        setError(apiRes.error?.message || "Failed to delete task.");
        return;
      }

      onOpenChange(false);
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Delete Learning Task</DialogTitle>
              <DialogDescription className="text-xs">
                This will permanently remove this topic and any scheduled sessions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
            {error}
          </div>
        )}

        <div className="p-3 rounded-lg border bg-muted/40 text-sm font-medium">
          <p className="line-clamp-2 text-foreground">&quot;{task.title}&quot;</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Permanently</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
