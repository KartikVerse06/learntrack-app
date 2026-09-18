# LearnTrack — UI / UX Specification & Design System

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Design Philosophy:** Minimalist, Calm, High-Focus, Distraction-Free  
**Component Library:** shadcn/ui (Radix UI Primitives + Tailwind CSS)

---

## 1. Design System Foundations

### 1.1 Color Palette & Semantic Tokens
LearnTrack utilizes a calm, slate-neutral base palette designed to reduce eye strain during prolonged study sessions, paired with deliberate accent colors for focus states and revision intervals.

```css
:root {
  /* Surface & Background */
  --background: 210 40% 98%;      /* #F8FAFC - Calm Off-White */
  --foreground: 222 47% 11%;      /* #0F172A - Deep Slate Gray */
  --card: 0 0% 100%;              /* Pure White */
  --card-foreground: 222 47% 11%;
  
  /* Primary Brand (Calm Indigo / Sapphire) */
  --primary: 221 83% 53%;         /* #2563EB - Royal Blue */
  --primary-foreground: 210 40% 98%;
  
  /* Focus Timer Mode (Emerald / Sage) */
  --focus-timer: 158 64% 45%;     /* Deep Sage / Emerald */
  --focus-timer-bg: 160 84% 6%;   /* Ultra-dark focus canvas for timer */
  
  /* Revision Accents (Violet / Purple) */
  --revision: 262 83% 58%;        /* Spaced Revision Accent */
  
  /* Priorities */
  --priority-low: 215 16% 47%;    /* Slate Gray */
  --priority-medium: 38 92% 50%;  /* Amber Warning */
  --priority-high: 0 84% 60%;     /* Crimson / Rose */
  
  /* Borders & Dividers */
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
}

.dark {
  --background: 224 71% 4%;       /* #020817 - Deep Navy Black */
  --foreground: 210 40% 98%;
  --card: 222 47% 7%;
  --card-foreground: 210 40% 98%;
  --border: 217 33% 17%;
}
```

### 1.2 Typography
* **Primary Body & Display Font:** `Inter` or `Geist Sans` via `next/font/google`.
* **Monospace Timer & Numerical Font:** `JetBrains Mono` or `Geist Mono` with tabular numerals (`font-mono tabular-nums`) to eliminate timer layout jitter.
* **Hierarchy:**
  * H1: 2.25rem (36px), Bold, `-0.025em` tracking.
  * H2: 1.5rem (24px), Semi-bold, `-0.02em` tracking.
  * H3: 1.25rem (20px), Semi-bold.
  * Body: 0.9375rem (15px), Regular, 1.5 line height.
  * Small / Labels: 0.8125rem (13px), Medium.

---

## 2. Global Shell & Navigation

### 2.1 Navigation Layout
* **Desktop ($> 1024px$):** Fixed left sidebar (width: `260px`), collapsible to `64px` icon-only mode.
  * Top: App Logo & Name ("LearnTrack") + Active Focus Mini-Indicator (pulsing dot if session active).
  * Main Nav: Dashboard (`/dashboard`), Daily Planner (`/planner`), Focus Mode (`/focus`), Revision Center (`/revisions`), Calendar (`/calendar`), Analytics (`/analytics`).
  * Bottom: User Profile Dropdown, Theme Toggle (Light/Dark/System), Settings (`/settings`).
* **Mobile / Tablet ($< 1024px$):**
  * Top Bar: Logo, Active Focus Pill, Notification Bell, User Avatar.
  * Bottom Bar (Mobile): 5 core tabs: Dashboard, Planner, Quick Timer, Revisions, Calendar.

---

## 3. Screen 1: Dashboard (`/dashboard`)

### 3.1 Purpose & User Goal
Provide a unified, calm executive overview of today's learning priorities, active revisions, and recent focus metrics.

### 3.2 Key Layout Sections
1. **Welcome & Streak Banner:** Displays greeting, current local date, and active learning streak pill (e.g., `"🔥 12-Day Streak"`).
2. **Key Metric Cards (4-Column Grid):**
   * *Today's Focus:* `135 / 180 min` (Progress bar displaying completed vs planned).
   * *Active Sessions:* `3 Completed` (45m blocks).
   * *Revisions Due:* `2 Pending` (1 Overdue badge in red if applicable).
   * *Topics Mastered:* `8 Lifetime`.
