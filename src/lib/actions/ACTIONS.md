# Actions Spec

> Last Updated: 16 March 2026
> Release: R1–R2

## Overview
Server Actions handling business logic for the Masjid Manager application. All actions are marked with `'use server'` and validate inputs via Zod schemas before processing.

## Files

| File | Purpose | Created In |
|------|---------|------------|
| `auth.ts` | User registration | R1 |
| `mosque.ts` | Mosque CRUD + queries | R1 |
| `contributor.ts` | Contributor CRUD | R2 |

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

## Changelog

| Date | Release | Change |
|------|---------|--------|
| 16 Mar 2026 | R2 | Added getMosque, getMosqueContributors actions; Contributors hidden from super admin sidebar |
| 16 Mar 2026 | R2 | Added contributor CRUD actions |
| 16 Mar 2026 | R1 | Initial creation — signUp, createMosque, getMosques |
