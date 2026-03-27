# Opencode Hub

Opencode Hub is a SvelteKit app shell that centralizes access to multiple opencode servers. It provides:

- fixed top bar with persistent server list and selection
- server CRUD with URL normalization + duplicate prevention
- periodic health checks with online/offline/degraded states
- direct iframe embedding when allowed
- secure reverse-proxy embedding fallback when framing is blocked
- import/export server lists as JSON

## Stack

- SvelteKit + TypeScript
- Tailwind CSS
- Vite (HMR in local dev)
- Node adapter for production containers

## Quick Start (host)

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Local Dev in Container (with live updates)

```bash
cp .env.example .env
docker compose up --build app-dev
```

Open `http://localhost:5173`.

## Production Container

```bash
cp .env.example .env
docker compose up -d --build app
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - local Vite dev server
- `npm run build` - production build
- `npm run preview` - preview build
- `npm run start` - run built node adapter output
- `npm run lint` - Prettier + ESLint checks
- `npm run format` - Prettier write
- `npm run typecheck` - Svelte + TypeScript checks
- `npm run test` - Vitest
- `npm run test:e2e` - Playwright smoke test

For first-time e2e setup:

```bash
npx playwright install --with-deps chromium
```

## Environment

Copy `.env.example` to `.env`:

```env
OPENCODE_HUB_PROXY_SECRET=replace-with-long-random-secret
ALLOW_PRIVATE_NETWORK_TARGETS=false
PORT=3000
```

- `OPENCODE_HUB_PROXY_SECRET` is required for production to sign target-allowlist cookies.
- `ALLOW_PRIVATE_NETWORK_TARGETS` defaults to `false` to reduce SSRF risk.

## Architecture Notes

See `ARCHITECTURE.md` for embedding, proxying, health checks, persistence, security, and limitations.

## Releases and Branch Rules

- Changelog template: `CHANGELOG.md`
- Repo operations guide (branch protection + release tagging): `docs/REPO_OPERATIONS.md`

## CI/CD (castanova-aligned)

This repo mirrors castanova conventions:

- `.github/workflows/ci.yml` with `runs-on: castanova`, Node 20, lint/typecheck/test/build stages
- `.github/workflows/cd.yml` with docker build+push and SSH deploy flow
- image tags: `sha-<commit>` and `latest`

Intentional differences from castanova:

- no database/bootstrap steps
- app-specific env vars (`OPENCODE_HUB_PROXY_SECRET`, `ALLOW_PRIVATE_NETWORK_TARGETS`)
- tests are Vitest unit tests only

## WebSocket note

When a target is embedded via proxy mode, HTTP traffic is proxied but websocket upgrades are not. For realtime features that depend on websockets, use the "Open in new tab" action.