3. **Split Main Area:**
   * **Left (60%): Today's Learning Agenda:** List of tasks planned for today with category pills, priority dots, session progress (e.g., `2/3 sessions done`), and "Start Focus" button.
   * **Right (40%): Spaced Revisions Due Today:** Card stack of pending revisions (e.g., `[Rev 2: 3-Day] TypeScript Generics`) with "Start Review" CTA.

### 3.3 State Handling
* **Loading:** Skeleton placeholders using `shadcn/ui` `Skeleton` component for cards and lists.
* **Empty State:** If no tasks are planned for today, render calm illustration + `"No tasks scheduled for today. Ready to plan a new topic?"` with `+ Add Learning Task` button.
* **Error State:** Alert banner with retry button: `"Unable to sync today's agenda. [Retry]"`

---

## 4. Screen 2: Daily Planner (`/planner`)

### 4.1 Purpose & User Goal
Create, organize, and prioritize learning topics for today and upcoming dates.

### 4.2 Components & Features
* **Date Navigator:** Header with Previous Day, Today, Next Day controls, plus inline mini-calendar popover.
* **Task Card Component:**
  * Drag handle (for reordering priority).
  * Priority indicator: Colored vertical accent line (Red: High, Amber: Med, Slate: Low).
  * Title & Category badge.
  * Focus Session Tracker: Visual circles representing estimated 45m blocks (filled = completed, hollow = remaining).
  * Status Badge: `PLANNED`, `IN_PROGRESS`, `LEARNING_COMPLETED`, `REVISION_PENDING`, `FULLY_COMPLETED`.
  * Actions Menu (`DropdownMenu`): Edit, Move to Tomorrow, Mark as Learned, Delete.
* **Action Drawer:** `+ Add Learning Task` opens slide-over drawer or dialog containing React Hook Form with Zod validation.

---

## 5. Screen 3: Task Detail Screen (`/tasks/[id]`)

### 5.1 Purpose & User Goal
Deep dive into a specific topic: inspect description, historical focus sessions, session logs, notes, and the 4-stage spaced revision roadmap.

### 5.2 Layout Breakdown
* **Header Area:** Task Title, Category, Creation Date, Current Status Badge, Primary Action (`Start Focus` or `Mark as Learned`).
* **Session History Tab:** Timeline of all completed 45-minute focus sessions with actual duration and date.
* **Learning Logs Tab:** Accordion of all logs recorded for this topic, displaying "What learned", "Completed", "Doubts", and Confidence scores (1–5).
* **Revision Roadmap Tab:** Visual step-progress bar representing the 4 spaced milestones:
  * Milestone 1: Day 0 (Same Day) — Status Pill
  * Milestone 2: Day +3 — Status Pill
  * Milestone 3: Day +15 — Status Pill
  * Milestone 4: Day +30 — Status Pill
  * Topic Mastery Card: Shows completion date and confirmation if `FULLY_COMPLETED`.

---

## 6. Screen 4: Focus Timer Screen (`/focus` or `/focus?taskId=...`)

### 6.1 Purpose & User Goal
Provide a zero-distraction, immersive visual environment for the 45-minute deliberate study block.

### 6.2 Visual Layout & Interaction
* **Immersive Canvas:** Darkened or calm background mode, hiding secondary sidebars unless hovered or toggled.
* **Topic Label:** Subtitle showing current task title: e.g., `"Focusing on: Distributed Consensus Algorithms"`.
* **Central Countdown Clock:** Huge tabular monospace typography (`text-7xl md:text-9xl font-mono tabular-nums`). Displays `45:00` counting down.
* **Circular Progress Ring:** SVG circular stroke smoothly tracking elapsed percentage (0% to 100%).
* **Control Buttons Bar:**
  * **Pause / Resume:** Prominent central primary button with play/pause icons.
  * **Finish Early:** Secondary outline button (prompts: *"Log current elapsed time?"*).
  * **Cancel:** Ghost button (prompts: *"Discard this session?"*).
* **Session Metadata Strip:** Start time, planned duration (45m), current elapsed active time.

---

## 7. Screen 5: Learning Session Log Modal

### 7.1 Purpose & User Goal
Immediate post-focus reflection modal that appears automatically upon session completion.

### 7.2 Form Controls & Layout
* **Header:** Celebration icon + `"45-Minute Focus Session Completed!"`
* **Field 1: What did I learn?** Rich markdown textarea with helper placeholder: *"Summarize core concepts, principles, or formulas..."*
* **Field 2: What did I complete?** Text input: *"Built binary search tree, solved 3 problems..."*
* **Field 3: Open Doubts:** Markdown textarea: *"Need to clarify how Raft handles network partitions..."*
* **Field 4: Confidence Score Selector:** 5 interactive stars or numbered tiles:
  * `1`: Very Low | `2`: Low | `3`: Moderate | `4`: High | `5`: Very High.
