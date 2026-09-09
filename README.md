# LearnTrack — Deliberate Learning & Spaced Revision System

[![Next.js](https://img.shields.io/badge/Next.js-14%2F15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-green)](https://authjs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **LearnTrack** is a dedicated learning self-tracking web application that bridges the gap between daily study and long-term retention. It combines daily learning planning, 45-minute timestamp-calculated focus blocks, reflective learning journals, and an automated 4-stage spaced revision schedule into one calm, coherent system.

---

## 📖 The Core Learning Lifecycle

LearnTrack is **not** a generic to-do list. It enforces an intentional, research-backed learning progression:

```
  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
  │  PLAN   │ ───► │  FOCUS  │ ───► │  LEARN  │ ───► │   LOG   │
  └─────────┘      └─────────┘      └─────────┘      └─────────┘
                                                          │
  ┌─────────┐      ┌─────────┐      ┌─────────┐           ▼
  │ ANALYZE │ ◄─── │COMPLETE │ ◄─── │ REVISE  │ ◄─────────┘
  └─────────┘      └─────────┘      └─────────┘
```

1. **PLAN:** Schedule topics by calendar date with priorities and estimated focus sessions.
2. **FOCUS:** Immerse yourself in 45-minute deliberate practice sessions with zero-drift timestamp calculation.
3. **LEARN:** Execute deep study without multitasking.
4. **LOG:** Synthesize takeaways, what was built, open doubts, and rate confidence (1–5).
5. **REVISE:** Automated 4-interval spaced repetitions: **Day 0, Day +3, Day +15, Day +30**.
6. **COMPLETE:** A topic achieves `FULLY_COMPLETED` status only after completing initial study **plus all 4 revisions**.
7. **ANALYZE:** Inspect actual focus hours, retention trends, and habit streaks.

---

## 🚀 Key Features

* 📅 **Daily Learning Planner:** Intuitive day-by-day learning agenda with priority levels (`LOW`, `MEDIUM`, `HIGH`) and category filtering.
* ⏱️ **45-Minute Focus Clock:** Distraction-free countdown resilient to browser tab switching, sleep mode, and window minimizing via timestamp delta math.
* 🔔 **Sensory Completion Alerts:** Web Notifications API for desktop alerts and HTML5 Audio API for gentle meditation chimes (with autoplay policy pre-unlock).
* 📝 **Reflective Session Journal:** Structured post-focus logs capturing what was learned, practical outputs, lingering doubts, and subjective confidence.
* 🧠 **Spaced Revision Engine:** Deterministic scheduling that automatically schedules reviews on Day 0, Day +3, Day +15, and Day +30 to defeat the forgetting curve.
* 🏆 **Strict Mastery Invariant:** Backend-enforced requirement that all 4 spaced reviews must be completed before a topic is marked as mastered.
* 📆 **Interactive Learning Calendar:** FullCalendar integration presenting color-coded planned tasks, revision deadlines, and completed sessions.
* 📊 **Deep Analytics & Streaks:** Recharts visualizations tracking daily study hours, revision adherence, confidence trajectories, and verified learning streaks ($\ge 45$ min focus OR $\ge 1$ revision).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js (App Router), React, TypeScript |
| **Styling & Design System** | Tailwind CSS + shadcn/ui (Radix UI Primitives) |
| **Backend & Mutations** | Next.js Server Actions (Primary) + Route Handlers (Feeds) |
| **Database & ORM** | MySQL 8.0+ (InnoDB) + Prisma ORM |
| **Authentication** | Auth.js (NextAuth v5) with HTTP-only secure cookies |
| **Validation** | Zod (100% server-side validation) |
| **Form Handling** | React Hook Form (`@hookform/resolvers/zod`) |
| **Data Visualizations** | Recharts (Responsive SVG Charts) |
| **Calendar Engine** | FullCalendar (`@fullcalendar/react`) |
| **Alerts & Sound** | Web Notifications API + HTML5 Audio API |
| **Automated Testing** | Vitest (Unit & Integration) + Playwright (E2E) |
| **Package Manager** | npm |

---

## 📁 Project Architecture & Directory Structure

```
learn-track/
├── docs/                        # Complete technical and product documentation
│   ├── 01-product-requirements.md
│   ├── 02-user-stories.md
│   ├── 03-user-flows.md
│   ├── 04-feature-specification.md
│   ├── 05-ui-ux-specification.md
│   ├── 06-technical-architecture.md
│   ├── 07-database-schema.md
│   ├── 08-api-specification.md
│   ├── 09-pomodoro-focus-system.md
│   ├── 10-revision-engine.md
│   ├── 11-notification-system.md
│   ├── 12-analytics-specification.md
│   ├── 13-security-requirements.md
│   ├── 14-testing-strategy.md
│   └── 15-development-roadmap.md
├── prisma/
│   ├── schema.prisma            # Normalized relational database schema
│   ├── migrations/              # Automated Prisma migrations
│   └── seed.ts                  # Development seed data script
├── public/
│   ├── sounds/                  # High-quality chime audio files (.mp3, .ogg)
│   ├── icons/                   # Web Notification & PWA icons
│   └── favicon.ico
├── src/
│   ├── app/                     # Next.js App Router routes & layouts
│   ├── components/              # shadcn/ui primitives & shared layout elements
│   ├── features/                # Domain feature modules (tasks, focus, revisions)
│   ├── hooks/                   # Custom hooks (useFocusTimer, useNotifications)
│   ├── lib/                     # Database client, auth configuration, date helpers
│   ├── server/                  # Server Actions, domain services, Zod validators
│   └── types/                   # Shared TypeScript models and enums
├── tests/                       # Unit, integration, and Playwright E2E suites
├── AGENTS.md                    # Core rules and invariants for AI agents
├── README.md                    # Project overview & local setup guide
└── package.json                 # Dependency manifest
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
* **Node.js:** v18.18.0+ or v20+
* **npm:** v9+
* **MySQL:** v8.0+ (Running locally or via Docker)

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-org/learntrack.git
cd learntrack
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Database Connection (MySQL)
DATABASE_URL="mysql://root:password@localhost:3306/learntrack_dev"

# Auth.js / NextAuth Configuration
AUTH_SECRET="generate-a-32-byte-hex-or-base64-secret" # e.g. `npx auth secret`
NEXTAUTH_URL="http://localhost:3000"

# Application Public URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Setup MySQL Database with Prisma
```bash
# Push schema migrations to your MySQL instance
npx prisma migrate dev --name init

# Generate Prisma Client types
npx prisma generate

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Suite

LearnTrack maintains high test coverage across critical business logic:

```bash
# Run unit tests (Date calculations, timer delta math, mastery rules)
npm run test:unit

# Run integration tests against test database (Prisma transactions, isolation)
npm run test:integration

# Run Playwright End-to-End tests (Headless browser user journeys)
npm run test:e2e

# Run type checker and linter
npm run typecheck
npm run lint
```

---

## 📚 Complete Documentation Index

For in-depth architectural and operational specifications, consult the `/docs` directory:
* [01 — Product Requirements Document (PRD)](file:///d:/LearnTrack/docs/01-product-requirements.md)
* [02 — User Stories & Acceptance Criteria](file:///d:/LearnTrack/docs/02-user-stories.md)
* [03 — User Flows & State Pathways](file:///d:/LearnTrack/docs/03-user-flows.md)
* [04 — Feature Specification](file:///d:/LearnTrack/docs/04-feature-specification.md)
* [05 — UI/UX Specification & Design System](file:///d:/LearnTrack/docs/05-ui-ux-specification.md)
* [06 — Technical Architecture & ADRs](file:///d:/LearnTrack/docs/06-technical-architecture.md)
* [07 — Database Schema & Prisma Models](file:///d:/LearnTrack/docs/07-database-schema.md)
* [08 — Backend API & Server Actions](file:///d:/LearnTrack/docs/08-api-specification.md)
* [09 — 45-Minute Focus Session & Timer](file:///d:/LearnTrack/docs/09-pomodoro-focus-system.md)
* [10 — Spaced Revision Engine & Mastery Logic](file:///d:/LearnTrack/docs/10-revision-engine.md)
* [11 — Notification & Sound Systems](file:///d:/LearnTrack/docs/11-notification-system.md)
* [12 — Analytics & Streak Engine](file:///d:/LearnTrack/docs/12-analytics-specification.md)
* [13 — Security Architecture & Threat Model](file:///d:/LearnTrack/docs/13-security-requirements.md)
* [14 — Testing Strategy & QA Plan](file:///d:/LearnTrack/docs/14-testing-strategy.md)
* [15 — Phased Development Roadmap](file:///d:/LearnTrack/docs/15-development-roadmap.md)
* [AGENTS.md — AI Coding Agent Protocol & Constraints](file:///d:/LearnTrack/AGENTS.md)

---

## 🤝 Contribution & Maintenance Guidelines

1. **Read `AGENTS.md` & Core Docs:** All contributors must understand the core invariants (45-minute focus, Day 0/+3/+15/+30 revisions, `FULLY_COMPLETED` rule).
2. **Never Bypass Tenant Scoping:** Every database query touching user entities must enforce `where: { userId }` derived from the session token.
3. **Strict Type Safety:** Avoid `any` or unsafe type casts. Ensure Zod schemas remain the single source of truth for runtime validation.
4. **License:** Distributed under the MIT License.
