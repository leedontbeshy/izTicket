# izTicket

izTicket is an MVP event ticketing application built as a Turborepo workspace.
The product goal is to let customers browse events, reserve tickets, create
orders, complete the SePay payment flow, and view issued e-tickets. Organizers
manage events and ticket types, while admins review submitted events before
they become public .

## Stack

- `apps/api`: NestJS API, TypeScript ESM, Prisma, PostgreSQL target.
- `apps/web`: Vite, React, and TypeScript frontend.
- `packages/`: workspace for future shared packages.
- Tooling: pnpm, Turborepo, Prettier, ESLint, TypeScript.

## Requirements

- Node.js `>=18`
- pnpm `9.0.0`

## Install Dependencies

```sh
pnpm install
```

## Environment

API-local environment variables live in `apps/api/.env`.

```sh
cp apps/api/.env.example apps/api/.env
```

Frontend-local environment variables live in `apps/web/.env` when needed.

```sh
cp apps/web/.env.example apps/web/.env
```

The default frontend API base URL is:

```text
VITE_API_URL=http://localhost:3000/api/v1
```

The root `.env` is reserved for repo-wide tooling only.

## Development

Run frontend and backend together from the repository root:

```sh
pnpm dev
```

Run one app only:

```sh
pnpm dev:web
pnpm dev:api
```

Default local URLs:

- Web: http://localhost:5173
- API: http://localhost:3000
- Planned API prefix: http://localhost:3000/api/v1

## Quality Checks

Run these from the repository root before finishing a milestone:

```sh
pnpm format:check
pnpm lint
pnpm check-types
pnpm build
```

API-specific tests:

```sh
pnpm --filter api test
pnpm --filter api test:e2e
```

Prisma helpers:

```sh
pnpm --dir apps/api exec prisma validate
pnpm --dir apps/api exec prisma format
pnpm --dir apps/api exec prisma generate
```

## Build

```sh
pnpm build
```

Build artifacts are written to each app's `dist` directory.

## Repository Notes

- Use `pnpm`, not npm or yarn.
- Do not commit real `.env` files.
- Keep changes scoped to the current milestone or vertical slice.
- Generated folders such as `dist`, `.turbo`, and `node_modules` stay out of
  git.