* **Footer Actions:**
  * `[Save & Start Another 45m Session]` (Primary)
  * `[Save & Return to Planner]` (Secondary)
  * `[Save & Mark Topic as Learned]` (Tertiary)

---

## 8. Screen 6: Revision Center (`/revisions`)

### 8.1 Purpose & User Goal
Manage spaced repetition deadlines, conduct active recall reviews, and record retention confidence across the 30-day window.

### 8.2 Layout & Filtering
* **Top Filter Bar:** Segmented Control tabs: `Due Today / Overdue`, `Upcoming (30 Days)`, `Completed Archive`.
* **Revision Card Elements:**
  * Topic Title & Category.
  * Revision Milestone Tag: e.g., `Revision 2 of 4 (3-Day Interval)`.
  * Scheduled Date with relative badge: e.g., `"Due Today"`, `"Overdue by 2 days"` (Red).
  * Action Button: `"Review Now"` opens the Active Recall Review Drawer.
* **Active Recall Drawer:**
  * Step 1: Prompt: *"Before looking at your notes, what can you recall about this topic?"*
  * Step 2: "Reveal Past Notes" accordion displaying prior logs and doubts.
  * Step 3: Enter Revision Notes and updated Confidence rating.
  * Step 4: Click `Complete Revision`.

---

## 9. Screen 7: Interactive Calendar (`/calendar`)

### 9.1 Purpose & User Goal
Holistic monthly, weekly, and daily perspective on scheduled learning, focus commitments, and upcoming spaced revisions.

### 9.2 FullCalendar Configuration
* **Views:** `dayGridMonth`, `timeGridWeek`, `listWeek`.
* **Event Color Coding:**
  * Blue `#2563EB`: Planned Task.
  * Purple `#9333EA`: Spaced Revision Due.
  * Emerald `#10B981`: Completed Focus Session.
* **Event Popover / Drawer:** Clicking any event triggers a lightweight popover displaying status, duration, and direct link to the Task Detail screen.

---

## 10. Screen 8: Analytics & Insights (`/analytics`)

### 10.1 Visual Widgets (Recharts)
1. **Focus Hours Chart:** Responsive Bar Chart showing daily focus minutes over 7, 30, or 90 days with rolling 7-day average line.
2. **Revision Adherence Rate:** Donut chart showing % of revisions completed on-time vs. late vs. pending.
3. **Retention & Confidence Curve:** Multi-line chart tracking confidence trajectory per topic across Revision 1, 2, 3, and 4.
4. **Learning Category Breakdown:** Radar or Horizontal Bar chart showing time invested across subject areas.

---

## 11. Screen 9: Settings Screen (`/settings`)

* **Tabs:**
  * **Profile:** Name, email, IANA timezone selector with auto-detect button.
  * **Focus & Timer:** Default duration (45 min fixed indicator), auto-start breaks (future).
  * **Notifications & Sound:** Desktop notification permission grant button, Audio Chime toggle, Sound picker (Tibetan Singing Bowl, Digital Bell, Gentle Gong), Volume slider (0–100%) with "Test Chime" preview button.
  * **Data Management:** Export all data (JSON), Account deletion.

---

## 12. Accessibility & Responsive Specifications

### 12.1 Accessibility (a11y)
* **ARIA Live Regions:** Timer display uses `aria-live="polite"` and `aria-atomic="true"` so screen readers can announce intervals if requested, without interrupting navigation.
* **Focus Management:** When modals/drawers open, focus is automatically trapped inside the dialog and restored to the triggering button upon dismiss.
* **Contrast Compliance:** All text tokens meet or exceed WCAG 2.1 AA (4.5:1 ratio for regular text, 3:1 for large headers).

### 12.2 Responsive Breakpoints
* **Desktop ($> 1280px$):** Expanded side navigation, 3-column dashboard, comprehensive calendar.
* **Laptop / Small Desktop ($1024px - 1279px$):** Collapsed sidebar, 2-column dashboard.
* **Tablet ($768px - 1023px$):** Off-canvas hamburger menu or top navigation, stacked dashboard cards.
* **Mobile ($< 768px$):** Fixed bottom navigation bar, single-column full-width cards, full-screen dialogs for focus timer and learning logs.
