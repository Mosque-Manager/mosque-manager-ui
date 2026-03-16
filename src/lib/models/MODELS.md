# Models Spec

> Last Updated: 16 March 2026
> Release: R1

## Overview
Mongoose models defining the MongoDB schema for the Masjid Manager application. All models use timestamps and enforce data integrity via indexes and validation.

## Files

| File | Purpose | Created In |
|------|---------|------------|
| `User.ts` | User authentication and profile | R1 |
| `Mosque.ts` | Mosque (tenant) entity | R1 |
| `MosqueMember.ts` | User-Mosque relationship with role | R1 |

## Contracts

### User (`User.ts`)
- **Collection**: `users`
- **Fields**:
  - `name` — String, required, trimmed
  - `email` — String, required, unique, lowercase, trimmed
  - `phone` — String, optional, trimmed
  - `passwordHash` — String, required (bcrypt, 10 rounds)
  - `isSuperAdmin` — Boolean, default: false
  - `lang` — String, enum: `en` | `hi` | `ur`, default: `en`
  - `createdAt` / `updatedAt` — Date, auto (timestamps: true)
- **Indexes**: `{ email: 1 }` (unique)
- **Interface**: `IUser`
- **Used By**: `auth.ts` (login), `actions/auth.ts` (signUp)

### Mosque (`Mosque.ts`)
- **Collection**: `mosques`
- **Fields**:
  - `name` — String, required, trimmed
  - `address` — String, optional, trimmed
  - `city` — String, optional, trimmed
  - `phone` — String, optional, trimmed
  - `createdBy` — ObjectId (ref: User), required
  - `isActive` — Boolean, default: true
  - `createdAt` / `updatedAt` — Date, auto
- **Indexes**: `{ createdBy: 1 }`
- **Interface**: `IMosque`
- **Used By**: `actions/mosque.ts` (createMosque, getMosques)

### MosqueMember (`MosqueMember.ts`)
- **Collection**: `mosquemembers`
- **Fields**:
  - `mosqueId` — ObjectId (ref: Mosque), required
  - `userId` — ObjectId (ref: User), required
  - `role` — String, enum: `admin` | `member`, required
  - `joinedAt` — Date, default: now
- **Indexes**: `{ mosqueId: 1, userId: 1 }` (unique compound), `{ userId: 1 }`
- **Type Export**: `MemberRole`
- **Interface**: `IMosqueMember`
- **Used By**: `auth.ts` (JWT callback — loads default mosque/role), `actions/mosque.ts` (auto-assign admin)

## Relationships
```
User (1) ──── (*) MosqueMember (*) ──── (1) Mosque
```
- A User can belong to multiple Mosques (via MosqueMember)
- A Mosque can have multiple Users (via MosqueMember)
- MosqueMember is the join table carrying the `role`

## 4. Contributor (`src/lib/models/Contributor.ts`)

### Fields
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `mosqueId` | ObjectId (ref: Mosque) | Yes | — | Scoped to mosque |
| `name` | String | Yes | — | Trimmed |
| `phone` | String | Yes | — | For WhatsApp reminders |
| `fixedMonthlyAmount` | Number | Yes | — | Min: 0 |
| `address` | String | No | — | Trimmed |
| `isActive` | Boolean | No | true | Soft delete flag |
| `createdAt` | Date | Auto | — | |
| `updatedAt` | Date | Auto | — | |

### Indexes
- `{ mosqueId: 1, isActive: 1 }` — list queries by mosque + status
- `{ mosqueId: 1, phone: 1 }` — duplicate phone check

### Relationships
- Belongs to one Mosque
- Referenced by Payments (R3)

---

## Changelog

| Date | Release | Change |
|------|---------|--------|
| 16 Mar 2026 | R2 | Added Contributor model |
| 16 Mar 2026 | R1 | Initial creation — User, Mosque, MosqueMember models |
