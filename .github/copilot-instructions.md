# Masjid Manager — Project Guidelines

## Golden Rule
**Every line of code MUST follow the plan in `RELEASES.md`.** Before writing any file, check RELEASES.md for:
- Which release the file belongs to
- The exact task number and description
- The acceptance criteria it must satisfy
- The spec file that must be updated alongside it

## Architecture
- **Framework**: Next.js 14 (App Router) — NO separate Node.js/Express backend
- **Database**: MongoDB Atlas (free tier) with Mongoose ODM
- **Auth**: NextAuth.js v5 with Credentials provider + JWT
- **UI**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod schemas on all forms (client + server)
- **Multi-tenancy**: Every document scoped by `mosqueId` — never query without it (except super admin)

## Coding Conventions
- TypeScript strict mode — no `any` types
- Server Actions in `src/lib/actions/` — never put business logic in page components
- Mongoose models in `src/lib/models/` — one file per model
- Zod validations in `src/lib/validations/` — mirror model structure
- All forms must validate on both client and server side

## RBAC (Role-Based Access)
Every page and server action MUST check permissions. 5 roles:
1. Super Admin — global access
2. Mosque Admin — full access within their mosque
3. Treasurer — finances only
4. Imam — own salary only
5. Member — read-only

## Spec File Requirement
When creating or modifying any file in `src/lib/models/`, `src/lib/actions/`, `src/lib/validations/`, or `src/lib/reports/`:
- **MUST** update the corresponding spec file (`MODELS.md`, `ACTIONS.md`, `VALIDATIONS.md`, or `REPORTS.md`)
- Spec files document contracts (inputs, outputs, permissions, dependencies) — not implementation details
- See `RELEASES.md > Module Spec Documentation Convention` for the template

## Release Plan Reference
- Full plan with all 12 releases, tasks, and acceptance criteria: see `RELEASES.md`
- Current release dependency chain: R1 → R2 → R3 → R4, with R5/R6/R8/R9 parallelizable after R1
- Never implement features from a future release unless all dependencies are complete

## File Structure
- Pages: `src/app/(auth)/` and `src/app/(dashboard)/`
- Server Actions: `src/lib/actions/`
- Models: `src/lib/models/`
- Validations: `src/lib/validations/`
- Shared Components: `src/components/shared/`
- Dashboard Components: `src/components/dashboard/`
- UI Components: `src/components/ui/` (shadcn/ui — do not manually edit)

## Security
- Hash passwords with bcryptjs (10 rounds)
- JWT sessions — never expose sensitive data in client-side session
- Always validate `mosqueId` ownership before any data mutation
- Rate limit auth endpoints
- Sanitize all user inputs via Zod
