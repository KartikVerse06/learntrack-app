/**
 * Core Domain Enums & Invariants for LearnTrack
 */

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type TaskStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "LEARNING_COMPLETED"
  | "REVISION_PENDING"
  | "FULLY_COMPLETED";

export type SessionStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "INTERRUPTED";

export type RevisionStatus =
  | "PENDING"
  | "DUE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE"
  | "SKIPPED";

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningTask {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  plannedDate: Date;
  priority: Priority;
  estimatedSessions: number;
  completedSessions: number;
  totalFocusMinutes: number;
  status: TaskStatus;
  learningCompletedAt: Date | null;
  fullyCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FocusSession {
  id: string;
  userId: string;
  learningTaskId: string;
  startedAt: Date;
  endedAt: Date | null;
  plannedDuration: number;
  actualDuration: number;
  pausedDuration: number;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningLog {
  id: string;
  userId: string;
  learningTaskId: string;
  focusSessionId: string;
  whatLearned: string;
  whatCompleted: string | null;
  doubts: string | null;
  notes: string | null;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Revision {
  id: string;
  userId: string;
  learningTaskId: string;
  revisionNumber: number;
  scheduledDate: Date;
  status: RevisionStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  confidence: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskWithCategory = LearningTask & {
  category: Category | null;
};

export type TaskWithDetails = TaskWithCategory & {
  focusSessions: FocusSession[];
  learningLogs: LearningLog[];
  revisions: Revision[];
};

/**
 * Standardized Server Action Result Envelope
 */
export type ActionResult<T> =
  | {
      success: true;
      data: T;
      error?: never;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
      };
      data?: never;
    };
