# LearnTrack — Backend API & Server Actions Specification

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Pattern:** Next.js Server Actions (Mutations) + Route Handlers (Data Feeds)  
**Validation Engine:** Zod Runtime Validation

---

## 1. Architectural Standards & Response Envelopes

### 1.1 Server Action Result Pattern
All Server Actions return a standardized typed envelope to ensure predictable error handling and form state updates:

```typescript
export type ActionResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: { code: string; message: string; details?: Record<string, string[]> }; data?: never };
```

### 1.2 Authentication & Authorization Guard
Every Server Action and API Route must execute the standard session verification wrapper:
```typescript
async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError("Authentication required.");
  }
  return session.user.id;
}
```

---

## 2. Learning Tasks API (Server Actions)

### 2.1 `createTask(input: CreateTaskInput): Promise<ActionResult<LearningTask>>`
* **Auth Requirement:** Authenticated user.
* **Zod Schema:**
  ```typescript
  export const CreateTaskSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title cannot exceed 120 characters").trim(),
    description: z.string().max(2000).optional(),
    categoryId: z.string().cuid().optional(),
    plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    estimatedSessions: z.number().int().min(1, "At least 1 session required").max(12).default(2),
  });
  ```
* **Business Logic:**
  1. Extract `userId` from session.
  2. Parse and validate input with `CreateTaskSchema`.
  3. If `categoryId` provided, verify it belongs to `userId`.
  4. Prisma `learningTask.create` with `status: 'PLANNED'`.
  5. `revalidatePath('/planner')` and `revalidatePath('/dashboard')`.
* **Error Cases:**
  * `401 UNAUTHORIZED`: Session missing or expired.
  * `400 VALIDATION_ERROR`: Missing or invalid fields.
  * `404 NOT_FOUND`: Specified `categoryId` does not exist for this user.

### 2.2 `updateTask(input: UpdateTaskInput): Promise<ActionResult<LearningTask>>`
* **Zod Schema:**
  ```typescript
  export const UpdateTaskSchema = z.object({
    id: z.string().cuid(),
    title: z.string().min(3).max(120).trim().optional(),
    description: z.string().max(2000).optional(),
    categoryId: z.string().cuid().nullable().optional(),
    plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    estimatedSessions: z.number().int().min(1).max(12).optional(),
  });
  ```
* **Business Logic:**
  1. Verify ownership: `where: { id: input.id, userId }`.
  2. Prevent `plannedDate` modification if status is `LEARNING_COMPLETED`, `REVISION_PENDING`, or `FULLY_COMPLETED`.
  3. Prisma `learningTask.update`.
  4. Revalidate `/planner` and `/tasks/[id]`.

### 2.3 `deleteTask(taskId: string): Promise<ActionResult<{ id: string }>>`
* **Business Logic:**
  1. Verify task ownership.
  2. Execute Prisma transaction to cascade delete associated `FocusSession`, `LearningLog`, and `Revision` records.
  3. Revalidate `/planner`, `/dashboard`, `/revisions`.

---

## 3. Focus Session System API (Server Actions)

### 3.1 `startFocusSession(input: { taskId: string }): Promise<ActionResult<FocusSession>>`
* **Zod Schema:** `z.object({ taskId: z.string().cuid() })`
* **Business Logic:**
  1. Verify task ownership and ensure task is not in `FULLY_COMPLETED`.
  2. Check for any currently active session: `where: { userId, status: 'ACTIVE' }`. If exists, throw `CONFLICT_ERROR` ("An active focus session is already running.").
  3. Create `FocusSession` with `status: 'ACTIVE'`, `startedAt: new Date()`, `plannedDuration: 2700`.
  4. If task was `PLANNED`, transition task `status = 'IN_PROGRESS'`.
* **Return:** Created `FocusSession` object with `startedAt` timestamp.

### 3.2 `pauseFocusSession(sessionId: string): Promise<ActionResult<FocusSession>>`
* **Business Logic:**
  1. Verify session ownership and ensure `status === 'ACTIVE'`.
  2. Compute delta between `startedAt` and current timestamp.
  3. Update session `status: 'PAUSED'`.

### 3.3 `resumeFocusSession(sessionId: string): Promise<ActionResult<FocusSession>>`
* **Business Logic:**
  1. Verify session ownership and ensure `status === 'PAUSED'`.
  2. Update session `status: 'ACTIVE'`, adjusting accumulated paused duration.

### 3.4 `completeFocusSession(input: CompleteSessionInput): Promise<ActionResult<FocusSession>>`
* **Zod Schema:**
  ```typescript
  export const CompleteSessionSchema = z.object({
    sessionId: z.string().cuid(),
    actualDuration: z.number().int().min(60, "Must be at least 1 minute").max(7200),
  });
  ```
* **Business Logic:**
  1. Verify session ownership.
  2. Mark session `status: 'COMPLETED'`, `endedAt: new Date()`, `actualDuration: input.actualDuration`.
  3. Increment parent task `totalFocusMinutes += Math.round(actualDuration / 60)` and `completedSessions += 1`.
  4. Revalidate `/dashboard`, `/planner`, and `/tasks/[id]`.

