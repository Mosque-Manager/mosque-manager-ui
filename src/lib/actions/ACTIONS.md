# Actions Spec

> Last Updated: 20 March 2026
> Release: R1–R4, R8

## Overview
Server Actions handling business logic for the Masjid Manager application. All actions are marked with `'use server'` and validate inputs via Zod schemas before processing.

## Files

| File | Purpose | Created In |
|------|---------|------------|
| `auth.ts` | User registration | R1 |
| `mosque.ts` | Mosque CRUD + queries | R1 |
| `contributor.ts` | Contributor CRUD | R2 |
| `payment.ts` | Payment recording, queries, unpaid tracking | R3, R4 |
| `member.ts` | Invite link generation, acceptance, member management | R8 |

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

### `getUnpaidContributors(month, year)` — R4
- **Input**: `month: number`, `year: number`
- **Output**: `ContributorData[]`
- **Permissions**: Admin only
- **Logic**: Returns active contributors who have not paid for the given month/year

### `getUnpaidCount()` — R4
- **Input**: None (uses current month/year)
- **Output**: `number`
- **Permissions**: Admin only
- **Logic**: Returns count of unpaid contributors for the current month (sidebar badge)

---

## File: `api/cron/reminders/route.ts` — R4

### `GET /api/cron/reminders`
- **Auth**: Bearer token (`CRON_SECRET` env var)
- **Output**: `{ ok, month, year, mosquesChecked, totalUnpaid, details[] }`
- **Logic**: Queries all active mosques, counts unpaid contributors per mosque, logs results
- **Schedule**: 5th of each month (via Vercel Cron)

---

## Utility Functions: `src/lib/utils.ts` — R4

### `generateWhatsAppLink(phone, message, countryCode?)`
- **Input**: `phone: string`, `message: string`, `countryCode: string` (default `'91'`)
- **Output**: `string` — `https://wa.me/<phone>?text=<encoded message>`

### `generateReminderMessage(mosqueName, amount, month, year, lang?)`
- **Input**: `mosqueName: string`, `amount: number`, `month: number`, `year: number`, `lang: 'en' | 'hi' | 'ur'`
- **Output**: `string` — Pre-filled reminder message in the selected language

### `getMonthName(month, lang?)`
- **Input**: `month: number` (1-12), `lang: 'en' | 'hi' | 'ur'`
- **Output**: `string` — Localized month name

---

### `createInviteLink(role?)` — `member.ts`
- **Purpose**: Generate a unique invite link for a mosque
- **Input**: `role: 'admin' | 'member'` (default: `'member'`)
- **Output**: `ActionResponse<{ url: string; token: string }>`
- **Validation**: `inviteSchema` from `validations/member.ts`
- **Depends On**: `Invite` model
- **Permissions**: Admin only
- **Logic**: Generates crypto random token, stores in DB with 7-day expiry

### `getInviteDetails(token)` — `member.ts`
- **Purpose**: Validate and get details of an invite link
- **Input**: `token: string`
- **Output**: `ActionResponse<InviteDetails>` — mosqueame, role, expired, used
- **Depends On**: `Invite`, `Mosque` models
- **Permissions**: Public (no auth required)

### `acceptInvite(token)` — `member.ts`
- **Purpose**: Accept an invite and join the mosque
- **Input**: `token: string`
- **Output**: `ActionResponse`
- **Depends On**: `Invite`, `MosqueMember` models
- **Permissions**: Any authenticated user
- **Logic**: Validates token not expired/used, creates MosqueMember, marks invite used

### `getMembers()` — `member.ts`
- **Purpose**: List all members of the admin's mosque
- **Output**: `MemberData[]` — name, email, phone, role, joinedAt
- **Depends On**: `MosqueMember`, `User` models
- **Permissions**: Admin only

### `removeMember(userId)` — `member.ts`
- **Purpose**: Remove a member from the mosque
- **Input**: `userId: string`
- **Output**: `ActionResponse`
- **Depends On**: `MosqueMember` model
- **Permissions**: Admin only
- **Logic**: Cannot remove self, cannot remove other admins (unless super admin)

### `getInviteHistory()` — `member.ts`
- **Purpose**: Get recent invite history for the mosque
- **Output**: `InviteHistoryItem[]` — last 20 invites with status
- **Depends On**: `Invite`, `User` models
- **Permissions**: Admin only

## Changelog

| Date | Release | Change |
|------|---------|--------|
| 20 Mar 2026 | R8 | Added member.ts — invite link generation, acceptance, member management |
| 20 Mar 2026 | R8 | Updated getContributors, getMonthlyPayments, getPaymentSummary to allow member role |
| 16 Mar 2026 | R4 | Added getUnpaidContributors, getUnpaidCount, cron endpoint, WhatsApp utils |
| 16 Mar 2026 | R3 | Added payment CRUD actions (record, remove, queries, dashboard summary) |
| 16 Mar 2026 | R2 | Added getMosque, getMosqueContributors actions; Contributors hidden from super admin sidebar |
| 16 Mar 2026 | R2 | Added contributor CRUD actions |
| 16 Mar 2026 | R1 | Initial creation — signUp, createMosque, getMosques |
