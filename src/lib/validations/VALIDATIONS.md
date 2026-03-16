# Validations Spec

> Last Updated: 16 March 2026
> Release: R1

## Overview
Zod schemas for validating user input on both client and server side. Each schema mirrors the corresponding Mongoose model fields and is used by Server Actions.

## Files

| File | Purpose | Created In |
|------|---------|------------|
| `auth.ts` | Signup and login form validation | R1 |
| `mosque.ts` | Mosque creation form validation | R1 |

## Contracts

### `signUpSchema` — `auth.ts`
- **Fields**:
  - `name` — string, min 2 chars, max 100
  - `email` — string, valid email format
  - `phone` — string, regex `^\d{10,15}$`, optional (or empty string)
  - `password` — string, min 6 chars, max 100
- **Type Export**: `SignUpInput`
- **Used By**: `actions/auth.ts` → `signUp()`

### `loginSchema` — `auth.ts`
- **Fields**:
  - `email` — string, valid email format
  - `password` — string, min 1 char
- **Type Export**: `LoginInput`
- **Used By**: Client-side validation on login page (auth handled by NextAuth directly)

### `createMosqueSchema` — `mosque.ts`
- **Fields**:
  - `name` — string, min 2 chars, max 200
  - `address` — string, max 500, optional (or empty string)
  - `city` — string, max 100, optional (or empty string)
  - `phone` — string, regex `^\d{10,15}$`, optional (or empty string)
- **Type Export**: `CreateMosqueInput`
- **Used By**: `actions/mosque.ts` → `createMosque()`

---

## File: `validations/contributor.ts`

### `contributorSchema`
- **Fields**:
  - `name` — string, min 2, max 100
  - `phone` — string, min 10, max 15, digits only regex
  - `fixedMonthlyAmount` — number, must be positive
  - `address` — string, max 500, optional (or empty string)
- **Type Export**: `ContributorFormData`
- **Used By**: `actions/contributor.ts`, `ContributorForm.tsx` (client-side)

## Changelog

| Date | Release | Change |
|------|---------|--------|
| 16 Mar 2026 | R2 | Added contributorSchema |
| 16 Mar 2026 | R1 | Initial creation — signUpSchema, loginSchema, createMosqueSchema |