### 3.5 `cancelFocusSession(sessionId: string): Promise<ActionResult<{ id: string }>>`
* **Business Logic:**
  1. Mark session `status: 'CANCELLED'`, `endedAt: new Date()`.
  2. Does not increment task statistics.

---

## 4. Learning Logs API (Server Actions)

### 4.1 `createLearningLog(input: CreateLearningLogInput): Promise<ActionResult<LearningLog>>`
* **Zod Schema:**
  ```typescript
  export const CreateLearningLogSchema = z.object({
    taskId: z.string().cuid(),
    sessionId: z.string().cuid(),
    whatLearned: z.string().min(10, "Reflection must be at least 10 characters").max(5000),
    whatCompleted: z.string().max(255).optional(),
    doubts: z.string().max(3000).optional(),
    notes: z.string().max(5000).optional(),
    confidence: z.number().int().min(1).max(5),
  });
  ```
* **Business Logic:**
  1. Verify session exists, belongs to `userId`, and does not already have an associated log (`focusSessionId` unique constraint).
  2. Insert `LearningLog` linked to task and session.
  3. Revalidate `/tasks/[id]`.

---

## 5. Topic Completion & Revision Engine API (Server Actions)

### 5.1 `markTopicAsLearned(taskId: string): Promise<ActionResult<{ task: LearningTask; revisions: Revision[] }>>`
* **Business Logic (Atomic Transaction):**
  1. Validate task ownership and ensure task status is `IN_PROGRESS` or `PLANNED`.
  2. Execute Prisma `$transaction`:
     * Query existing revisions for `taskId`. If count == 4, return existing schedule (idempotency guard).
     * Update `LearningTask`:
       ```typescript
       status: 'REVISION_PENDING',
       learningCompletedAt: new Date(),
       ```
     * Calculate 4 milestone dates in user's local timezone:
       * Revision 1: $D + 0$ (Same day)
       * Revision 2: $D + 3$ days
       * Revision 3: $D + 15$ days
       * Revision 4: $D + 30$ days
     * Bulk create 4 `Revision` records:
       ```typescript
       await tx.revision.createMany({
         data: [
           { userId, learningTaskId: taskId, revisionNumber: 1, scheduledDate: d0, status: 'DUE' },
           { userId, learningTaskId: taskId, revisionNumber: 2, scheduledDate: d3, status: 'PENDING' },
           { userId, learningTaskId: taskId, revisionNumber: 3, scheduledDate: d15, status: 'PENDING' },
           { userId, learningTaskId: taskId, revisionNumber: 4, scheduledDate: d30, status: 'PENDING' },
         ],
       });
       ```
  3. Revalidate `/planner`, `/dashboard`, `/revisions`, and `/tasks/[id]`.

### 5.2 `completeRevision(input: CompleteRevisionInput): Promise<ActionResult<{ revision: Revision; isTopicMastered: boolean }>>`
* **Zod Schema:**
  ```typescript
  export const CompleteRevisionSchema = z.object({
    revisionId: z.string().cuid(),
    notes: z.string().max(3000).optional(),
    confidence: z.number().int().min(1).max(5),
  });
  ```
* **Business Logic (Atomic Transaction):**
  1. Verify revision ownership.
  2. Execute Prisma `$transaction`:
     * Update target `Revision`:
       ```typescript
       status: 'COMPLETED',
       completedAt: new Date(),
       notes: input.notes,
       confidence: input.confidence,
       ```
     * Fetch all revisions for parent `learningTaskId`:
       ```typescript
       const revisions = await tx.revision.findMany({
         where: { learningTaskId: targetRev.learningTaskId },
       });
       ```
     * **Full Topic Mastery Rule Check:**
       ```typescript
       const allCompleted = revisions.length === 4 && revisions.every(r => r.status === 'COMPLETED');
       if (allCompleted) {
         await tx.learningTask.update({
           where: { id: targetRev.learningTaskId },
           data: {
             status: 'FULLY_COMPLETED',
             fullyCompletedAt: new Date(),
           },
         });
       }
       ```
  3. Revalidate paths.
  4. Return updated revision and boolean `isTopicMastered`.

---

## 6. Route Handlers (API Feeds)

### 6.1 `GET /api/calendar/events`
* **Query Parameters:**
  * `start`: ISO Date string (e.g., `2026-09-01T00:00:00Z`).
  * `end`: ISO Date string (e.g., `2026-10-01T00:00:00Z`).
* **Output Format (FullCalendar compliant):**
  ```json
  [
    {
      "id": "task_clx1...",
      "title": "Consensus Algorithms",
      "start": "2026-09-10",
      "allDay": true,
      "backgroundColor": "#2563EB",
      "extendedProps": { "type": "TASK", "priority": "HIGH", "status": "IN_PROGRESS" }
    },
    {
      "id": "rev_clx2...",
      "title": "[Rev 2] Consensus Algorithms",
      "start": "2026-09-13",
      "allDay": true,
      "backgroundColor": "#9333EA",
      "extendedProps": { "type": "REVISION", "revisionNumber": 2, "status": "PENDING" }
    }
  ]
  ```

### 6.2 `GET /api/user/export`
* **Output:** Streams complete JSON payload containing User Profile, Tasks, Sessions, Logs, and Revisions for data ownership and GDPR compliance.
