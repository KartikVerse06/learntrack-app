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
