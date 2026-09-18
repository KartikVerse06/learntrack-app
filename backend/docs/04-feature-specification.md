# LearnTrack — Functional Feature Specification

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Module Coverage:** Core Modules 1 through 13

---

## 1. Feature: Daily Learning Planner

### 1.1 Objective
To provide learners with a clear, calm, and structured interface to plan, organize, and prioritize their daily learning activities.

### 1.2 Data Elements
* **Title:** Concise name of topic/unit (3–120 characters). Required.
* **Description:** Optional rich markdown text explaining objectives or resource links.
* **Category:** Belongs to a user-defined or default Category entity (e.g., "System Design", "Algorithms", "French").
* **Planned Date:** Calendar date string (`YYYY-MM-DD`). Default: current local date.
* **Priority:** Enum: `LOW` (Grey/Slate), `MEDIUM` (Amber/Yellow), `HIGH` (Rose/Red).
* **Estimated Focus Sessions:** Positive integer (default: 2, equivalent to 90 minutes).
* **Completed Focus Sessions:** Derived integer from associated completed `FocusSession` records.
* **Total Focus Minutes:** Derived integer (sum of actual durations / 60).
* **Status:** Enum: `PLANNED`, `IN_PROGRESS`, `LEARNING_COMPLETED`, `REVISION_PENDING`, `FULLY_COMPLETED`.

### 1.3 Business Rules
1. A task created with a planned date in the past is valid (to allow logging study done offline earlier in the day).
2. Deleting a task that has active revisions prompts with a destructive warning. Soft delete or cascade delete with transaction integrity must be maintained.
3. Task filtering must support: All, Active, Revision Pending, Mastered, and Category filtering.

---

## 2. Feature: 45-Minute Focus Session System

### 2.1 Objective
Provide a scientifically proven 45-minute focus period that eliminates distractions and ensures deliberate study without clock anxiety.

### 2.2 Functional Behavior
* **Default Duration:** 2,700 seconds (45 minutes).
* **Session Initiation:** Creates a `FocusSession` record with `status: ACTIVE` and `startedAt: now()`.
* **Timestamp Delta Math:**
  $$\text{Elapsed Time} = (\text{Current Time} - \text{Start Time}) - \text{Total Accumulated Paused Time}$$
  $$\text{Remaining Time} = \max(0, \text{Planned Duration} - \text{Elapsed Time})$$
* **Pause Behavior:** Records a pause start timestamp. Halts local display ticker.
* **Resume Behavior:** Calculates pause duration, adds to total paused accumulator, resets pause start timestamp, and resumes countdown.
* **Finish Early:** Allowed at any point. Persists actual elapsed seconds as `actualDuration`.
* **Auto-Completion:** When Remaining Time reaches 0, the client fires the completion event, signals server action `completeFocusSession`, plays sound, and triggers notification.

### 2.3 State Matrix
| Current State | Action | Next State | Database Effect |
| :--- | :--- | :--- | :--- |
| `PLANNED` (Task) | Start Focus | `IN_PROGRESS` | Updates task status |
| `ACTIVE` (Session) | Click Pause | `PAUSED` | Updates session paused state |
| `PAUSED` (Session) | Click Resume | `ACTIVE` | Accumulates paused duration |
| `ACTIVE`/`PAUSED` | Timer 00:00 / Finish | `COMPLETED` | Updates `completedAt`, `actualDuration` |
| `ACTIVE`/`PAUSED` | Click Cancel | `CANCELLED` | Marks cancelled, discards from streak |

---

## 3. Feature: Notification & Sound System

### 3.1 Web Notifications API
* **Permission Request:** Non-intrusive prompt triggered on user onboarding or within Settings.
* **Payload:**
  * Title: `"LearnTrack — Focus Session Complete!"`
  * Body: `"45 minutes of deliberate practice finished. Time to log your insights."`
  * Icon: `"/icons/icon-192x192.png"`
  * Badge: `"/icons/badge-72x72.png"`
* **Browser Handling:**
  * If permission is `default`, request permission upon starting the first session.
  * If `denied`, gracefully fall back to in-app banners and document title flashing (`"🔔 Complete!"`).
  * If API is unsupported, log to telemetry and disable toggles in Settings.

