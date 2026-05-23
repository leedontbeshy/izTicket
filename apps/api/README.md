# API

NestJS backend application for the template.

## Environment

Copy the API env template before running Prisma or the API:

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

## Checks

```sh
pnpm check-types
pnpm lint
pnpm test
pnpm build
```
