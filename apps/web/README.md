# Web

Vite + React frontend application for izTicket.

## Environment

Copy the frontend env example when the app needs to call the API:

```sh
cp .env.example .env
```

When running from the repository root, use:

```sh
cp apps/web/.env.example apps/web/.env
```

Default API base URL:

```text
VITE_API_URL=http://localhost:3000/api/v1
```

## Development

From the repository root:

```sh
pnpm dev:web
```

Or from this directory:

```sh
pnpm dev
```

Default URL: http://localhost:5173

## Checks

```sh
pnpm check-types
pnpm lint
pnpm build
```