### 3.2 HTML5 Audio API
* **Sound Assets:** High-clarity, non-jarring chimes (e.g., Tibetan Singing Bowl chime, Gentle Bell) in `.mp3` and `.ogg` formats stored in `/public/sounds/`.
* **Autoplay Safety:** Audio instances are initialized or pre-unlocked during user interactions (e.g., on clicking "Start Focus").
* **Settings:** User can toggle sound on/off and select volume (0.0 to 1.0).

---

## 4. Feature: Learning Session Log

### 4.1 Objective
Transform passive consumption into active synthesis by requiring reflection immediately after focus.

### 4.2 Form Fields
1. **What did I learn?** (Markdown textarea, required, minimum 10 characters). Captures key takeaways and mental models.
2. **What did I complete?** (Text input, optional). Practical outputs, e.g., "Implemented LeetCode 206, built binary tree traversal".
3. **What are my doubts?** (Markdown textarea, optional). Unresolved questions to revisit during spaced revisions.
4. **Notes:** (Markdown textarea, optional). Reference links, code snippets, or book pages.
5. **Confidence Level:** Integer scale 1 to 5.
   * **1 — Very Low:** Struggled to understand the fundamentals; needs re-study.
   * **2 — Low:** Understood basic concepts but cannot implement without assistance.
   * **3 — Moderate:** Grasps core ideas and can apply them with occasional reference to documentation.
   * **4 — High:** Clear conceptual and practical mastery; minimal reference needed.
   * **5 — Very High:** Complete intuitive command; able to teach or derive from first principles.

---

## 5. Feature: Spaced Revision Engine

### 5.1 Objective
Automate the retention lifecycle across 30 days based on research-backed forgetting-curve decay models.

### 5.2 The 4 Spaced Intervals
When a topic is marked as `LEARNING_COMPLETED`:
* **Revision 1 (Day 0):** Same calendar day review. Purpose: Immediate consolidation and active recall before first sleep cycle.
* **Revision 2 (Day +3):** 3 calendar days after completion. Purpose: Halt initial rapid memory decay.
* **Revision 3 (Day +15):** 15 calendar days after completion. Purpose: Long-term memory reinforcement.
* **Revision 4 (Day +30):** 30 calendar days after completion. Purpose: Permanent retention and mastery verification.

### 5.3 Revision Rules & Invariants
1. **Deterministic Scheduling:** $Date_{\text{Rev } N} = Date_{\text{Completion}} + \text{IntervalDays}[N]$.
2. **Strict Uniqueness:** A composite unique constraint `@@unique([learningTaskId, revisionNumber])` guarantees no duplicate revision records can ever exist for a task.
3. **Overdue Handling:** A revision whose `scheduledDate < today` and whose `status != 'COMPLETED'` is automatically classified as `OVERDUE`. It remains in the Daily Planner and Revision Center until explicitly completed or reviewed.
4. **Active Recall Execution:** During revision, previous learning logs and doubts are presented in an expandable drawer so the learner can quiz themselves before viewing past notes.

---

## 6. Feature: Full Topic Completion Rule

### 6.1 Backend Enforcement
A `LearningTask` achieves `status = FULLY_COMPLETED` **if and only if**:
$$\text{Task Status} = \text{REVISION\_PENDING} \quad \land \quad \forall r \in \text{Revisions}(\text{Task}), \, r.\text{status} = \text{COMPLETED}$$
* **Constraint:** This rule is strictly executed within a server-side database transaction when Revision 4 (or the final remaining revision) is marked completed.
* **Security & Integrity:** Frontend status flags are never trusted. The server verifies the completion status of all 4 child revision records before executing the promotion.

---

## 7. Feature: Dashboard

### 7.1 Layout & Content Priority
1. **Header Bar:** Quick date picker, active streak badge, quick action "+ Add Task".
2. **Focus Metrics Strip:**
   * Today's Focus Time (e.g., `135 min / 3 sessions`).
   * Active Streak Count (e.g., `12 Days`).
   * Average Daily Focus (e.g., `90 min`).
