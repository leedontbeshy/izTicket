# AGENTS.md

## Scope

This file applies to the whole repository. If a nested `AGENTS.md` or
`AGENTS.override.md` is added later, follow the more specific file for that
subtree.

## Project Context

This repository is a Turborepo + pnpm template for a NestJS API and a React
frontend. Treat it as a starting point, not a finished product. Replace
placeholder names, schema models, UI text, and docs when creating a real app.

## Repo Layout

- `apps/api`: NestJS API, TypeScript ESM, Prisma, PostgreSQL target.
- `apps/web`: Vite + React + TypeScript frontend.
- `apps/api/prisma`: Prisma schema and future migrations.
- `packages/`: place for shared packages.

## Commands

- Install: `pnpm install`.
- Run all apps: `pnpm dev`.
- Run one app: `pnpm dev:api` or `pnpm dev:web`.
- Quality checks: `pnpm format:check`, `pnpm lint`, `pnpm check-types`,
  `pnpm build`.
- API tests when relevant: `pnpm --filter api test` and
  `pnpm --filter api test:e2e`.
- Prisma helpers: `pnpm --dir apps/api exec prisma validate`,
  `pnpm --dir apps/api exec prisma format`,
  `pnpm --dir apps/api exec prisma generate`, and
  `pnpm --dir apps/api exec prisma migrate dev`.

## Environment

API-local environment variables live in `apps/api/.env`; copy from
`apps/api/.env.example`. The root `.env` is reserved for repo-wide tooling.
Never commit secrets.

## Implementation Rules

- Keep changes scoped and prefer existing repo patterns.
- Use pnpm, not npm or yarn.
- Ask before adding production dependencies.
- Keep TypeScript strict and avoid unrelated refactors.
- Prettier config is root-owned: 4-space tabs, single quotes, trailing commas.

## Testing And Done

- Add focused tests for new business rules, guards, validators, and helpers.
- Add API e2e tests for new endpoints when behavior crosses module boundaries.
- Before finishing, run the relevant checks you can. If a check cannot run,
  say why.
