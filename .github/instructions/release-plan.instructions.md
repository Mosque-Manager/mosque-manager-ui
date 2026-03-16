---
description: "ALWAYS follow the release plan when writing any source code. Use when creating, editing, or reviewing any TypeScript, TSX, or configuration file in this project. Enforces strict adherence to RELEASES.md tasks, acceptance criteria, and spec file maintenance."
applyTo: "src/**"
---

# Release Plan Enforcement

## Before Writing Any Code
1. **Identify which Release** this file belongs to (R1-R12) from `RELEASES.md`
2. **Find the exact task number** (e.g., 1.5, 2.3) that covers this file
3. **Read the acceptance criteria** for that release — your code must satisfy ALL of them
4. **Check the "Files Created/Modified" table** — only create/modify files listed there for the current release

## While Writing Code
- Follow the data models EXACTLY as defined in `RELEASES.md > Data Models` section
- Use the field names, types, indexes, and constraints specified — do not add extra fields unless explicitly required
- Server actions must check RBAC permissions as specified per release
- Every query on tenant data must include `mosqueId` in the filter

## After Writing Code
- If you created/modified a file in `src/lib/models/` → update `MODELS.md`
- If you created/modified a file in `src/lib/actions/` → update `ACTIONS.md`
- If you created/modified a file in `src/lib/validations/` → update `VALIDATIONS.md`
- If you created/modified a file in `src/lib/reports/` → update `REPORTS.md`
- Verify against acceptance criteria before marking task complete
