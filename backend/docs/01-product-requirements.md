# LearnTrack — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Target Audience:** Product Managers, Software Engineers, AI Coding Agents, QA Engineers

---

## 1. Executive Summary

**LearnTrack** is a dedicated learning self-tracking web application designed to help self-directed learners, students, and professionals transition from ad-hoc studying to a structured, sustainable, and scientifically grounded learning habit.

LearnTrack is **not** a generic task management or to-do application. It is a specialized system that tightly couples:
1. **Daily Learning Planning:** Scheduling granular learning topics by date and priority.
2. **Dedicated Focus Sessions:** High-intensity 45-minute timestamp-calculated focus blocks with audio/visual notification signals.
3. **Reflective Learning Journals:** Structured logs capturing what was learned, what was built, doubts encountered, notes, and subjective confidence ratings (1–5).
4. **Automated Spaced Revision Engine:** Strict 4-stage spaced repetition intervals (Same Day, +3 Days, +15 Days, +30 Days) generated upon topic completion.
5. **Consistency & Spaced Progress Analytics:** Data visualization tracking actual study hours, revision adherence, confidence progression, and genuine learning consistency.

---

## 2. Product Vision & Principles

### 2.1 The Core Learning Lifecycle
In LearnTrack, knowledge acquisition follows an immutable progression:

```
  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
  │  PLAN   │ ───► │  FOCUS  │ ───► │  LEARN  │ ───► │   LOG   │
  └─────────┘      └─────────┘      └─────────┘      └─────────┘
                                                          │
  ┌─────────┐      ┌─────────┐      ┌─────────┐           ▼
  │ ANALYZE │ ◄─── │COMPLETE │ ◄─── │ REVISE  │ ◄─────────┘
  └─────────┘      └─────────┘      └─────────┘
```

### 2.2 Core Product Answers
LearnTrack enables every learner to answer eight fundamental questions at any moment:
1. **What should I learn today?** — Visible instantly on the Daily Planner and Dashboard.
2. **What am I currently learning?** — Focused real-time status with zero-distraction active session indicators.
3. **How much focused time have I spent learning?** — Measured in rigorous 45-minute focus blocks, backed by timestamp verification.
4. **What did I learn during each session?** — Detailed, structured session logs and doubts history.
5. **What revisions are due?** — Proactively surfaced upcoming and overdue spaced revision checkpoints.
6. **Which topics are fully completed?** — Only topics that have passed both initial learning and all 4 spaced revisions.
7. **How consistent is my learning?** — Habit streaks grounded in verified focus time rather than vanity checkmarks.
8. **Where are my learning gaps?** — Flagged by unresolved doubts, low confidence ratings (< 3), and overdue revision cycles.

### 2.3 Guiding Philosophies
* **Consistency > Gamification:** No arbitrary badges, social feeds, or synthetic reward points. The metric of success is sustained deliberate practice and retention.
* **Active Recall & Spaced Repetition over Passive Consumption:** A topic is never "done" when the tutorial ends; it is only done when retention is proven across 30 days.
* **Timestamp Precision:** Focus time calculations must never drift due to browser background throttling or device sleep.
* **Complete User Isolation:** High-security boundary where each user's curriculum, logs, and metrics are isolated.

---

## 3. User Persona & Problem Definition

### 3.1 Primary Persona: The Dedicated Self-Directed Learner ("Alex")
* **Profile:** Software engineer, university student, or career transitioner studying complex topics (e.g., Distributed Systems, Data Structures, Machine Learning).
* **Pain Points:**
  * Suffers from the "illusion of competence" (feeling knowledgeable after reading or watching videos, but forgetting concepts a week later).
  * Struggles with fragmented study sessions lost to multitasking.
  * Forgets to review past topics, leading to high forgetting-curve decay.
  * Uses disconnected tools: Google Calendar for scheduling, Pomodoro app for timers, Notion for notes, and an ad-hoc spreadsheet for revisions.
* **Goals in LearnTrack:**
  * One single dashboard to plan the day, focus deeply, take instant post-session notes, and trust an automated schedule to tell them when to review.

---

## 4. Key Functional Modules

| Module | Purpose | Critical SLA / Requirement |
| :--- | :--- | :--- |
| **Authentication & Profile** | User onboarding, secure session handling, user data isolation | Auth.js session cookies, password hashing via argon2/bcrypt, multi-tenant database safety |
| **Daily Planner** | Task scheduling, categorization, and prioritization for specific dates | Fast single-query daily agenda with category tagging and status management |
| **Focus Session System** | 45-minute distraction-free focus timer | Timestamp-based delta math; resilient to tab switching, browser minimize, and device sleep |
| **Notification & Audio** | Sensory alert on focus completion | Web Notifications API + HTML5 Audio API; graceful fallbacks for permissions/autoplay blocks |
| **Learning Session Log** | Post-session reflective capture | Structured fields: What learned, Completed, Doubts, Notes, Confidence (1–5) |
| **Spaced Revision Engine** | Automated 4-interval retention workflow | Auto-generates Rev 1 (Day 0), Rev 2 (Day +3), Rev 3 (Day +15), Rev 4 (Day +30); idempotent generation |
| **Full Completion Logic** | Enforcing total topic mastery | Backend rule: Initial Learning Completed + Revisions 1..4 Completed |
| **Calendar View** | Multi-day schedule and milestone visualization | FullCalendar integration showing planned tasks, focus events, and revision deadlines |
| **Analytics Dashboard** | Focus time, retention curves, confidence trends, and consistency streaks | Recharts visualizations; SQL aggregations optimized with composite indexes |