3. **Split Grid:**
   * **Left Column (Today's Agenda):** List of planned learning tasks with estimated vs. completed session chips and "Start Focus" CTA.
   * **Right Column (Due Revisions):** Urgent card deck showing revisions due today or overdue with topic titles, interval tags (`Rev 2: 3-Day`), and direct "Review" buttons.
4. **Learning Velocity & Progress Card:** Summary of topics currently in `REVISION_PENDING` and topics promoted to `FULLY_COMPLETED` this week/month.

---

## 8. Feature: Revision Center

### 8.1 Views & Filters
* **Tabs:**
  * **Due Today / Overdue:** Actionable list requiring immediate attention.
  * **Upcoming:** Projected revision schedule over the next 30 days.
  * **Completed:** Historical archive of completed revisions with notes and confidence progression.
* **Progress Badges:** Shows completion meter per topic (e.g., `2 / 4 Revisions Done`).
* **Filtering:** By Category, Status (`DUE`, `OVERDUE`, `COMPLETED`), and Confidence level.

---

## 9. Feature: Interactive Learning Calendar

### 9.1 Technical Foundation
* Integrated via **FullCalendar** (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`).
* Responsive views: Month Grid, Week Timegrid, Day Agenda.

### 9.2 Event Mapping
* **Blue Items:** Planned learning tasks (rendered on `plannedDate`).
* **Purple Badges:** Spaced revision deadlines (labeled with topic title + revision index, e.g., `[Rev 3] Rust Borrow Checker`).
* **Green Blocks:** Historical completed focus sessions with duration badges.
* **Interactions:** Clicking any event opens a slide-over sheet containing full session logs and quick action triggers.

---

## 10. Feature: Analytics & Insights

### 10.1 Technical Foundation
* Integrated via **Recharts** for accessible, responsive SVG visualizations.

### 10.2 Visualization Breakdown
1. **Focus Time Histogram (BarChart):** Daily focus minutes over selected interval (Last 7 Days, 30 Days, 90 Days). Highlights target goal lines (e.g., 90 min/day).
2. **Revision Adherence Rate (PieChart / RadialBar):** Breakdown of Revisions completed on-time vs. completed late vs. overdue.
3. **Confidence Trajectory (LineChart):** Tracks average confidence ratings from Initial Learning -> Rev 1 -> Rev 2 -> Rev 3 -> Rev 4, proving retention growth.
4. **Category Distribution (DonutChart):** Total study hours partitioned across topics (e.g., 40% Frontend, 35% Backend, 25% DevOps).

---

## 11. Feature: Learning Streak System

### 11.1 Qualification Rule
A calendar day qualifies as a **"Learning Day"** if and only if:
$$\text{Total Verified Focus Minutes Today} \ge 45 \quad \lor \quad \text{At least 1 Spaced Revision Completed Today}$$
* **Streak Calculation:** Evaluated at the boundary of the user's configured local timezone midnight.
* **Philosophy:** Encourages daily contact with study material without gamified toxicity; missing a day resets the current streak counter but preserves lifetime focus statistics and all historical logs.

---

## 12. Feature: User Settings & Preferences

* **Profile Settings:** Full Name, Email, IANA Timezone selector (`Intl` supported dropdown).
* **Focus Defaults:** Default session duration (hardcoded to 45 minutes in MVP; dropdown disabled with "Locked to 45m in MVP" explanatory label).
* **Notification Preferences:** Desktop notification toggle, sound volume slider, test chime trigger.
* **Data Export:** JSON export of all user tasks, sessions, logs, and revisions for personal backup.

---

## 13. Future AI Architecture Extension Points (Post-MVP)

While no generative AI is implemented in the MVP, the system is designed with specific hook points:
1. **AI Session Synthesizer:** Consolidate multiple 45-minute learning logs into an executive topic summary.
2. **Active Recall Question Generator:** Generate 3 self-test questions from the user's "What did I learn?" text when a spaced revision becomes due.
3. **Knowledge Gap Detector:** Scan logs with Confidence $\le 2$ or open doubts to recommend supplementary focus sessions.
