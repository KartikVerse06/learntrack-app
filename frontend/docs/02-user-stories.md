# LearnTrack — User Stories & Acceptance Criteria

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Standard:** INVEST Principles & Gherkin Acceptance Format

---

## 1. Overview
This document specifies the complete set of functional user stories for **LearnTrack**. Each user story includes business rationale, priority tier (MoSCoW framework), and formal Given/When/Then acceptance criteria.

---

## 2. Authentication & Profile Management

### US-AUTH-01: User Registration
* **As a** new learner,
* **I want to** register an account using my email and password,
* **So that** I have a private, secure workspace for my learning logs and revision schedules.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** a new user navigates to `/register`,
  * **When** they submit a valid email, name, password (minimum 8 characters with letters and numbers), and select their local timezone,
  * **Then** an account is created in MySQL, a verification or direct active session is established via Auth.js, and they are redirected to `/dashboard`.
  * **Given** an email is already registered,
  * **When** a user submits the registration form with that email,
  * **Then** the system returns an informative error without leaking internal system state.

### US-AUTH-02: Secure Sign In & Session Persistence
* **As a** registered learner,
* **I want to** securely log in to LearnTrack,
* **So that** my data is retrieved and isolated from other users.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** valid credentials on `/login`,
  * **When** submitted, an HTTP-only secure cookie session is issued.
  * **Given** an unauthenticated request to any protected route (e.g., `/dashboard`, `/planner`, `/focus`),
  * **Then** the user is redirected to `/login?callbackUrl=...`.

---

## 3. Daily Planner & Learning Task Management

### US-TASK-01: Create Learning Task
* **As a** learner,
* **I want to** create a learning task with a title, description, category, planned date, priority, and estimated 45-minute focus sessions,
* **So that** I can plan my study agenda in advance.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** the user is on `/planner` or `/dashboard`,
  * **When** they open the "New Learning Task" dialog and input:
    * Title: "Distributed Consensus Algorithms" (3–120 characters)
    * Planned Date: Selected date (defaults to today)
    * Category: "System Design" (selectable or created inline)
    * Priority: `HIGH` (options: `LOW`, `MEDIUM`, `HIGH`)
    * Estimated Sessions: 3 (positive integer, represents 3 × 45 min)
  * **Then** the task is persisted in the database with status `PLANNED`, associated with the authenticated user ID, and appears instantly in the daily agenda.

### US-TASK-02: Edit and Reschedule Tasks
* **As a** learner,
* **I want to** edit task details or move a task to a different date,
* **So that** I can adapt to unexpected schedule disruptions.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** an existing task in status `PLANNED` or `IN_PROGRESS`,
  * **When** the user edits the planned date, description, or priority,
  * **Then** the updated values are saved and reflected across Planner and Calendar views.
  * **Given** a task already in `LEARNING_COMPLETED`, `REVISION_PENDING`, or `FULLY_COMPLETED`,
  * **Then** changing the planned date is disabled to preserve historical audit integrity.

### US-TASK-03: Task Deletion & Safety Rules
* **As a** learner,
* **I want to** delete an accidental or obsolete task,
* **So that** my planner remains clean and relevant.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** a task with no completed revisions,
  * **When** the user clicks "Delete Task" and confirms the modal warning,
  * **Then** the task and associated uncompleted focus sessions/logs are removed cleanly (or soft-deleted).
  * **Given** a task has existing completed revisions or logs,
  * **When** the user attempts deletion,
  * **Then** a high-severity confirmation modal explains that deleting the topic will remove historical revision records and analytics data.

---

## 4. 45-Minute Focus Session System

### US-FOC-01: Starting a 45-Minute Focus Session
* **As a** learner,
* **I want to** launch a dedicated 45-minute focus block for a chosen task,
* **So that** I can immerse myself in study without manual clock-watching.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** a task in `PLANNED` or `IN_PROGRESS` status,
  * **When** the user clicks "Start Focus",
  * **Then** a new `FocusSession` is created with status `ACTIVE`, `startTime = now()`, and `plannedDuration = 2700` seconds (45 minutes).
  * **And** the interface navigates to or opens the Focus Timer screen displaying 45:00 counting down.
  * **And** the parent task status transitions to `IN_PROGRESS` if it was `PLANNED`.

