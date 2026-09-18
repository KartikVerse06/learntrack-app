# LearnTrack — Deliberate Learning & Spaced Revision System

[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)](https://nextjs.org/)
[![Node.js/Express](https://img.shields.io/badge/Backend-Express_+_TypeScript-green?logo=node.js)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://www.prisma.io/)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel_+_Render-blue)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **LearnTrack** is a dedicated learning self-tracking web application designed for self-directed learners to structure their learning, maintain 45-minute deliberate focus blocks, record reflective session logs, and defeat the forgetting curve via an automated 4-stage spaced revision schedule.

---

## 🏛️ Decoupled Production Architecture

LearnTrack is architected into cleanly decoupled, independently deployable tiers:

```
┌────────────────────────────────────────────────────────┐
│               Frontend Tier (Vercel)                   │
│   Next.js 14 App Router • Tailwind CSS • shadcn/ui    │
│   Zero Prisma / DB Dependencies • Port 3000 (Dev)      │
└──────────────────────────┬─────────────────────────────┘
                           │ REST API (Bearer JWT / Cookies)
┌──────────────────────────▼─────────────────────────────┐
│             Backend API Tier (Render)                  │
│   Node.js + Express + TypeScript • Port 4000 (Dev)     │
│   Prisma ORM • MySQL 8.0+ • Business Rules Engine      │
│   Spaced Revision Scheduler • Reports (PDF/CSV/JSON)   │
└──────────────────────────┬─────────────────────────────┘
                           │ MySQL Protocol (InnoDB)
┌──────────────────────────▼─────────────────────────────┐
│                 Database (MySQL)                       │
│   10 Normalized Tables • Strict Tenant Isolation       │
└────────────────────────────────────────────────────────┘
```

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
8. **MONEY:** 50/20/20/10 financial allocation, autosaving expense tracker, and multi-year history.
9. **REPORTS:** Generate and download comprehensive, printable PDF, CSV, and JSON dossiers.

---

## 📁 Repository Structure

```
learntrack/
├── backend/                     # Backend API Tier (Node.js + Express + TypeScript)
│   ├── docs/                    # Backend architecture, schema, API & testing specs
│   ├── prisma/                  # Prisma schema, migrations, and seed script
│   ├── src/
│   │   ├── config/              # Centralized environment configuration
│   │   ├── controllers/         # Express controllers (Auth, Tasks, Focus, Revisions, etc.)
│   │   ├── middleware/          # Auth, validation, and error handling middleware
│   │   ├── repositories/        # Database access layer with zero-trust tenant isolation
│   │   ├── routes/              # Express routers under /api/v1
│   │   ├── lib/                 # Core utilities (JWT, date math, reports generation)
│   │   └── server.ts            # Express server bootstrap & /health endpoint
│   ├── tests/                   # 20+ automated integration tests with supertest
│   ├── render.yaml              # Render deployment blueprint
│   ├── AGENTS.md                # Coding agent operational protocol for backend
│   └── package.json
│
├── frontend/                    # Frontend Web Tier (Next.js 14 App Router)
│   ├── docs/                    # Frontend UI/UX, user flows, notification specs
│   ├── src/
│   │   ├── app/                 # Next.js App Router (Dashboard, Planner, Focus, etc.)
│   │   ├── components/          # Reusable UI primitives & layout elements
│   │   ├── features/            # Feature modules (Tasks, Revisions, Focus, Money, Reports)
│   │   ├── lib/api/             # Centralized typed API client communicating with Backend
│   │   ├── server/actions/      # Transparent Server Action adapters
│   │   └── types/               # View models and domain types
│   ├── vercel.json              # Vercel deployment blueprint & security headers
│   ├── AGENTS.md                # Coding agent operational protocol for frontend
│   └── package.json
│
├── .gitignore                   # Production git ignore rules
└── README.md                    # Project documentation and quickstart
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
* **Node.js:** v18.18.0+ or v20+
* **npm:** v9+
* **MySQL:** v8.0+ (Running locally or via Docker)

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
DATABASE_URL="mysql://root:password@localhost:3306/learntrack"
PORT=4000
JWT_SECRET="super-secret-jwt-key-change-in-production-min-32-chars"
CORS_ORIGIN="http://localhost:3000"
NODE_ENV="development"
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 3. Setup Database & Seed
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run Both Services Locally

```bash
# Terminal 1: Start Backend API (Port 4000)
cd backend
npm run dev

# Terminal 2: Start Frontend Web App (Port 3001)
cd frontend
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.
* **Demo Credentials:** `demo@learntrack.app` / `Password123!`
* **Backend Health Check:** [http://localhost:4000/health](http://localhost:4000/health)

---

## 🧪 Testing & Verification Commands

```bash
# Backend Verification
cd backend
npm run typecheck
npm run test
npm run build

# Frontend Verification
cd frontend
npm run typecheck
npm run lint
npm run test
npm run build
```

---

## 🚀 Production Deployment Guide

### Deploying Backend to Render
1. Connect your repository to **Render**.
2. Select **Web Service** or use the included `backend/render.yaml` Blueprint.
3. Configure settings:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install && npm run db:generate && npm run build`
   * **Start Command:** `npm run start`
4. Set environment variables on the Render Dashboard:
   * `DATABASE_URL`: Hosted MySQL connection string
   * `JWT_SECRET`: 64-character random string
   * `CORS_ORIGIN`: Your Vercel frontend URL (e.g., `https://learntrack.vercel.app`)
   * `NODE_ENV`: `production`

### Deploying Frontend to Vercel
1. Import your repository into **Vercel**.
2. Configure project settings:
   * **Root Directory:** `frontend`
   * **Framework Preset:** `Next.js`
3. Set environment variable:
   * `NEXT_PUBLIC_API_URL`: Your deployed Render API URL (e.g., `https://learntrack-api.onrender.com`)
4. Deploy! Vercel will automatically run `npm run build` using the included `frontend/vercel.json`.

---

## 🤝 Invariants & Architecture Guidelines

1. **Zero-Trust Tenant Isolation:** The backend extracts the verified user identity exclusively from the JWT session token (`req.user.userId`). Client-supplied user IDs are rejected.
2. **45-Minute Focus Block:** Focus sessions are strictly 2,700 seconds calculated via timestamp delta math (`Date.now() - startTime - pausedDuration`).
3. **Automated 4-Interval Revision Schedule:** Topic completion atomically creates exactly 4 revisions: Day 0, Day +3, Day +15, and Day +30.
4. **Mastery Invariant:** A task achieves `FULLY_COMPLETED` status only after initial study and all 4 revisions are completed.
5. **No Direct Database Access on Frontend:** Frontend components and pages communicate strictly via the typed API client SDK (`@/lib/api/*`).
