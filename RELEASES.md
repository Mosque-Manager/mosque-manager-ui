# 📋 Masjid Manager — Project Release Document

> **Project**: Masjid Manager  
> **Start Date**: 16 March 2026  
> **Status**: Planning Complete — Ready for Implementation  
> **Repository**: `/mosque`  
> **Cost**: $0 (all free-tier services)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Multi-Tenancy & Roles](#multi-tenancy--roles)
4. [Data Models](#data-models)
5. [File Structure](#file-structure)
6. [Release 1 — Foundation & Auth](#release-1--foundation--auth)
7. [Release 2 — Contributor Management](#release-2--contributor-management)
8. [Release 3 — Monthly Payment Tracking](#release-3--monthly-payment-tracking)
9. [Release 4 — WhatsApp Reminders](#release-4--whatsapp-reminders)
10. [Release 5 — Imam Salary Management](#release-5--imam-salary-management)
11. [Release 6 — Expenses & Donations](#release-6--expenses--donations)
12. [Release 7 — Balance Dashboard](#release-7--balance-dashboard)
13. [Release 8 — Member Directory & Roles](#release-8--member-directory--roles)
14. [Release 9 — Events & Announcements](#release-9--events--announcements)
15. [Release 10 — PDF Reports](#release-10--pdf-reports)
16. [Release 11 — Multi-Language (i18n)](#release-11--multi-language-i18n)
17. [Release 12 — Polish & Deploy](#release-12--polish--deploy)
18. [Release Dependency Graph](#release-dependency-graph)
19. [Architecture Decisions](#architecture-decisions)
20. [Environment Variables](#environment-variables)
21. [Future Enhancements](#future-enhancements)

---

## Project Overview

**Masjid Manager** is a free, multi-tenant web application for managing mosque finances and operations. It enables any mosque to:

- Track imam salaries and monthly payments
- Manage contributor lists and their monthly dues
- Send WhatsApp payment reminders (free, no API)
- Track expenses (electricity, maintenance, etc.) and donations
- View real-time mosque balance and financial health
- Generate downloadable PDF reports
- Manage events and announcements
- Support multiple languages (English, Hindi, Urdu)

The app is **generic** — any mosque can sign up and use it independently.

---

## Architecture & Tech Stack

### Why No Separate Node.js Backend?

Next.js API Routes + Server Actions serve as the backend. A separate Express/Node.js service would:
- Require a second free host (Render/Railway have cold starts, sleep after 15min inactivity)
- Add CORS configuration complexity and extra network hops
- Be over-engineered for this app's scale

**Decision**: Single Next.js app handles everything. Can extract to standalone API later if a mobile app is needed.

### Tech Stack

| Layer | Technology | Cost | Purpose |
|-------|-----------|------|---------|
| Framework | Next.js 14 (App Router) | Free | Full-stack React framework with Server Actions & API Routes |
| Language | TypeScript | Free | Type safety across frontend & backend |
| Database | MongoDB Atlas (M0 Free Tier) | Free | 512MB storage, shared cluster, sufficient for hundreds of mosques |
| ODM | Mongoose | Free | Schema validation, query building, middleware |
| Authentication | NextAuth.js v5 | Free | Credentials provider + JWT sessions |
| UI Framework | Tailwind CSS | Free | Utility-first CSS |
| UI Components | shadcn/ui | Free | Accessible, customizable React components |
| PDF Generation | jsPDF | Free | Client-side PDF rendering (no server cost) |
| Internationalization | next-intl | Free | Multi-language support with message files |
| WhatsApp | wa.me deep links | Free | Pre-filled reminder messages via URL scheme |
| Hosting | Vercel (Hobby Plan) | Free | Serverless deployment, edge network, custom domains |
| Cron Jobs | Vercel Cron | Free | Scheduled tasks (monthly reminders) |
| Validation | Zod | Free | Runtime schema validation for forms & API inputs |

### NPM Packages (Complete List)

```
# Core
next@14               # Framework
react@18              # UI library
react-dom@18          # React DOM
typescript            # Type safety

# Database
mongoose              # MongoDB ODM

# Auth
next-auth@5           # Authentication (beta for App Router)
bcryptjs              # Password hashing

# UI
tailwindcss           # CSS framework
@tailwindcss/forms    # Form styles
class-variance-authority  # Component variants (shadcn/ui dep)
clsx                  # Conditional classes
tailwind-merge        # Merge Tailwind classes
lucide-react          # Icons

# Validation
zod                   # Schema validation

# i18n
next-intl             # Internationalization

# PDF
jspdf                 # Client-side PDF generation
jspdf-autotable       # Table support for jsPDF

# Dev
@types/node           # Node types
@types/react          # React types
@types/bcryptjs       # bcrypt types
eslint                # Linting
eslint-config-next    # Next.js ESLint config
```

---

## Multi-Tenancy & Roles

### Multi-Tenancy Model

- **Single database**, tenant isolation via `mosqueId` field on every document
- Every query is scoped: `Model.find({ mosqueId: currentUserMosqueId })`
- Middleware enforces `mosqueId` injection — no accidental cross-tenant data leaks
- Super admin bypasses mosque scoping

### Role-Based Access Control (RBAC)

| Role | Scope | Permissions |
|------|-------|-------------|
| **Super Admin** | Global | Full access to all mosques and data, system-level operations |
| **Admin** | Per Mosque | Full CRUD on all data within their mosque, manage members |
| **Member** | Per Mosque | Read-only access to mosque data |

**Key Rules:**
- Anyone can sign up and register **one mosque** → automatically becomes **Admin** of that mosque
- A regular user can only register one mosque (Super Admin can create multiple)
- Admin can add members (read-only) or promote them to Admin
- Super Admin (first user in the system) can access and manage everything

### RBAC Implementation Strategy

```
Middleware chain:
1. NextAuth session check → reject if unauthenticated
2. Extract user role + mosqueId from JWT token
3. Route-level permission check via rbac.ts helper
4. For API routes: validate mosqueId in request matches user's mosqueId
5. For pages: server-side redirect if unauthorized
```

---

## Data Models

### 1. Users

```
Collection: users
{
  _id:          ObjectId       (auto)
  name:         String         (required, trimmed)
  email:        String         (required, unique, lowercase)
  phone:        String         (optional, for WhatsApp)
  passwordHash: String         (required, bcrypt hashed)
  isSuperAdmin: Boolean        (default: false)
  lang:         String         (enum: 'en' | 'hi' | 'ur', default: 'en')
  createdAt:    Date           (auto)
  updatedAt:    Date           (auto)
}
Indexes: { email: 1 } (unique)
```

### 2. Mosques

```
Collection: mosques
{
  _id:        ObjectId       (auto)
  name:       String         (required)
  address:    String         (optional)
  city:       String         (optional)
  phone:      String         (optional)
  createdBy:  ObjectId       (ref: Users)
  isActive:   Boolean        (default: true)
  createdAt:  Date           (auto)
  updatedAt:  Date           (auto)
}
Indexes: { createdBy: 1 }
```

### 3. MosqueMembers (Join Table)

```
Collection: mosquemembers
{
  _id:       ObjectId       (auto)
  mosqueId:  ObjectId       (ref: Mosques, required)
  userId:    ObjectId       (ref: Users, required)
  role:      String         (enum: 'admin' | 'member', required)
  joinedAt:  Date           (default: now)
}
Indexes: { mosqueId: 1, userId: 1 } (unique compound)
         { userId: 1 }
```

### 4. Imams

```
Collection: imams
{
  _id:        ObjectId       (auto)
  mosqueId:   ObjectId       (ref: Mosques, required)
  userId:     ObjectId       (ref: Users, optional — linked if imam has login)
  name:       String         (required)
  phone:      String         (optional)
  salary:     Number         (required, monthly salary amount)
  startDate:  Date           (required)
  endDate:    Date           (optional — set when imam leaves)
  isActive:   Boolean        (default: true)
  createdAt:  Date           (auto)
  updatedAt:  Date           (auto)
}
Indexes: { mosqueId: 1, isActive: 1 }
```

### 5. Contributors

```
Collection: contributors
{
  _id:                ObjectId       (auto)
  mosqueId:           ObjectId       (ref: Mosques, required)
  name:               String         (required)
  phone:              String         (required — needed for WhatsApp reminders)
  fixedMonthlyAmount: Number         (required — fixed amount due each month)
  address:            String         (optional)
  isActive:           Boolean        (default: true)
  createdAt:          Date           (auto)
  updatedAt:          Date           (auto)
}
Indexes: { mosqueId: 1, isActive: 1 }
         { mosqueId: 1, phone: 1 }
```

### 6. Payments (Contributor Monthly Payments)

```
Collection: payments
{
  _id:            ObjectId       (auto)
  mosqueId:       ObjectId       (ref: Mosques, required)
  contributorId:  ObjectId       (ref: Contributors, required)
  amount:         Number         (required — should match contributor's fixedMonthlyAmount)
  month:          Number         (1-12, required)
  year:           Number         (e.g., 2026, required)
  paidAt:         Date           (required — actual payment date)
  method:         String         (enum: 'cash' | 'upi' | 'bank_transfer' | 'other', default: 'cash')
  note:           String         (optional)
  recordedBy:     ObjectId       (ref: Users)
  createdAt:      Date           (auto)
}
Indexes: { mosqueId: 1, month: 1, year: 1 }
         { mosqueId: 1, contributorId: 1, month: 1, year: 1 } (unique compound — one payment per contributor per month)
```

### 7. Expenses

```
Collection: expenses
{
  _id:         ObjectId       (auto)
  mosqueId:    ObjectId       (ref: Mosques, required)
  category:    String         (enum: 'electricity' | 'water' | 'maintenance' | 'cleaning' | 'misc', required)
  amount:      Number         (required)
  date:        Date           (required)
  description: String         (optional)
  addedBy:     ObjectId       (ref: Users)
  createdAt:   Date           (auto)
  updatedAt:   Date           (auto)
}
Indexes: { mosqueId: 1, date: -1 }
         { mosqueId: 1, category: 1 }
```

### 8. Donations

```
Collection: donations
{
  _id:         ObjectId       (auto)
  mosqueId:    ObjectId       (ref: Mosques, required)
  donorName:   String         (required — or "Anonymous")
  donorPhone:  String         (optional)
  amount:      Number         (required)
  date:        Date           (required)
  purpose:     String         (optional — e.g., "Ramadan fund", "construction")
  isAnonymous: Boolean        (default: false)
  addedBy:     ObjectId       (ref: Users)
  createdAt:   Date           (auto)
}
Indexes: { mosqueId: 1, date: -1 }
```

### 9. SalaryPayments

```
Collection: salarypayments
{
  _id:       ObjectId       (auto)
  mosqueId:  ObjectId       (ref: Mosques, required)
  imamId:    ObjectId       (ref: Imams, required)
  amount:    Number         (required)
  month:     Number         (1-12, required)
  year:      Number         (required)
  paidAt:    Date           (required)
  addedBy:   ObjectId       (ref: Users)
  createdAt: Date           (auto)
}
Indexes: { mosqueId: 1, month: 1, year: 1 }
         { mosqueId: 1, imamId: 1, month: 1, year: 1 } (unique compound)
```

### 10. Events

```
Collection: events
{
  _id:         ObjectId       (auto)
  mosqueId:    ObjectId       (ref: Mosques, required)
  title:       String         (required)
  description: String         (optional)
  date:        Date           (required)
  createdBy:   ObjectId       (ref: Users)
  createdAt:   Date           (auto)
  updatedAt:   Date           (auto)
}
Indexes: { mosqueId: 1, date: -1 }
```

---

## Module Spec Documentation Convention

### Rule
Every **module folder** inside `src/lib/` MUST have a spec file (`<MODULE>.md`) that documents the contracts, dependencies, and behavior of all files within that folder. This is the **single source of truth** for understanding what that module does without reading the code.

### Why?
- Future developers (or yourself after 6 months) can understand any module in 2 minutes
- Changing a function? Check the spec first to understand its callers and contracts
- TypeScript types document *what*, spec files document *why* and *how*

### Spec Files to Maintain

| Spec File | What It Documents |
|-----------|-------------------|
| `src/lib/models/MODELS.md` | All 10 Mongoose schemas — fields, types, indexes, relationships between models, validation rules |
| `src/lib/actions/ACTIONS.md` | All server actions — function signatures, input/output types, which roles can call them, which models they depend on, error cases |
| `src/lib/validations/VALIDATIONS.md` | All Zod schemas — field constraints, custom validators, which forms/actions use each schema |
| `src/lib/reports/REPORTS.md` | Report generation — PDF structure, sections, data sources, formatting rules |

### Spec File Template

Every spec file MUST follow this structure:

```markdown
# <Module Name> Spec

> Last Updated: <date>
> Release: R<number>

## Overview
Brief description of what this module does.

## Files
| File | Purpose | Created In |
|------|---------|------------|
| `User.ts` | User authentication model | R1 |
| `Mosque.ts` | Mosque tenant model | R1 |

## Contracts

### <FunctionName / SchemaName>
- **Purpose**: What it does
- **Input**: Parameters / fields with types
- **Output**: Return type
- **Depends On**: Other models/actions it calls
- **Called By**: Pages/components that use it
- **Permissions**: Which roles can access (if applicable)
- **Error Cases**: What can go wrong

## Relationships
How files in this module relate to each other and to other modules.

## Changelog
| Date | Release | Change |
|------|---------|--------|
| 16 Mar 2026 | R1 | Initial creation with User, Mosque, MosqueMember models |
```

### Rules for Maintaining Spec Files

1. **When creating a new file** in a module → add its entry to the spec file in the same commit
2. **When modifying a function signature** (inputs/outputs change) → update the spec file
3. **When adding a new function** to an existing file → add its contract to the spec
4. **When deleting a function/file** → remove it from the spec and note in changelog
5. **Do NOT document internal implementation details** — only document the public contract (what it accepts, what it returns, who can call it)
6. **Spec files are NOT optional** — treat them as part of the definition of done for every task

### What Does NOT Need a Spec File

- **Pages** (`src/app/`) — behavior is defined in RELEASES.md tasks & acceptance criteria
- **UI Components** (`src/components/ui/`) — these are shadcn/ui, self-documenting
- **Dashboard Components** (`src/components/dashboard/`) — props are typed in TypeScript
- **Translation files** (`src/messages/`) — self-documenting JSON
- **Config files** (`next.config.js`, `tailwind.config.ts`) — standard configs

---

## File Structure

```
mosque/
├── RELEASES.md                         ← This document
├── .env.local                          ← Environment variables (not committed)
├── .env.example                        ← Template for env vars
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   └── logo.svg
│
└── src/
    ├── app/
    │   ├── layout.tsx                  ← Root layout (providers, fonts)
    │   ├── page.tsx                    ← Landing/redirect page
    │   │
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.tsx            ← Login page
    │   │   ├── signup/
    │   │   │   └── page.tsx            ← Signup page
    │   │   └── layout.tsx              ← Auth layout (centered card)
    │   │
    │   ├── (dashboard)/
    │   │   ├── layout.tsx              ← Dashboard layout (sidebar + navbar)
    │   │   ├── page.tsx                ← Dashboard home (balance overview)
    │   │   │
    │   │   ├── mosques/                ← [Super Admin] Mosque management
    │   │   │   ├── page.tsx            ← List all mosques
    │   │   │   ├── new/page.tsx        ← Create mosque form
    │   │   │   └── [id]/page.tsx       ← Edit mosque
    │   │   │
    │   │   ├── contributors/           ← [R2] Contributor management
    │   │   │   ├── page.tsx            ← Contributor list
    │   │   │   ├── new/page.tsx        ← Add contributor form
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx        ← Contributor detail
    │   │   │       └── edit/page.tsx   ← Edit contributor
    │   │   │
    │   │   ├── payments/               ← [R3] Payment tracking
    │   │   │   ├── page.tsx            ← Monthly payment grid
    │   │   │   └── reminders/
    │   │   │       └── page.tsx        ← [R4] WhatsApp reminder page
    │   │   │
    │   │   ├── salary/                 ← [R5] Imam salary
    │   │   │   ├── page.tsx            ← Salary management
    │   │   │   ├── imams/
    │   │   │   │   ├── new/page.tsx    ← Add imam
    │   │   │   │   └── [id]/page.tsx   ← Imam detail + salary history
    │   │   │   └── my-salary/
    │   │   │       └── page.tsx        ← [Imam role] Own salary view
    │   │   │
    │   │   ├── expenses/               ← [R6] Expense tracking
    │   │   │   ├── page.tsx            ← Expense list
    │   │   │   └── new/page.tsx        ← Add expense
    │   │   │
    │   │   ├── donations/              ← [R6] Donation tracking
    │   │   │   ├── page.tsx            ← Donation list
    │   │   │   └── new/page.tsx        ← Add donation
    │   │   │
    │   │   ├── events/                 ← [R9] Events
    │   │   │   ├── page.tsx            ← Event list
    │   │   │   └── new/page.tsx        ← Create event
    │   │   │
    │   │   ├── reports/                ← [R10] PDF reports
    │   │   │   └── page.tsx            ← Report generation page
    │   │   │
    │   │   ├── members/                ← [R8] Member directory
    │   │   │   ├── page.tsx            ← Member list
    │   │   │   └── invite/page.tsx     ← Invite member
    │   │   │
    │   │   └── settings/
    │   │       └── page.tsx            ← Mosque settings
    │   │
    │   └── api/
    │       ├── auth/
    │       │   └── [...nextauth]/
    │       │       └── route.ts        ← NextAuth API route
    │       └── cron/
    │           └── reminders/
    │               └── route.ts        ← Vercel Cron endpoint
    │
    ├── lib/
    │   ├── db.ts                       ← MongoDB connection singleton
    │   ├── auth.ts                     ← NextAuth configuration
    │   ├── rbac.ts                     ← Role-based access control helpers
    │   ├── utils.ts                    ← General utilities (cn, formatCurrency, etc.)
    │   │
    │   ├── models/                     ← Mongoose models
    │   │   ├── MODELS.md               ← ⚠️ SPEC FILE — all model schemas, indexes, relationships
    │   │   ├── User.ts
    │   │   ├── Mosque.ts
    │   │   ├── MosqueMember.ts
    │   │   ├── Imam.ts
    │   │   ├── Contributor.ts
    │   │   ├── Payment.ts
    │   │   ├── Expense.ts
    │   │   ├── Donation.ts
    │   │   ├── SalaryPayment.ts
    │   │   └── Event.ts
    │   │
    │   ├── actions/                    ← Server Actions (grouped by domain)
    │   │   ├── ACTIONS.md              ← ⚠️ SPEC FILE — all action signatures, permissions, dependencies
    │   │   ├── auth.ts                 ← signup, login actions
    │   │   ├── mosque.ts               ← create, update, delete mosque
    │   │   ├── contributor.ts          ← contributor CRUD
    │   │   ├── payment.ts              ← payment recording
    │   │   ├── salary.ts               ← salary payment actions
    │   │   ├── expense.ts              ← expense CRUD
    │   │   ├── donation.ts             ← donation CRUD
    │   │   ├── event.ts                ← event CRUD
    │   │   └── member.ts               ← member invite, role change
    │   │
    │   ├── validations/                ← Zod schemas (mirrors models)
    │   │   ├── VALIDATIONS.md          ← ⚠️ SPEC FILE — all Zod schemas, constraints, usage
    │   │   ├── auth.ts
    │   │   ├── contributor.ts
    │   │   ├── payment.ts
    │   │   └── ...
    │   │
    │   └── reports/                    ← PDF report generation
    │       ├── REPORTS.md              ← ⚠️ SPEC FILE — report structure, sections, data sources
    │       ├── monthly.ts
    │       └── yearly.ts
    │
    ├── components/
    │   ├── ui/                         ← shadcn/ui components (button, card, input, etc.)
    │   ├── dashboard/
    │   │   ├── Sidebar.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── SummaryCard.tsx
    │   │   └── PaymentGrid.tsx
    │   └── shared/
    │       ├── LanguageSwitcher.tsx
    │       ├── DataTable.tsx
    │       ├── ConfirmDialog.tsx
    │       └── EmptyState.tsx
    │
    ├── messages/                        ← i18n translation files
    │   ├── en.json
    │   ├── hi.json
    │   └── ur.json
    │
    ├── types/
    │   └── index.ts                    ← Shared TypeScript types & interfaces
    │
    └── middleware.ts                    ← Auth + i18n middleware
```

---

## Release 1 — Foundation & Auth

| Field | Value |
|-------|-------|
| **Depends On** | None (first release) |
| **Status** | 🔲 Not Started |

### Goal
A working app where users can sign up, log in, and a super admin can create a mosque with a basic dashboard shell.

### Tasks

- [ ] **1.1** Initialize Next.js 14 project with TypeScript
  ```
  npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
- [ ] **1.2** Install dependencies: `mongoose`, `next-auth@beta`, `bcryptjs`, `zod`, `lucide-react`
- [ ] **1.3** Install and initialize shadcn/ui: `npx shadcn-ui@latest init`
  - Add components: `button`, `card`, `input`, `label`, `form`, `toast`, `dropdown-menu`, `avatar`, `separator`, `sheet`
- [ ] **1.4** Create `.env.local` with MongoDB URI, NextAuth secret
- [ ] **1.5** Create `src/lib/db.ts` — MongoDB connection singleton with cached connection
- [ ] **1.6** Create Mongoose models:
  - `src/lib/models/User.ts` — name, email, phone, passwordHash, isSuperAdmin, lang
  - `src/lib/models/Mosque.ts` — name, address, city, phone, createdBy, isActive
  - `src/lib/models/MosqueMember.ts` — mosqueId, userId, role, joinedAt
- [ ] **1.7** Create `src/lib/auth.ts` — NextAuth config with CredentialsProvider
  - Hash passwords with bcryptjs (10 rounds)
  - JWT strategy with custom `userId`, `isSuperAdmin`, `mosqueId`, `role` in token
  - Callbacks: `jwt` (attach user data) + `session` (expose to client)
- [ ] **1.8** Create `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
- [ ] **1.9** Create `src/lib/rbac.ts` — helper functions:
  - `checkRole(session, allowedRoles[])` — returns boolean
  - `requireRole(session, allowedRoles[])` — throws/redirects if unauthorized
  - `getMosqueId(session)` — extract current mosque ID from session
- [ ] **1.10** Create `src/middleware.ts` — redirect unauthenticated users to `/login`
- [ ] **1.11** Create auth pages:
  - `src/app/(auth)/layout.tsx` — centered card layout
  - `src/app/(auth)/signup/page.tsx` — name, email, phone, password form
  - `src/app/(auth)/login/page.tsx` — email + password form
- [ ] **1.12** Create server actions:
  - `src/lib/actions/auth.ts` — `signUp(formData)`: validate with Zod, hash password, create user, auto-create first user as super admin
- [ ] **1.13** Create dashboard layout:
  - `src/app/(dashboard)/layout.tsx` — sidebar + top navbar
  - `src/components/dashboard/Sidebar.tsx` — navigation links (role-aware)
  - `src/components/dashboard/Navbar.tsx` — user menu, mosque name, logout
- [ ] **1.14** Create dashboard home:
  - `src/app/(dashboard)/page.tsx` — welcome message, placeholder summary cards
- [ ] **1.15** Create mosque management (super admin only):
  - `src/app/(dashboard)/mosques/page.tsx` — list mosques
  - `src/app/(dashboard)/mosques/new/page.tsx` — create mosque form (name, address, city)
  - `src/lib/actions/mosque.ts` — `createMosque(formData)`: create mosque + auto-assign creator as mosque admin in MosqueMembers
- [ ] **1.16** Create `src/types/index.ts` — shared TypeScript interfaces
- [ ] **1.17** Create `src/lib/utils.ts` — `cn()` class merger utility
- [ ] **1.18** Create module spec files:
  - `src/lib/models/MODELS.md` — document User, Mosque, MosqueMember schemas, indexes, and relationships
  - `src/lib/actions/ACTIONS.md` — document signUp and createMosque actions with signatures, permissions, and dependencies
  - `src/lib/validations/VALIDATIONS.md` — document auth validation schemas

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/db.ts` | Create |
| `src/lib/auth.ts` | Create |
| `src/lib/rbac.ts` | Create |
| `src/lib/utils.ts` | Create |
| `src/lib/models/User.ts` | Create |
| `src/lib/models/Mosque.ts` | Create |
| `src/lib/models/MosqueMember.ts` | Create |
| `src/lib/actions/auth.ts` | Create |
| `src/lib/actions/mosque.ts` | Create |
| `src/lib/models/MODELS.md` | Create (spec file — User, Mosque, MosqueMember) |
| `src/lib/actions/ACTIONS.md` | Create (spec file — signUp, createMosque) |
| `src/lib/validations/VALIDATIONS.md` | Create (spec file — auth schemas) |
| `src/app/(auth)/layout.tsx` | Create |
| `src/app/(auth)/login/page.tsx` | Create |
| `src/app/(auth)/signup/page.tsx` | Create |
| `src/app/(dashboard)/layout.tsx` | Create |
| `src/app/(dashboard)/page.tsx` | Create |
| `src/app/(dashboard)/mosques/page.tsx` | Create |
| `src/app/(dashboard)/mosques/new/page.tsx` | Create |
| `src/components/dashboard/Sidebar.tsx` | Create |
| `src/components/dashboard/Navbar.tsx` | Create |
| `src/app/api/auth/[...nextauth]/route.ts` | Create |
| `src/middleware.ts` | Create |
| `src/types/index.ts` | Create |
| `.env.local` | Create |
| `.env.example` | Create |

### Acceptance Criteria
- [ ] User can sign up with name, email, phone, password
- [ ] User can log in with email + password
- [ ] First registered user becomes super admin automatically
- [ ] Super admin can create a new mosque
- [ ] After creating a mosque, creator is auto-assigned as mosque admin
- [ ] Dashboard sidebar shows navigation links
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Non-super-admin users cannot access `/mosques/new`

---

## Release 2 — Contributor Management

| Field | Value |
|-------|-------|
| **Depends On** | Release 1 |
| **Status** | 🔲 Not Started |

### Goal
Mosque admin can manage the list of people who contribute monthly to the mosque.

### Tasks

- [ ] **2.1** Create Mongoose model:
  - `src/lib/models/Contributor.ts` — mosqueId, name, phone, fixedMonthlyAmount, address, isActive
- [ ] **2.2** Create Zod validation schema:
  - `src/lib/validations/contributor.ts` — name (required), phone (required, valid format), fixedMonthlyAmount (required, positive number)
- [ ] **2.3** Create server actions in `src/lib/actions/contributor.ts`:
  - `getContributors(mosqueId, filters?)` — paginated list with search & active/inactive filter
  - `getContributor(id)` — single contributor
  - `createContributor(formData)` — validate + create
  - `updateContributor(id, formData)` — validate + update
  - `deleteContributor(id)` — soft delete (set isActive: false)
- [ ] **2.4** Create contributor list page:
  - `src/app/(dashboard)/contributors/page.tsx`
  - Search bar (by name or phone)
  - Filter: Active / Inactive / All
  - Table: Name, Phone, Monthly Amount, Status, Actions (Edit, Delete)
  - "Add Contributor" button → navigates to `/contributors/new`
- [ ] **2.5** Create add contributor page:
  - `src/app/(dashboard)/contributors/new/page.tsx`
  - Form: Name, Phone, Monthly Amount, Address (optional)
  - Validation feedback
  - On success: redirect to contributor list with success toast
- [ ] **2.6** Create contributor detail page:
  - `src/app/(dashboard)/contributors/[id]/page.tsx`
  - Show contributor info + payment history (placeholder until R3)
- [ ] **2.7** Create edit contributor page:
  - `src/app/(dashboard)/contributors/[id]/edit/page.tsx`
  - Pre-filled form, same as add form
- [ ] **2.8** Create shared `DataTable` component:
  - `src/components/shared/DataTable.tsx` — reusable table with pagination, sorting
- [ ] **2.9** Create `ConfirmDialog` component:
  - `src/components/shared/ConfirmDialog.tsx` — "Are you sure?" modal for deletes
- [ ] **2.10** Update sidebar navigation to include "Contributors" link (visible to admin role)
- [ ] **2.11** Update spec files:
  - `src/lib/models/MODELS.md` — add Contributor model documentation
  - `src/lib/actions/ACTIONS.md` — add contributor CRUD action signatures and permissions
  - `src/lib/validations/VALIDATIONS.md` — add contributor validation schema

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/models/Contributor.ts` | Create |
| `src/lib/validations/contributor.ts` | Create |
| `src/lib/actions/contributor.ts` | Create |
| `src/app/(dashboard)/contributors/page.tsx` | Create |
| `src/app/(dashboard)/contributors/new/page.tsx` | Create |
| `src/app/(dashboard)/contributors/[id]/page.tsx` | Create |
| `src/app/(dashboard)/contributors/[id]/edit/page.tsx` | Create |
| `src/components/shared/DataTable.tsx` | Create |
| `src/components/shared/ConfirmDialog.tsx` | Create |
| `src/components/dashboard/Sidebar.tsx` | Modify (add Contributors link) |
| `src/lib/models/MODELS.md` | Update (add Contributor model) |
| `src/lib/actions/ACTIONS.md` | Update (add contributor actions) |
| `src/lib/validations/VALIDATIONS.md` | Update (add contributor schema) |

### Acceptance Criteria
- [ ] Admin can add a contributor with name, phone, and monthly amount
- [ ] Admin can view all contributors in a searchable, filterable table
- [ ] Admin can edit a contributor's details
- [ ] Admin can deactivate (soft delete) a contributor
- [ ] Phone number is validated (10+ digits)
- [ ] Monthly amount must be a positive number
- [ ] Duplicate phone within same mosque shows warning
- [ ] Sidebar shows "Contributors" for mosque admin role (hidden from super admin)
- [ ] Super admin can click a mosque card to view its details and contributors

---

## Release 3 — Monthly Payment Tracking

| Field | Value |
|-------|-------|
| **Depends On** | Release 2 |
| **Status** | 🔲 Not Started |

### Goal
Track which contributors have paid their monthly dues — the core functionality.

### Tasks

- [ ] **3.1** Create Mongoose model:
  - `src/lib/models/Payment.ts` — mosqueId, contributorId, amount, month, year, paidAt, method, note, recordedBy
  - Unique compound index: `{ mosqueId, contributorId, month, year }`
- [ ] **3.2** Create Zod validation schema:
  - `src/lib/validations/payment.ts`
- [ ] **3.3** Create server actions in `src/lib/actions/payment.ts`:
  - `getMonthlyPayments(mosqueId, month, year)` — all contributor payments for a given month
  - `recordPayment(formData)` — mark contributor as paid
  - `removePayment(id)` — undo a payment record
  - `getPaymentSummary(mosqueId, month, year)` — totals: collected, pending, % paid
- [ ] **3.4** Create payment tracking page:
  - `src/app/(dashboard)/payments/page.tsx`
  - **Month/Year selector** at top (defaults to current month)
  - **Payment grid**: rows = contributors, columns = [Name, Phone, Amount Due, Status, Actions]
  - Status: ✅ Paid (green badge with date) / ❌ Unpaid (red badge)
  - Actions: "Mark Paid" button (opens modal to enter date, method, note) / "Undo" for paid entries
  - **Summary cards** at top: Total Expected, Total Collected, Pending, % Collected
- [ ] **3.5** Create `PaymentGrid` component:
  - `src/components/dashboard/PaymentGrid.tsx`
  - Responsive grid/table
  - Quick "Mark Paid" toggle
- [ ] **3.6** Create `SummaryCard` component:
  - `src/components/dashboard/SummaryCard.tsx` — reusable stat card (icon, title, value, color)
- [ ] **3.7** Create payment record modal/dialog:
  - Date (default: today), Payment method (cash/upi/bank/other), Note (optional)
- [ ] **3.8** Update contributor detail page to show actual payment history (replace R2 placeholder)
- [ ] **3.9** Update dashboard home page with payment summary for current month
- [ ] **3.10** Update spec files:
  - `src/lib/models/MODELS.md` — add Payment model documentation
  - `src/lib/actions/ACTIONS.md` — add payment action signatures and permissions
  - `src/lib/validations/VALIDATIONS.md` — add payment validation schema

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/models/Payment.ts` | Create |
| `src/lib/validations/payment.ts` | Create |
| `src/lib/actions/payment.ts` | Create |
| `src/app/(dashboard)/payments/page.tsx` | Create |
| `src/components/dashboard/PaymentGrid.tsx` | Create |
| `src/components/dashboard/SummaryCard.tsx` | Create |
| `src/app/(dashboard)/contributors/[id]/page.tsx` | Modify (add payment history) |
| `src/app/(dashboard)/page.tsx` | Modify (add payment summary) |
| `src/lib/models/MODELS.md` | Update (add Payment model) |
| `src/lib/actions/ACTIONS.md` | Update (add payment actions) |
| `src/lib/validations/VALIDATIONS.md` | Update (add payment schema) |

### Acceptance Criteria
- [ ] Admin sees all contributors for selected month with paid/unpaid status
- [ ] Admin can mark a contributor as paid (with date, method, note)
- [ ] Admin can undo a payment record
- [ ] Summary cards show correct totals (collected, pending, percentage)
- [ ] Changing month/year refreshes the grid with correct data
- [ ] A contributor can only have one payment per month (unique constraint)
- [ ] Payment amount defaults to contributor's fixed monthly amount
- [ ] Contributor detail page shows chronological payment history

---

## Release 4 — WhatsApp Reminders

| Field | Value |
|-------|-------|
| **Depends On** | Release 3 |
| **Status** | 🔲 Not Started |

### Goal
One-tap WhatsApp reminders for contributors who haven't paid yet.

### Tasks

- [ ] **4.1** Create reminder page:
  - `src/app/(dashboard)/payments/reminders/page.tsx`
  - Month selector (defaults to current month)
  - List of unpaid contributors with: Name, Phone, Amount Due, WhatsApp button
- [ ] **4.2** Implement WhatsApp link generation:
  - Helper function in `src/lib/utils.ts`: `generateWhatsAppLink(phone, message)`
  - URL format: `https://wa.me/<countryCode><phone>?text=<urlencodedMessage>`
  - Default country code: +91 (India) — make configurable per mosque later
- [ ] **4.3** Create pre-filled reminder message templates:
  - English: "Assalamu Alaikum! This is a reminder for your monthly contribution of ₹{amount} for {mosqueName} for {month} {year}. JazakAllah Khair."
  - Hindi: "अस्सलामु अलैकुम! {mosqueName} के लिए {month} {year} की ₹{amount} की मासिक राशि का भुगतान बाकी है। जज़ाकल्लाह खैर।"
  - Urdu: "السلام علیکم! {mosqueName} کے لیے {month} {year} کی ₹{amount} ماہانہ رقم کی ادائیگی باقی ہے۔ جزاک اللہ خیر۔"
  - Message uses mosque's default language or admin's selected language
- [ ] **4.4** Add WhatsApp icon button per contributor row — opens wa.me link in new tab
- [ ] **4.5** Add "Send All Reminders" flow — sequentially opens WhatsApp links (one at a time, user taps through)
- [ ] **4.6** Vercel Cron stub:
  - `src/app/api/cron/reminders/route.ts` — GET endpoint, runs on 5th of each month
  - Logic: query all mosques → find unpaid contributors → log/flag for dashboard notification
  - Adds a "reminder flag" to dashboard (admin sees "X contributors haven't paid yet")
- [ ] **4.7** Add reminder badge to sidebar "Payments" link showing unpaid count
- [ ] **4.8** Update spec files:
  - `src/lib/actions/ACTIONS.md` — add WhatsApp link generation and cron endpoint documentation

### Files Created/Modified
| File | Action |
|------|--------|
| `src/app/(dashboard)/payments/reminders/page.tsx` | Create |
| `src/lib/utils.ts` | Modify (add `generateWhatsAppLink`) |
| `src/app/api/cron/reminders/route.ts` | Create |
| `src/components/dashboard/Sidebar.tsx` | Modify (add unpaid badge) |
| `src/lib/actions/ACTIONS.md` | Update (add reminder/cron actions) |

### Acceptance Criteria
- [ ] Reminder page lists only unpaid contributors for selected month
- [ ] Tapping WhatsApp button opens WhatsApp (web/app) with correct phone and pre-filled message
- [ ] Message includes correct mosque name, amount, month, and year
- [ ] Message language matches admin's preference
- [ ] Cron endpoint returns 200 and logs unpaid counts
- [ ] Sidebar shows unpaid contributor count badge

---

## Release 5 — Imam Salary Management

| Field | Value |
|-------|-------|
| **Depends On** | Release 1 |
| **Can Parallel With** | Releases 2, 3, 4 |
| **Status** | 🔲 Not Started |

### Goal
Track imam salaries and payment history. Imam can log in and view their own salary.

### Tasks

- [ ] **5.1** Create Mongoose models:
  - `src/lib/models/Imam.ts` — mosqueId, userId, name, phone, salary, startDate, endDate, isActive
  - `src/lib/models/SalaryPayment.ts` — mosqueId, imamId, amount, month, year, paidAt, addedBy
- [ ] **5.2** Create Zod validation schemas:
  - `src/lib/validations/salary.ts`
- [ ] **5.3** Create server actions in `src/lib/actions/salary.ts`:
  - `getImams(mosqueId)` — list imams (active and inactive)
  - `createImam(formData)` — add imam, optionally link to user account
  - `updateImam(id, formData)` — edit imam details/salary
  - `deactivateImam(id)` — set endDate and isActive: false
  - `recordSalaryPayment(formData)` — mark salary as paid for a month
  - `getSalaryHistory(imamId)` — all salary payments for an imam
  - `getMySalary(userId)` — for imam role: own salary history
- [ ] **5.4** Create salary management page:
  - `src/app/(dashboard)/salary/page.tsx`
  - Imam list: Name, Monthly Salary, Status (active/inactive), Actions
  - Per imam: payment status for each month (paid/unpaid grid, similar to R3)
  - "Add Imam" button
- [ ] **5.5** Create add/edit imam pages:
  - `src/app/(dashboard)/salary/imams/new/page.tsx`
  - `src/app/(dashboard)/salary/imams/[id]/page.tsx` — detail + salary history + record payment
- [ ] **5.6** Create imam self-service page:
  - `src/app/(dashboard)/salary/my-salary/page.tsx`
  - Read-only salary payment history table (month, year, amount, paid date)
  - Only accessible by users with `imam` role
- [ ] **5.7** When creating an imam, optionally invite them as a user:
  - Create user account with `imam` role in MosqueMembers
  - Or link to existing user by email
- [ ] **5.8** Update sidebar: add "Salary" link (admin, treasurer); add "My Salary" link (imam role)
- [ ] **5.9** Update spec files:
  - `src/lib/models/MODELS.md` — add Imam and SalaryPayment model documentation
  - `src/lib/actions/ACTIONS.md` — add salary action signatures and permissions
  - `src/lib/validations/VALIDATIONS.md` — add salary validation schema

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/models/Imam.ts` | Create |
| `src/lib/models/SalaryPayment.ts` | Create |
| `src/lib/validations/salary.ts` | Create |
| `src/lib/actions/salary.ts` | Create |
| `src/app/(dashboard)/salary/page.tsx` | Create |
| `src/app/(dashboard)/salary/imams/new/page.tsx` | Create |
| `src/app/(dashboard)/salary/imams/[id]/page.tsx` | Create |
| `src/app/(dashboard)/salary/my-salary/page.tsx` | Create |
| `src/components/dashboard/Sidebar.tsx` | Modify |
| `src/lib/models/MODELS.md` | Update (add Imam, SalaryPayment models) |
| `src/lib/actions/ACTIONS.md` | Update (add salary actions) |
| `src/lib/validations/VALIDATIONS.md` | Update (add salary schema) |

### Acceptance Criteria
- [ ] Admin can add an imam with name, phone, and salary amount
- [ ] Admin can record monthly salary payment
- [ ] One salary payment per imam per month (unique constraint)
- [ ] Admin can view salary payment history for each imam
- [ ] Imam can log in and see only their own salary history
- [ ] Imam cannot access any other page (RBAC enforced)
- [ ] Inactive imams are hidden by default but viewable via filter

---

## Release 6 — Expenses & Donations

| Field | Value |
|-------|-------|
| **Depends On** | Release 1 |
| **Can Parallel With** | Releases 2-5 |
| **Status** | 🔲 Not Started |

### Goal
Complete financial picture — track where money comes from (donations) and where it goes (expenses).

### Tasks

- [ ] **6.1** Create Mongoose models:
  - `src/lib/models/Expense.ts` — mosqueId, category, amount, date, description, addedBy
  - `src/lib/models/Donation.ts` — mosqueId, donorName, donorPhone, amount, date, purpose, isAnonymous, addedBy
- [ ] **6.2** Create Zod validation schemas:
  - `src/lib/validations/expense.ts`
  - `src/lib/validations/donation.ts`
- [ ] **6.3** Create server actions:
  - `src/lib/actions/expense.ts` — CRUD + `getExpenses(mosqueId, filters)` with category & date range filter
  - `src/lib/actions/donation.ts` — CRUD + `getDonations(mosqueId, filters)` with date range filter
- [ ] **6.4** Create expense pages:
  - `src/app/(dashboard)/expenses/page.tsx` — expense list with category pills, date filter, total
  - `src/app/(dashboard)/expenses/new/page.tsx` — add expense form (category dropdown, amount, date, description)
- [ ] **6.5** Create donation pages:
  - `src/app/(dashboard)/donations/page.tsx` — donation list with search, date filter, total
  - `src/app/(dashboard)/donations/new/page.tsx` — add donation form (donor name, phone, amount, date, purpose, anonymous toggle)
- [ ] **6.6** Expense categories (hardcoded enum for now):
  - Electricity, Water, Maintenance, Cleaning, Miscellaneous
- [ ] **6.7** Update sidebar: add "Expenses" and "Donations" links (admin, treasurer)
- [ ] **6.8** Update spec files:
  - `src/lib/models/MODELS.md` — add Expense and Donation model documentation
  - `src/lib/actions/ACTIONS.md` — add expense and donation action signatures and permissions
  - `src/lib/validations/VALIDATIONS.md` — add expense and donation validation schemas

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/models/Expense.ts` | Create |
| `src/lib/models/Donation.ts` | Create |
| `src/lib/validations/expense.ts` | Create |
| `src/lib/validations/donation.ts` | Create |
| `src/lib/actions/expense.ts` | Create |
| `src/lib/actions/donation.ts` | Create |
| `src/app/(dashboard)/expenses/page.tsx` | Create |
| `src/app/(dashboard)/expenses/new/page.tsx` | Create |
| `src/app/(dashboard)/donations/page.tsx` | Create |
| `src/app/(dashboard)/donations/new/page.tsx` | Create |
| `src/components/dashboard/Sidebar.tsx` | Modify |
| `src/lib/models/MODELS.md` | Update (add Expense, Donation models) |
| `src/lib/actions/ACTIONS.md` | Update (add expense, donation actions) |
| `src/lib/validations/VALIDATIONS.md` | Update (add expense, donation schemas) |

### Acceptance Criteria
- [ ] Admin can add an expense with category, amount, date, description
- [ ] Admin can add a donation with donor details and amount
- [ ] Anonymous donations hide donor name in display
- [ ] Expenses are filterable by category and date range
- [ ] Donations are filterable by date range and searchable by donor name
- [ ] List pages show running totals
- [ ] Treasurer role can access expense and donation pages

---

## Release 7 — Balance Dashboard

| Field | Value |
|-------|-------|
| **Depends On** | Releases 3, 5, 6 |
| **Status** | 🔲 Not Started |

### Goal
At-a-glance financial health dashboard — the homepage every admin sees.

### Tasks

- [ ] **7.1** Create dashboard aggregation server actions:
  - `src/lib/actions/dashboard.ts`:
    - `getDashboardSummary(mosqueId, month, year)` — returns:
      - Total contributions collected this month
      - Total contributions pending this month
      - Total expenses this month
      - Total salary paid this month
      - Total donations this month
      - **Net balance** = (contributions + donations) - (expenses + salary)
      - Cumulative balance (all-time)
    - `getMonthlyBreakdown(mosqueId, year)` — 12-month summary for charts
- [ ] **7.2** Redesign dashboard home page:
  - `src/app/(dashboard)/page.tsx` — full makeover:
  - **Top row**: 4 summary cards (Collected, Pending, Expenses, Balance) with month selector
  - **Middle row**: Month-wise income vs expense comparison (simple table or bar chart)
  - **Bottom row**: Quick actions (Record Payment, Add Expense, Send Reminders) + Recent Activity list
- [ ] **7.3** Create month/year navigation component:
  - `src/components/shared/MonthYearPicker.tsx` — reusable across dashboard, payments, reports
- [ ] **7.4** Implement Treasurer role scoping:
  - Update `rbac.ts` to allow treasurer access to: payments, salary, expenses, donations, dashboard, reports
  - Restrict treasurer from: contributors CRUD (read-only), members management, events, settings
- [ ] **7.5** Add cumulative balance display — running total that carries forward month to month
- [ ] **7.6** Update spec files:
  - `src/lib/actions/ACTIONS.md` — add dashboard aggregation action signatures

### Balance Formula
```
Monthly Balance = (Contributor Payments + Donations) - (Imam Salaries + Expenses)
Cumulative Balance = Sum of all Monthly Balances since mosque creation
```

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/actions/dashboard.ts` | Create |
| `src/app/(dashboard)/page.tsx` | Major Modify |
| `src/components/shared/MonthYearPicker.tsx` | Create |
| `src/lib/rbac.ts` | Modify (treasurer permissions) |
| `src/lib/actions/ACTIONS.md` | Update (add dashboard actions) |

### Acceptance Criteria
- [ ] Dashboard shows correct summary cards for selected month
- [ ] Balance calculation: (contributions + donations) - (salary + expenses) = correct amount
- [ ] Cumulative (all-time) balance is displayed and correct
- [ ] Month-wise breakdown shows 12 months of data
- [ ] Treasurer can access financial pages but not member/contributor management
- [ ] Dashboard loads within 2 seconds (aggregation queries are indexed)

---

## Release 8 — Member Directory & Roles

| Field | Value |
|-------|-------|
| **Depends On** | Release 1 |
| **Can Parallel With** | Releases 2-7 |
| **Status** | 🔲 Not Started |

### Goal
Full multi-role, multi-tenant access control with member management.

### Tasks

- [ ] **8.1** Create member management page:
  - `src/app/(dashboard)/members/page.tsx`
  - Member list: Name, Email, Phone, Role, Joined Date, Actions
  - Filter by role
  - Search by name/email
- [ ] **8.2** Create invite member page:
  - `src/app/(dashboard)/members/invite/page.tsx`
  - Form: Email, Role (dropdown: admin, treasurer, imam, member)
  - If user exists: add to mosque with role
  - If user doesn't exist: create user account with temporary password, link to mosque
- [ ] **8.3** Create server actions in `src/lib/actions/member.ts`:
  - `getMembers(mosqueId)` — all members of a mosque
  - `inviteMember(mosqueId, email, role)` — add existing or new user
  - `changeRole(mosqueId, userId, newRole)` — update member's role
  - `removeMember(mosqueId, userId)` — remove from mosque
- [ ] **8.4** Implement role-based sidebar navigation:
  - Super Admin: Mosques, All sections
  - Admin: All sections within their mosque
  - Treasurer: Dashboard, Payments, Salary, Expenses, Donations, Reports
  - Imam: Dashboard (limited), My Salary
  - Member: Dashboard (read-only)
- [ ] **8.5** Super admin features:
  - `src/app/(dashboard)/mosques/page.tsx` — list all mosques with member counts, created date
  - Ability to view/manage any mosque
  - Switch between mosques
- [ ] **8.6** Add "View-only" enforcement:
  - Member role sees dashboard and events only
  - All action buttons/forms hidden for member role
- [ ] **8.7** Add member count to mosque list (super admin view)
- [ ] **8.8** Update spec files:
  - `src/lib/actions/ACTIONS.md` — add member management action signatures and permissions

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/actions/member.ts` | Create |
| `src/app/(dashboard)/members/page.tsx` | Create |
| `src/app/(dashboard)/members/invite/page.tsx` | Create |
| `src/components/dashboard/Sidebar.tsx` | Major Modify (role-based nav) |
| `src/app/(dashboard)/mosques/page.tsx` | Modify (member counts) |
| `src/lib/rbac.ts` | Modify (view-only enforcement) |
| `src/lib/actions/ACTIONS.md` | Update (add member actions) |

### Acceptance Criteria
- [ ] Admin can invite a member by email with a specific role
- [ ] Admin can change a member's role
- [ ] Admin can remove a member from the mosque
- [ ] Sidebar navigation reflects the user's role correctly
- [ ] View-only members cannot see action buttons or forms
- [ ] Imam can only see "My Salary" in sidebar
- [ ] Super admin can switch between mosques
- [ ] Data is fully isolated between mosques (verified with 2+ mosques)

---

## Release 9 — Events & Announcements

| Field | Value |
|-------|-------|
| **Depends On** | Release 1 |
| **Can Parallel With** | All others |
| **Status** | 🔲 Not Started |

### Goal
Mosque admins can post events and announcements visible to all members.

### Tasks

- [ ] **9.1** Create Mongoose model:
  - `src/lib/models/Event.ts` — mosqueId, title, description, date, createdBy
- [ ] **9.2** Create Zod validation:
  - `src/lib/validations/event.ts`
- [ ] **9.3** Create server actions in `src/lib/actions/event.ts`:
  - `getEvents(mosqueId)` — list sorted by date (upcoming first)
  - `getUpcomingEvents(mosqueId, limit)` — next N events for dashboard
  - `createEvent(formData)` — create event
  - `updateEvent(id, formData)` — edit event
  - `deleteEvent(id)` — remove event
- [ ] **9.4** Create event pages:
  - `src/app/(dashboard)/events/page.tsx` — event list (upcoming + past separated)
  - `src/app/(dashboard)/events/new/page.tsx` — create event form (title, description, date)
- [ ] **9.5** Create "Upcoming Events" card for dashboard home:
  - Shows next 3 events with date and title
  - "View All" link to events page
- [ ] **9.6** Update sidebar: add "Events" link (visible to all roles)
- [ ] **9.7** Update spec files:
  - `src/lib/models/MODELS.md` — add Event model documentation
  - `src/lib/actions/ACTIONS.md` — add event action signatures and permissions
  - `src/lib/validations/VALIDATIONS.md` — add event validation schema

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/models/Event.ts` | Create |
| `src/lib/validations/event.ts` | Create |
| `src/lib/actions/event.ts` | Create |
| `src/app/(dashboard)/events/page.tsx` | Create |
| `src/app/(dashboard)/events/new/page.tsx` | Create |
| `src/app/(dashboard)/page.tsx` | Modify (add upcoming events card) |
| `src/components/dashboard/Sidebar.tsx` | Modify |
| `src/lib/models/MODELS.md` | Update (add Event model) |
| `src/lib/actions/ACTIONS.md` | Update (add event actions) |
| `src/lib/validations/VALIDATIONS.md` | Update (add event schema) |

### Acceptance Criteria
- [ ] Admin can create an event with title, description, and date
- [ ] Events page shows upcoming events first, then past events
- [ ] Dashboard shows next 3 upcoming events
- [ ] All roles (including view-only member) can see events
- [ ] Only admin can create/edit/delete events

---

## Release 10 — PDF Reports

| Field | Value |
|-------|-------|
| **Depends On** | Release 7 |
| **Status** | 🔲 Not Started |

### Goal
Downloadable monthly and yearly financial reports as PDF.

### Tasks

- [ ] **10.1** Install jsPDF + jspdf-autotable
- [ ] **10.2** Create report generation logic:
  - `src/lib/reports/monthly.ts` — generates monthly PDF:
    - Header: Mosque name, month/year, generated date
    - Section 1: Contributor Payments — table (name, amount due, amount paid, status)
    - Section 2: Imam Salary — table (imam name, salary, paid date)
    - Section 3: Expenses — table (category, description, amount, date)
    - Section 4: Donations — table (donor, amount, purpose, date)
    - Section 5: Summary — total in, total out, net balance
  - `src/lib/reports/yearly.ts` — generates yearly PDF:
    - 12-month summary table (month, contributions, salary, expenses, donations, net)
    - Yearly totals row
    - Year-end balance
- [ ] **10.3** Create reports page:
  - `src/app/(dashboard)/reports/page.tsx`
  - Month/Year picker
  - "Download Monthly Report" button
  - "Download Yearly Report" button
  - Preview section showing summary before download
- [ ] **10.4** Server actions to fetch report data:
  - `src/lib/actions/report.ts` — `getMonthlyReportData(mosqueId, month, year)`, `getYearlyReportData(mosqueId, year)`
- [ ] **10.5** Update sidebar: add "Reports" link (admin, treasurer)
- [ ] **10.6** Create spec file:
  - `src/lib/reports/REPORTS.md` — document report structure, sections, data sources, formatting rules
- [ ] **10.7** Update spec files:
  - `src/lib/actions/ACTIONS.md` — add report data fetching action signatures

### Files Created/Modified
| File | Action |
|------|--------|
| `src/lib/reports/monthly.ts` | Create |
| `src/lib/reports/yearly.ts` | Create |
| `src/lib/actions/report.ts` | Create |
| `src/app/(dashboard)/reports/page.tsx` | Create |
| `src/components/dashboard/Sidebar.tsx` | Modify |
| `src/lib/reports/REPORTS.md` | Create (spec file — report structure, data sources) |
| `src/lib/actions/ACTIONS.md` | Update (add report actions) |

### Acceptance Criteria
- [ ] Monthly PDF contains all 5 sections with correct data
- [ ] Yearly PDF contains 12-month breakdown with totals
- [ ] PDF header shows correct mosque name and date
- [ ] Numbers in PDF match dashboard numbers exactly
- [ ] PDF downloads successfully on mobile and desktop browsers
- [ ] Treasurer can access reports page

---

## Release 11 — Multi-Language (i18n)

| Field | Value |
|-------|-------|
| **Depends On** | Any (overlay release) |
| **Status** | 🔲 Not Started |

### Goal
Full app translated into English, Hindi, and Urdu.

### Tasks

- [ ] **11.1** Install and configure `next-intl`
- [ ] **11.2** Update `next.config.js` with i18n configuration
- [ ] **11.3** Update `src/middleware.ts` to handle locale detection and routing
- [ ] **11.4** Create translation files:
  - `src/messages/en.json` — English (base language, all keys)
  - `src/messages/hi.json` — Hindi translations
  - `src/messages/ur.json` — Urdu translations
- [ ] **11.5** Translation key categories:
  - `common` — shared labels (Save, Cancel, Delete, Edit, Back, etc.)
  - `auth` — login, signup, logout labels
  - `nav` — sidebar navigation labels
  - `dashboard` — summary cards, headings
  - `contributors` — form labels, table headers
  - `payments` — payment status, grid labels
  - `reminders` — WhatsApp message templates
  - `salary` — imam salary labels
  - `expenses` — expense categories, form labels
  - `donations` — donation form labels
  - `events` — event labels
  - `reports` — report titles, section headers
  - `members` — member management labels
  - `errors` — validation and error messages
- [ ] **11.6** Create language switcher:
  - `src/components/shared/LanguageSwitcher.tsx` — dropdown in navbar (🇬🇧 EN / 🇮🇳 HI / 🇵🇰 UR)
  - Persists selection in user profile (DB) and cookie (instant)
- [ ] **11.7** RTL support for Urdu:
  - Add `dir="rtl"` to `<html>` tag when Urdu is selected
  - Tailwind RTL plugin or manual `rtl:` variants for layout flipping
- [ ] **11.8** Replace all hardcoded strings across all pages with translation keys
- [ ] **11.9** Translate WhatsApp reminder messages in all 3 languages

### Files Created/Modified
| File | Action |
|------|--------|
| `src/messages/en.json` | Create |
| `src/messages/hi.json` | Create |
| `src/messages/ur.json` | Create |
| `src/components/shared/LanguageSwitcher.tsx` | Create |
| `next.config.js` | Modify |
| `src/middleware.ts` | Modify |
| `src/app/layout.tsx` | Modify (dir attribute) |
| All page files | Modify (replace hardcoded strings) |

### Acceptance Criteria
- [ ] All UI text renders in the selected language
- [ ] Language preference persists across sessions
- [ ] Urdu layout flows right-to-left correctly
- [ ] WhatsApp reminders send in the correct language
- [ ] No English text leaks through in Hindi/Urdu mode
- [ ] Language switcher is accessible on every page

---

## Release 12 — Polish & Deploy

| Field | Value |
|-------|-------|
| **Depends On** | All releases |
| **Status** | 🔲 Not Started |

### Goal
Production-ready, deployed, and usable by real mosques.

### Tasks

- [ ] **12.1** Mobile-first responsive audit:
  - Test every page at 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)
  - Payment grid horizontal scroll on mobile
  - Sidebar converts to hamburger menu on mobile
  - Touch-friendly buttons (min 44px tap target)
- [ ] **12.2** Loading & error states:
  - Add `loading.tsx` skeleton files for each route group
  - Add `error.tsx` error boundary files
  - Global toast notification system (success, error, info)
- [ ] **12.3** Form validation:
  - Zod schemas on ALL forms (client + server validation)
  - Inline error messages
  - Disable submit button while processing
- [ ] **12.4** Security hardening:
  - Rate limiting on `/api/auth/*` routes (10 requests/min per IP)
  - Sanitize all user inputs
  - CSRF protection (built into Next.js Server Actions)
  - Secure headers (via `next.config.js`)
- [ ] **12.5** Performance:
  - MongoDB indexes verified for all common queries
  - React `Suspense` boundaries for streaming
  - Image optimization (Next.js `<Image />` for any images)
- [ ] **12.6** SEO & metadata:
  - `metadata` export on all pages (title, description)
  - `robots.txt` and `sitemap.xml`
  - Open Graph tags for sharing
- [ ] **12.7** Deploy to Vercel:
  - Connect GitHub repository
  - Set environment variables in Vercel dashboard
  - Configure custom domain (optional, free on Vercel)
  - Verify all routes work in production
- [ ] **12.8** Vercel Cron configuration:
  - `vercel.json` — configure cron schedule for `/api/cron/reminders`
  - Schedule: `0 9 5 * *` (5th of each month at 9 AM)
- [ ] **12.9** Create `.env.example` with all required variables documented
- [ ] **12.10** Write `README.md` with:
  - Project description
  - Setup instructions
  - Environment variables list
  - Deployment guide

### Files Created/Modified
| File | Action |
|------|--------|
| Multiple `loading.tsx` files | Create |
| Multiple `error.tsx` files | Create |
| `vercel.json` | Create |
| `README.md` | Create |
| `.env.example` | Create |
| `next.config.js` | Modify (security headers) |
| All form pages | Modify (Zod validation) |

### Acceptance Criteria
- [ ] All pages render correctly on mobile (375px+)
- [ ] Loading skeletons appear while data fetches
- [ ] Error boundaries catch and display errors gracefully
- [ ] All forms show validation errors inline
- [ ] Auth endpoints are rate-limited
- [ ] App deploys successfully to Vercel
- [ ] Cron job triggers monthly on schedule
- [ ] README documents complete setup process
- [ ] Lighthouse score: Performance > 80, Accessibility > 90

---

## Release Dependency Graph

```
R1 (Foundation & Auth)
├── R2 (Contributors) → R3 (Payments) → R4 (WhatsApp Reminders)
│                                   ↘
├── R5 (Imam Salary) ───────────────→ R7 (Balance Dashboard) → R10 (PDF Reports)
│                                   ↗
├── R6 (Expenses & Donations) ──────
│
├── R8 (Member Directory & Roles)
│
├── R9 (Events & Announcements)
│
R11 (i18n) ← can overlay any release
│
R12 (Polish & Deploy) ← depends on all
```

**Parallel tracks after R1:**
- Track A: R2 → R3 → R4
- Track B: R5
- Track C: R6
- Track D: R8
- Track E: R9
- Merge point: R7 (needs R3 + R5 + R6)
- Then: R10 (needs R7)
- Overlay: R11 (anytime)
- Final: R12 (everything done)

---

## Architecture Decisions

| Decision | Chosen | Alternatives Considered | Reasoning |
|----------|--------|------------------------|-----------|
| Backend | Next.js API Routes | Separate Node.js/Express | Single codebase, single deploy, free hosting, sufficient for scale |
| Database | MongoDB Atlas Free | Supabase, PlanetScale, Firebase | Flexible schema, generous free tier (512MB), Mongoose ecosystem |
| Auth | NextAuth.js | Clerk, Auth0, Firebase Auth | Free, self-hosted, full control, works natively with Next.js |
| UI | shadcn/ui + Tailwind | Material UI, Chakra, Ant Design | Copy-paste components (full control), excellent DX, lightweight |
| WhatsApp | wa.me deep links | WhatsApp Business API, Twilio | Truly free, no API key, works universally |
| PDF | jsPDF (client-side) | Puppeteer, wkhtmltopdf | No server cost, works in browser, sufficient for tabular reports |
| i18n | next-intl | next-i18next, react-intl | Purpose-built for App Router, clean API, good docs |
| Hosting | Vercel Free | Netlify, Render, Railway | Best Next.js support, generous free tier, built-in cron |

---

## Environment Variables

```bash
# .env.local

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/masjid-manager?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-32-char-string>  # Generate: openssl rand -base64 32

# App
NEXT_PUBLIC_APP_NAME=Masjid Manager
NEXT_PUBLIC_DEFAULT_COUNTRY_CODE=91
NEXT_PUBLIC_DEFAULT_CURRENCY=₹

# Vercel Cron (production only)
CRON_SECRET=<random-string>  # Protect cron endpoint
```

---

## Future Enhancements (Post-MVP)

These are NOT part of the 12 releases but are potential future additions:

1. **PWA (Progressive Web App)** — Add service worker, web manifest, offline caching so the app can be "installed" on any phone's home screen without app stores. Cost: $0. This is the recommended path for mobile distribution.
2. **CSV/Excel Export** — Export any data table as CSV alongside PDF
3. **Bulk "Mark All Paid"** — One-click to mark all contributors as paid
4. **Google OAuth** — Login with Google as alternative to email/password
5. **Mobile App** — React Native app consuming Next.js API routes (would justify extracting to separate service layer)
6. **SMS Reminders** — If budget allows, integrate Twilio/MSG91 for SMS
7. **Dashboard Charts** — Visual charts using Recharts or Chart.js
8. **Audit Log** — Track who did what and when (for accountability)
9. **Recurring Expense Templates** — Auto-create monthly expenses (e.g., electricity)
10. **Multi-Mosque Switching** — Users who are members of multiple mosques can switch context

---

*Document Last Updated: 16 March 2026*
*Maintained by: Masjid Manager Development Team*