### US-FOC-02: Timer Controls (Pause, Resume, Finish Early, Cancel)
* **As a** learner,
* **I want to** pause, resume, finish early, or cancel my focus session,
* **So that** real-world interruptions can be tracked honestly.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** an active focus session,
  * **When** the user clicks "Pause",
  * **Then** the session status becomes `PAUSED`, the accumulated active duration is updated, and the timer stops ticking.
  * **When** the user clicks "Resume",
  * **Then** status returns to `ACTIVE`, and a new active interval start timestamp is captured.
  * **When** the user clicks "Finish Early",
  * **Then** the session is marked `COMPLETED` with `actualDuration = total active elapsed seconds`, and the learning log modal opens.
  * **When** the user clicks "Cancel Session",
  * **Then** the session status becomes `CANCELLED`, no learning credit is awarded to streaks, and the user returns to the task screen.

### US-FOC-03: Timer Resilience & Timestamp Calculation
* **As a** learner,
* **I want to** switch tabs, minimize the browser, or refresh the page without losing my timer progress,
* **So that** browser throttling does not compromise my session time.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** an active focus session,
  * **When** the learner switches browser tabs for 15 minutes and returns,
  * **Then** the timer accurately calculates elapsed time using `(currentTime - startTime - totalPausedDuration)` and displays 30:00 remaining.
  * **Given** an active focus session,
  * **When** the page is reloaded,
  * **Then** the active session state is hydrated from server/localStorage and the timer continues ticking without resetting.

---

## 5. Notification & Sound System

### US-NOTIF-01: Session Completion Alert & Sound
* **As a** learner who is working in another window or full-screen editor,
* **I want to** receive an operating-system level desktop notification and an audible chime when my 45 minutes conclude,
* **So that** I know immediately when to stop and record my notes.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** focus timer reaches 00:00,
  * **When** the session transitions to `COMPLETED`,
  * **Then** a system notification is posted via the Web Notifications API ("Focus session complete. Great work!").
  * **And** an audio tone plays via the HTML5 Audio API (if enabled in user settings).
  * **And** the browser tab title flashes with an alert banner ("🔔 Focus Complete!").
  * **And** the Learning Log dialog opens automatically.

### US-NOTIF-02: Graceful Permission & Autoplay Degradation
* **As a** learner using a privacy-hardened or unsupported browser,
* **I want to** receive in-app visual banners if system notifications or audio playback are blocked,
* **So that** the application continues functioning smoothly without crashing.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** notification permission is denied by the user,
  * **When** the session ends,
  * **Then** an accessible on-screen modal alert and toast notification are rendered as fallbacks.
  * **Given** browser autoplay policy blocks sound playback,
  * **Then** the console logs an unhandled promise catch cleanly without interrupting application state.

---

## 6. Learning Session Log

### US-LOG-01: Submitting Post-Session Reflection
* **As a** learner completing a focus session,
* **I want to** document what I learned, what I built/completed, open doubts, and rate my confidence (1–5),
* **So that** I retain a permanent learning journal.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** a completed focus session,
  * **When** the user fills out the Learning Log form:
    * What did I learn? (markdown supported, required, min 10 chars)
    * What did I complete? (optional, exercises, code commits)
    * What are my doubts? (optional, questions for future review)
    * Notes (optional)
    * Confidence Level: (1: Very Low, 2: Low, 3: Moderate, 4: High, 5: Very High)
  * **Then** a `LearningLog` record is saved in MySQL linked to the `LearningTask` and the `FocusSession`.
  * **And** the task summary updates its total focus count and minutes.

---

## 7. Spaced Revision Engine & Topic Mastery