---

## 5. System Entity Lifecycles & State Transitions

### 5.1 LearningTask Lifecycle
A task represents a distinct topic or unit of study.

```
       [PLANNED]
           │
           ▼ (Focus Session Started or Task explicitly set to In-Progress)
     [IN_PROGRESS]
           │
           ▼ (User marks topic as learned)
 [LEARNING_COMPLETED]
           │
           ▼ (System auto-generates 4 Revisions in atomic transaction)
  [REVISION_PENDING]
           │
           ▼ (User completes Revision 1, 2, 3, AND 4)
  [FULLY_COMPLETED]
```

* **State Definitions:**
  * `PLANNED`: Task is scheduled for a future or current date with estimated sessions.
  * `IN_PROGRESS`: At least one focus session has been started or the user is actively working on the task.
  * `LEARNING_COMPLETED`: The user has finished the primary study material. Triggers the Revision Engine.
  * `REVISION_PENDING`: Revisions 1 through 4 have been generated and are awaiting completion over the next 30 days.
  * `FULLY_COMPLETED`: Immutable state achieved only after all four spaced revisions are logged as `COMPLETED`.

### 5.2 FocusSession Lifecycle
```
       (Initiate 45m Block)
           │
           ▼
        [ACTIVE] ◄────────┐
        │      │          │ (Resume)
(Pause) │      │ (Cancel) │
        ▼      ▼          │
    [PAUSED] [CANCELLED]  │
        │                 │
        └─────────────────┘
        │
        ▼ (Elapsed Time >= Planned Duration)
    [COMPLETED]
```
*(Note: If a session is abandoned mid-way or unrecoverable due to browser crash, it transitions to `INTERRUPTED`).*

### 5.3 Revision Lifecycle
```
        [PENDING] (Scheduled for date > today)
           │
           ▼ (Today >= Scheduled Date)
         [DUE] ◄──────────────┐
           │                  │ (Date elapsed without completion)
           ├────────────────► [OVERDUE]
           │                  │
           ▼                  ▼
     [IN_PROGRESS]      [IN_PROGRESS]
           │                  │
           ▼                  ▼
      [COMPLETED]        [COMPLETED]
           │
           ▼ (Optional administrative override by user)
       [SKIPPED]
```

---

## 6. Non-Functional Requirements (NFRs)

### 6.1 Performance
* **First Contentful Paint (FCP):** < 1.2s on desktop, < 1.8s on 4G mobile.
* **Time to Interactive (TTI):** < 2.0s.
* **Server Action Latency:** < 200ms p95 for task state updates and session logging.
* **Timer Accuracy:** Zero drift tolerance relative to system clock (calculated via `currentTime - startTime - totalPausedDuration`).

### 6.2 Reliability & Data Integrity
* **Atomic Transactions:** Revision schedule creation and task status promotion must execute inside Prisma `$transaction` blocks.
* **Offline / Interruption Resilience:** Active timer state persisted in `localStorage` + synchronized to database on discrete events (start, pause, resume, complete) to survive browser crashes.

### 6.3 Security & Privacy
* **Tenant Isolation:** All database queries must include `where: { userId }` extracted directly from the verified server-side session token.
* **Zero Trust:** Client-provided `userId` parameters in payloads are strictly rejected.
* **Input Validation:** Zod schemas applied on 100% of Server Actions and API route handlers.

### 6.4 Accessibility (a11y)
* Full compliance with WCAG 2.1 AA standards.
* Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).
* Screen reader live regions (`aria-live="polite"`) for the focus timer and modal alerts.
* High color contrast ratio (minimum 4.5:1 for standard text, 3:1 for large display elements).

---

## 7. Assumptions & Technical Boundaries

1. **Focus Duration:** The MVP default is strictly locked to **45 minutes**. While the database schema supports dynamic durations, the core UI and logic optimize for 45-minute blocks.
2. **Spaced Intervals:** Fixed to Day 0 (Same day), Day +3, Day +15, Day +30. Configurable intervals are deferred to post-MVP.
3. **Timezones:** Users specify their IANA Timezone (e.g., `America/New_York`, `Asia/Kolkata`) in their Profile. Dates for tasks and revisions are stored as normalized calendar day strings (`YYYY-MM-DD`) or mapped to UTC midnight with explicit timezone offsets to prevent cross-day shifting bugs.
4. **AI Capabilities:** No generative AI or automated quiz generation in MVP. Clear hook points are established for post-MVP integration.
