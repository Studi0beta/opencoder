# Opencoder

<p align="center">
  <img src="static/logo.svg" alt="Opencoder logo" width="160" />
</p>

Opencoder is a SvelteKit OpenCode Web server aggregator: a central place to register, monitor, and open multiple OpenCode Web instances. It provides:

- fixed top bar with persistent server list and selection
- server CRUD with URL normalization + duplicate prevention
- periodic health checks with online/offline/degraded states
- direct iframe embedding when allowed
- secure reverse-proxy embedding fallback when framing is blocked
- import/export server lists as JSON

Opencoder is best used as a local-first frontend for OpenCode Web servers. For remote access, use WireGuard or Tailscale rather than exposing the app directly.

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

See `docs/architecture.md` for embedding, proxying, health checks, persistence, security, and limitations.

## OpenCode Web Setup

See `docs/setup-guide.md` for the setup instructions shown in the Add Server flow.

## Releases and Branch Rules

- Changelog template: `CHANGELOG.md`
- Repo operations guide (branch protection + release tagging): `docs/REPO_OPERATIONS.md`
- Roadmap and milestone tracker: `docs/roadmap.md`
- Decision log: `docs/decisions.md`

## CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` runs lint, typecheck, test, and build on pull requests and pushes to `main`.
- `.github/workflows/cd.yml` builds and pushes Docker images on `main` and supports optional SSH deploy.
- Image tags: `sha-<commit-sha>` and `latest`.

### CD secrets

Set these in `Settings -> Secrets and variables -> Actions`:

- Optional registry override:
  - `REGISTRY_HOST` (defaults to `ghcr.io`)
  - `REGISTRY_IMAGE` (defaults to `<owner>/<repo>`)
- Required only for non-GHCR registries or remote deploy login:
  - `REGISTRY_USERNAME`
  - `REGISTRY_PASSWORD`
- Required for deploy job:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_SSH_KEY`
  - `DEPLOY_PATH`

If deploy secrets are not set, image publish still runs and deploy is skipped.

## WebSocket note

When a target is embedded via proxy mode, HTTP traffic is proxied but websocket upgrades are not. For realtime features that depend on websockets, use the "Open in new tab" action.

## Acknowledgements

Built to support the OpenCode ecosystem. Thanks to the OpenCode project for the underlying web experience this app helps aggregate and access.
