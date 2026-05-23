# NestJS React Turborepo Template

Starter monorepo with:

- `apps/api`: NestJS backend with Prisma and PostgreSQL
- `apps/web`: Vite + React frontend
- `packages/`: place for shared packages

## Requirements

- Node.js `>=18`
- pnpm `9.0.0`

## Install

```sh
pnpm install
```

## Environment

API environment variables live in `apps/api/.env`.

```sh
cp apps/api/.env.example apps/api/.env
```

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

## Build

```sh
pnpm build
```

Build artifacts are written to each app's `dist` directory.

## Template Notes

- Do not commit real `.env` files.
- Replace placeholder names, schema models, and README text before shipping a real app.
- Generated folders such as `dist`, `.turbo`, `node_modules`, and Prisma client output should stay out of git.