### US-REV-01: Topic Learning Completion & Schedule Generation
* **As a** learner who has finished studying all primary material for a topic,
* **I want to** mark the topic as "Learning Completed",
* **So that** an automated 4-stage spaced revision schedule is created for me.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** a task in `IN_PROGRESS` or `PLANNED` status with at least one focus session,
  * **When** the user clicks "Mark as Learned",
  * **Then** the backend executes an atomic database transaction that:
    1. Sets task status to `REVISION_PENDING`.
    2. Records `learningCompletedAt = now()`.
    3. Generates exactly 4 `Revision` records:
       * Revision 1: Scheduled for Day 0 (Same day as completion)
       * Revision 2: Scheduled for Day +3
       * Revision 3: Scheduled for Day +15
       * Revision 4: Scheduled for Day +30
  * **And** subsequent clicks or retries are idempotent, creating no duplicate records.

### US-REV-02: Executing and Completing Spaced Revisions
* **As a** learner,
* **I want to** view due revisions, review past notes, execute an active recall session, and mark the revision as complete,
* **So that** I systematically defeat the forgetting curve.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** a revision is scheduled for today or is past due,
  * **When** the user opens the revision in Revision Center or Daily Planner,
  * **Then** they see prior session logs, previous confidence ratings, and their recorded doubts.
  * **When** the user completes their review, adds revision notes, selects a revised confidence rating (1–5), and clicks "Complete Revision",
  * **Then** the revision status becomes `COMPLETED` with `completedAt = now()`.

### US-REV-03: Full Topic Mastery Rule (FULLY_COMPLETED)
* **As a** learner,
* **I want to** know when a topic is fully mastered across the entire 30-day cycle,
* **So that** I can celebrate genuine retention.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** a task with 3 of 4 revisions completed,
  * **When** Revision 4 is submitted as `COMPLETED`,
  * **Then** the backend business rule validates that:
    * Initial learning is completed (`learningCompletedAt != null`)
    * Revision 1 is `COMPLETED`
    * Revision 2 is `COMPLETED`
    * Revision 3 is `COMPLETED`
    * Revision 4 is `COMPLETED`
  * **Then** and only then, the task status is promoted to `FULLY_COMPLETED`.
  * **And** a celebratory mastery summary is displayed on the UI.

---

## 8. Dashboard, Calendar, and Analytics

### US-DASH-01: Unified Daily Learning Dashboard
* **As a** learner,
* **I want to** view my daily focus minutes, planned tasks, due revisions, and weekly streak on one screen,
* **So that** I know exactly what actions to take today.
* **Priority:** Must Have (P0)
* **Acceptance Criteria:**
  * **Given** an authenticated user loads `/dashboard`,
  * **Then** the system presents:
    * Today's Planned Tasks with completion checkboxes and "Start Focus" CTA.
    * Today's Spaced Revisions due or overdue.
    * Focus Statistics: Today's Focus Minutes, Sessions Count, Streak Days.
    * Revision Completion Rate widget.

### US-CAL-01: Interactive Learning Calendar
* **As a** learner,
* **I want to** view a monthly and weekly calendar combining tasks, focus blocks, and revision deadlines,
* **So that** I can anticipate future review workloads.
* **Priority:** Must Have (P1)
* **Acceptance Criteria:**
  * **Given** the user navigates to `/calendar`,
  * **Then** FullCalendar renders color-coded events:
    * Blue: Planned Learning Tasks
    * Purple: Spaced Revision Deadlines (Rev 1, Rev 2, Rev 3, Rev 4 badges)
    * Green: Completed Sessions
  * **When** clicking an event, a modal or side drawer displays full task/revision details.

### US-ANA-01: Deep Learning Analytics & Trends
* **As a** learner,
* **I want to** inspect charts showing focus hours, revision adherence, and confidence trajectories over time,
* **So that** I can analyze my study patterns.
* **Priority:** Must Have (P1)
* **Acceptance Criteria:**
  * **Given** the user navigates to `/analytics`,
  * **Then** Recharts components render:
    * Bar Chart: Daily focus minutes over the last 14 and 30 days.
    * Line Chart: Confidence score progression from Session 1 to Revision 4.
    * Donut / Pie Chart: Revision status distribution (On-time, Overdue, Completed).
    * Consistency Matrix: Heatmap of active learning days.
