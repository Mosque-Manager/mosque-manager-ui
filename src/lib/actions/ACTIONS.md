# Actions Spec

> Last Updated: 16 March 2026
> Release: R1

## Overview
Server Actions handling business logic for the Masjid Manager application. All actions are marked with `'use server'` and validate inputs via Zod schemas before processing.

## Files

| File | Purpose | Created In |
|------|---------|------------|
| `auth.ts` | User registration | R1 |
| `mosque.ts` | Mosque CRUD (super admin) | R1 |

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
- **Permissions**: Super Admin only (`requireSuperAdmin()`)
- **Logic**:
  1. Verify super admin via `requireSuperAdmin()`
  2. Validate input with Zod
  3. Create mosque document
  4. Create MosqueMember with role `admin` for the creator
- **Error Cases**:
  - Not super admin → redirect to `/`
  - Validation fails → returns field errors
- **Called By**: `(dashboard)/mosques/new/page.tsx`

### `getMosques()` — `mosque.ts`
- **Purpose**: List all active mosques
- **Input**: None
- **Output**: `MosqueData[]`
- **Depends On**: `Mosque` model
- **Permissions**: Super Admin only (`requireSuperAdmin()`)
- **Logic**: Query all mosques where `isActive: true`, sorted by `createdAt` desc
- **Called By**: `(dashboard)/mosques/page.tsx`

## Changelog

| Date | Release | Change |
|------|---------|--------|
| 16 Mar 2026 | R1 | Initial creation — signUp, createMosque, getMosques |
