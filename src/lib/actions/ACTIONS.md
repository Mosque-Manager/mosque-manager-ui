# Actions Spec

> Last Updated: 16 March 2026
> Release: R1–R3

## Overview
Server Actions handling business logic for the Masjid Manager application. All actions are marked with `'use server'` and validate inputs via Zod schemas before processing.

## Files

| File | Purpose | Created In |
|------|---------|------------|
| `auth.ts` | User registration | R1 |
| `mosque.ts` | Mosque CRUD + queries | R1 |
| `contributor.ts` | Contributor CRUD | R2 |
| `payment.ts` | Payment recording and queries | R3 |

## Contracts

### `signUp(formData: FormData)` — `auth.ts`
- **Purpose**: Register a new user account
- **Input**: FormData with `name`, `email`, `phone`, `password`
- **Output**: `ActionResponse` — `{ success, message, errors? }`
- **Validation**: `signUpSchema` from `validations/auth.ts`
- **Depends On**: `User` model
- **Permissions**: Public (no auth required)
- **Logic**:
  1. Validate input with Zod
  2. Check for duplicate email
  3. If first user → set `isSuperAdmin: true`
  4. Hash password with bcrypt (10 rounds)
  5. Create user document
- **Error Cases**:
  - Validation fails → returns field errors
  - Duplicate email → returns error message
- **Called By**: `(auth)/signup/page.tsx`

### `createMosque(formData: FormData)` — `mosque.ts`
- **Purpose**: Create a new mosque and assign creator as admin
- **Input**: FormData with `name`, `address`, `city`, `phone`
- **Output**: `ActionResponse`
- **Validation**: `createMosqueSchema` from `validations/mosque.ts`
- **Depends On**: `Mosque` model, `MosqueMember` model
- **Permissions**: Any authenticated user (`getSessionUser()`)
- **Logic**:
  1. Verify authenticated via `getSessionUser()`
  2. Non-super-admin: check if user already has a mosque (one mosque per user)
  3. Validate input with Zod
  4. Create mosque document
  5. Create MosqueMember with role `admin` for the creator
- **Error Cases**:
  - Not authenticated → redirect to `/login`
  - Non-super-admin already has a mosque → returns error message
  - Validation fails → returns field errors
- **Called By**: `(dashboard)/mosques/new/page.tsx`

### `getMosques()` — `mosque.ts`
- **Purpose**: List mosques accessible to the current user
- **Input**: None
- **Output**: `MosqueData[]`
- **Depends On**: `Mosque` model
- **Permissions**: Any authenticated user (`getSessionUser()`)
- **Logic**: Super admin sees all active mosques; regular users see only mosques they belong to (via MosqueMember)
- **Called By**: `(dashboard)/mosques/page.tsx`

### `getMosque(id)` — `mosque.ts`
- **Purpose**: Get a single mosque's details
- **Input**: `id: string`
- **Output**: `MosqueData | null`
- **Depends On**: `Mosque` model, `MosqueMember` model
- **Permissions**: Any authenticated user (`getSessionUser()`)
- **Logic**: Super admin can view any mosque; regular users can only view mosques they belong to
- **Called By**: `(dashboard)/mosques/[id]/page.tsx`

### `getMosqueContributors(mosqueId)` — `mosque.ts`
- **Purpose**: List all active contributors for a specific mosque
- **Input**: `mosqueId: string`
- **Output**: `ContributorData[]`
- **Depends On**: `Contributor` model, `MosqueMember` model
- **Permissions**: Any authenticated user (`getSessionUser()`)
- **Logic**: Super admin can view any mosque's contributors; regular users must be a member of the mosque
- **Called By**: `(dashboard)/mosques/[id]/page.tsx`

---

## File: `actions/contributor.ts`

### `getContributors(filters?)`
- **Input**: `{ search?: string, status?: 'active'|'inactive'|'all', page?: number, limit?: number }`
- **Output**: `{ contributors: ContributorData[], total, page, totalPages }`
- **Depends On**: `Contributor` model
- **Permissions**: Admin only (`requireRole(['admin'])`)
- **Logic**: Paginated query filtered by mosqueId, status, and optional search (name/phone regex)

### `getContributor(id)`
- **Input**: `id: string`
- **Output**: `ContributorData | null`
- **Permissions**: Admin or Member
- **Logic**: Find by _id + mosqueId

### `createContributor(formData)`
- **Input**: FormData (name, phone, fixedMonthlyAmount, address?)
- **Output**: `ActionResponse`
- **Permissions**: Admin only
- **Validation**: `contributorSchema` (Zod)
- **Logic**: Check duplicate phone within mosque, then create

### `updateContributor(id, formData)`
- **Input**: `id: string`, FormData
- **Output**: `ActionResponse`
- **Permissions**: Admin only
- **Validation**: `contributorSchema` (Zod)
- **Logic**: Check duplicate phone (excluding self), then findOneAndUpdate by _id + mosqueId

### `deleteContributor(id)`
- **Input**: `id: string`
- **Output**: `ActionResponse`
- **Permissions**: Admin only
- **Logic**: Soft delete — set `isActive: false`

---

## File: `actions/payment.ts`

### `getMonthlyPayments(month, year)`
- **Input**: `month: number`, `year: number`
- **Output**: `MonthlyPaymentRow[]` (contributor + payment or null)
- **Permissions**: Admin only (`requireRole(['admin'])`)
- **Logic**: Fetch all active contributors and payments for the given month, merge into rows

### `getPaymentSummary(month, year)`
- **Input**: `month: number`, `year: number`
- **Output**: `PaymentSummary` (totalExpected, totalCollected, totalPending, paidCount, unpaidCount, totalContributors)
- **Permissions**: Admin only
- **Logic**: Aggregate contributors and payments for totals

### `recordPayment(formData)`
- **Input**: FormData (contributorId, amount, month, year, paidAt, method, note?)
- **Output**: `ActionResponse`
- **Permissions**: Admin only
- **Validation**: `paymentSchema` (Zod)
- **Logic**: Verify contributor belongs to mosque, check for duplicate (unique index), create payment

### `removePayment(paymentId)`
- **Input**: `paymentId: string`
- **Output**: `ActionResponse`
- **Permissions**: Admin only
- **Logic**: Delete payment by _id + mosqueId

### `getContributorPayments(contributorId)`
- **Input**: `contributorId: string`
- **Output**: `PaymentData[]`
- **Permissions**: Admin or Member
- **Logic**: Fetch all payments for contributor, sorted by year/month descending

### `getDashboardPaymentSummary(mosqueId, month, year)`
- **Input**: `mosqueId: string`, `month: number`, `year: number`
- **Output**: `PaymentSummary`
- **Permissions**: Called internally (no RBAC — dashboard page handles auth)
- **Logic**: Same as getPaymentSummary but accepts mosqueId directly

## Changelog

| Date | Release | Change |
|------|---------|--------|
| 16 Mar 2026 | R3 | Added payment CRUD actions (record, remove, queries, dashboard summary) |
| 16 Mar 2026 | R2 | Added getMosque, getMosqueContributors actions; Contributors hidden from super admin sidebar |
| 16 Mar 2026 | R2 | Added contributor CRUD actions |
| 16 Mar 2026 | R1 | Initial creation — signUp, createMosque, getMosques |
