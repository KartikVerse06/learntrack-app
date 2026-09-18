# LearnTrack — AI Coding Agent Guidelines & Operational Protocol

**Target Audience:** Autonomous AI Coding Agents, Pair Programming Assistants, Future Maintainers  
**Mandate:** Read this entire document and referenced `./docs/` files before writing any implementation code.

---

## 1. Project Overview

**LearnTrack** is a dedicated learning self-tracking web application designed to help self-directed learners structure their learning, maintain 45-minute focus blocks, record reflective session logs, and defeat the forgetting curve via an automated 4-stage spaced revision schedule.

**LearnTrack is NOT a generic to-do app.** It enforces an immutable learning progression:
$$\text{PLAN} \longrightarrow \text{FOCUS} \longrightarrow \text{LEARN} \longrightarrow \text{LOG} \longrightarrow \text{REVISE} \longrightarrow \text{COMPLETE} \longrightarrow \text{ANALYZE}$$

---

## 2. Locked Technology Stack

Do **not** replace or swap any of these core technologies without explicit instruction:
* **Frontend:** Next.js (App Router), React, TypeScript (Strict Mode)
* **Styling:** Tailwind CSS
* **UI Components:** shadcn/ui (Radix UI primitives)
* **Backend:** Next.js Server Actions (Primary Mutations) + Route Handlers (Feeds & Exports)
* **Database:** MySQL 8.0+ (InnoDB Engine)
* **ORM:** Prisma
* **Authentication:** Auth.js (NextAuth v5)
* **Validation:** Zod (100% server-side validation)
* **Forms:** React Hook Form (`@hookform/resolvers/zod`)
* **Charts:** Recharts
* **Calendar:** FullCalendar (`@fullcalendar/react`)
* **Notifications:** Web Notifications API
* **Audio:** HTML5 Audio API
* **Testing:** Vitest (Unit/Integration) + Playwright (E2E)
* **Package Manager:** npm

---

## 3. Immutable Business Rules & Invariants

You must strictly uphold the following product invariants in all code:

### 3.1 45-Minute Focus Blocks
* Default session duration is strictly **2,700 seconds (45 minutes)**.
* Timers **must be timestamp-based** (`Date.now() - startTime - pausedDuration`). Never rely exclusively on `setInterval` tick counts.
* Timers must withstand tab throttling, window minimization, and page reloads via `localStorage` hydration.

### 3.2 Automated 4-Interval Spaced Revision Schedule
When a topic is marked as learned (`markTopicAsLearned`), the system automatically creates exactly 4 revisions in an atomic database transaction:
* **Revision 1:** Scheduled for **Day 0 (Same day as completion)**.
* **Revision 2:** Scheduled for **Day +3**.
* **Revision 3:** Scheduled for **Day +15**.
* **Revision 4:** Scheduled for **Day +30**.
* *Duplicate Prevention:* Composite unique constraint `@@unique([learningTaskId, revisionNumber])` must be respected. Generation must be idempotent.

### 3.3 Full Topic Mastery Rule (`FULLY_COMPLETED`)
A learning task transitions to `FULLY_COMPLETED` **only when**:
1. Initial learning is completed (`learningCompletedAt !== null`), **AND**
2. Revision 1 is `COMPLETED`, **AND**
3. Revision 2 is `COMPLETED`, **AND**
4. Revision 3 is `COMPLETED`, **AND**
5. Revision 4 is `COMPLETED`.
* This must be verified server-side inside a database transaction upon completing each revision.

### 3.4 Zero-Trust Tenant Isolation
* Never trust client-provided `userId` parameters.
* Always extract the verified `userId` on the server using `auth()`.
* Every Prisma query on user-owned tables must filter by `where: { userId }`.

---

## 4. Architectural & Coding Rules

1. **Server Actions First:** Use Server Actions for all state mutations. Reserve API route handlers (`/api/...`) for complex range queries (e.g., FullCalendar JSON feed) or file exports.
2. **Strict Validation:** Every Server Action must parse inputs with a dedicated Zod schema. Return standardized `ActionResult<T>` envelopes.
3. **No Duplicate Implementations:** Search the codebase before creating new helpers, components, or utilities.
4. **Minimal, High-Quality Code:** Write small, focused functions. Avoid giant components, dead code, or premature abstractions.
5. **No Placeholders in Production:** Do not leave `TODO: implement later` in critical security or transaction paths.
6. **Accessible UI:** Follow shadcn/ui patterns with proper ARIA attributes, visible focus rings, and high contrast.

---

## 5. Automated Verification & Testing Rules

Before declaring any implementation task complete:
1. **Unit Tests:** Verify date math, timer delta calculation, and mastery logic using Vitest.
2. **Integration Tests:** Verify multi-tenant query boundaries and transaction idempotency.
3. **Type Checking & Linting:** Run `npm run typecheck` and `npm run lint`. Zero type errors or lint warnings are permitted.
4. **Never Claim Verification Without Execution:** Run the actual test commands and inspect the output before asserting completion.

---

## 6. Required Agent Workflow

When assigned an implementation task:
1. **Step 1:** Read this `AGENTS.md` file.
2. **Step 2:** Read the relevant domain document in `./docs/`:
   * Requirements & Personas: [`01-product-requirements.md`](./docs/01-product-requirements.md)
   * User Stories: [`02-user-stories.md`](./docs/02-user-stories.md)
   * Architecture: [`06-technical-architecture.md`](./docs/06-technical-architecture.md)
   * Database Models: [`07-database-schema.md`](./docs/07-database-schema.md)
   * API & Actions: [`08-api-specification.md`](./docs/08-api-specification.md)
   * Focus Timer: [`09-pomodoro-focus-system.md`](./docs/09-pomodoro-focus-system.md)
   * Revision Engine: [`10-revision-engine.md`](./docs/10-revision-engine.md)
   * Analytics & Streaks: [`12-analytics-specification.md`](./docs/12-analytics-specification.md)
   * Security Standards: [`13-security-requirements.md`](./docs/13-security-requirements.md)
   * Testing Suite: [`14-testing-strategy.md`](./docs/14-testing-strategy.md)
   * Phase Roadmap: [`15-development-roadmap.md`](./docs/15-development-roadmap.md)
3. **Step 3:** Formulate an incremental implementation plan following the active phase in [`15-development-roadmap.md`](./docs/15-development-roadmap.md).
4. **Step 4:** Implement code adhering to the architecture.
5. **Step 5:** Execute automated test commands to verify functionality.
6. **Step 6:** Review git diff to confirm only intended files were modified.
