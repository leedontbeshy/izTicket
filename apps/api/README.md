# API

NestJS backend application for izTicket.

## Environment

Copy the API env example before running Prisma or the API:

```sh
cp .env.example .env
```

When running from the repository root, use:

```sh
cp apps/api/.env.example apps/api/.env
```

## Development

From the repository root:

```sh
pnpm dev:api
```

Or from this directory:

```sh
pnpm dev
```

Default URL: http://localhost:3000

Health endpoints:

- http://localhost:3000/health/live
- http://localhost:3000/health/ready

## Checks

```sh
pnpm check-types
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```
