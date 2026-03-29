---
name: codebase-fit-skills
description: Maps the repo using docs/ADVANCED_BUSINESS.md and docs/ADVANCED_TECHNICAL.md first, then code, to propose and author project-scoped skills under .cursor/skills/. Use when bootstrapping skills, refreshing after refactors, or aligning agents with Nabra documentation.
---

# Codebase-fit project skills (Nabra)

## Goal

Turn what is **documented and true in the repo** into **small, discoverable skills** under `.cursor/skills/<name>/SKILL.md` so agents default to **Nabra’s** conventions (credits, locales, tRPC context, notifications) instead of generic patterns.

**Canonical narrative:** `docs/ADVANCED_BUSINESS.md` (what the product is) → `docs/ADVANCED_TECHNICAL.md` (how it is built) → implementation detail for toasts/notifications in **`src/lib/error-handler.ts`**, **`src/lib/notifications/`**, **`messages/*.json`**. **`.cursor/rules/*.mdc`** are editor-side distillations; skills may go deeper and must **link** the ADVANCED docs and real paths.

## When to use

- User asks to study the codebase and create or refresh **project skills**.
- Onboarding or a large refactor changed `src/app/`, `src/server/`, or `prisma/`.
- A workflow (i18n, tRPC, Prisma, notifications) keeps diverging from **`docs/*.md`**.

## Storage rule

- **Project skills**: `.cursor/skills/<skill-name>/SKILL.md` (committed).
- Do **not** put project-specific skills in `~/.cursor/skills-cursor/`.

## Phase 1 — Map the codebase (read-only)

**Order matters:**

1. **`docs/ADVANCED_BUSINESS.md`** — roles, commercial model, request lifecycle vocabulary.
2. **`docs/ADVANCED_TECHNICAL.md`** — stack table, directory map, tRPC flow, i18n, cron, env checklist.
3. **`src/lib/error-handler.ts`**, **`src/lib/notifications/`**, **`messages/`** — when the task touches UX or outbound messages.
4. **Code & config**: `package.json`, `tsconfig`, `next.config.*`, `prisma/schema.prisma`, `src/server/**`, `src/app/api/**`, `src/app/[locale]/**`, `messages/`, `src/lib/**`, tests (`jest`, `playwright`).
5. **Agent config**: `.cursor/rules/**` for what is already distilled.

Capture **paths and names**; note one **golden example** file per area (e.g. one router, one localized page, one test).

## Phase 2 — Choose skill candidates

Prefer **one skill per recurring, fragile workflow** (narrow beats mega-skill).

Good candidates:

- Flows that **`docs/ADVANCED_TECHNICAL.md`** names explicitly (tRPC context, middleware/proxy behavior).
- Toasts / notifications / `errors.*` keys — skill body = steps + link to **`src/lib/**` files and ADVANCED docs, not removed standalone doc paths.
- Domain rules from **`docs/ADVANCED_BUSINESS.md`** that code must enforce (credits, statuses, payment proof).

Skip:

- Duplicating ESLint/Prettier unless the project adds rules **not** in config.
- Mega-skills that repeat the two ADVANCED docs verbatim — **link** instead.

## Phase 3 — Author skills

For each candidate:

1. **Name**: lowercase, hyphens, max 64 chars (e.g. `nabra-notification-locale`, not `backend-helper`).
2. **Description** (YAML): third person, **WHAT** + **WHEN**, include trigger terms.
3. **Body**: Prerequisites, steps, checklists, **`docs/...` links** and example file paths. Keep **SKILL.md** under ~500 lines; add `reference.md` in the same folder if needed.
4. **Progressive disclosure**: at most one level of `reference.md` / `examples.md`.

## Phase 4 — Verify

- [ ] Each skill’s `description` has clear triggers.
- [ ] Instructions cite **real paths** and **correct doc filenames**.
- [ ] No duplicate skills; cross-link if related.
- [ ] Optional: `npm run lint` / `npm run type-check` after code changes.

## Output when the user only asked for analysis

1. Short **inventory** (stack + main dirs), grounded in **ADVANCED\_\*** docs where possible.
2. **Proposed skill list** (name + one line each).
3. **Suggested first skill file** (highest leverage).

Implement `.cursor/skills/**/SKILL.md` only when the user confirms or asks to create files.
