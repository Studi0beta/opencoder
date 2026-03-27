# Development

## Local setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Scripts

- `npm run dev` - Vite dev server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - Prettier + ESLint
- `npm run format` - Prettier write
- `npm run typecheck` - SvelteKit + TypeScript checks
- `npm run test` - Vitest
- `npm run test:e2e` - Playwright smoke tests

## Container dev

```bash
docker compose up --build app-dev
```

## Structure

- `src/routes` - page shell, API endpoints, and route layout
- `src/lib/components` - reusable UI
- `src/lib/server` - server-side policy, proxy helpers, and persisted app state
- `src/lib/client` - browser-facing registry/theme sync and UI state logic
- `docs` - architecture, setup, security, roadmap, and decisions

## Workflow notes

- Keep docs in sync with UI and security changes.
- Prefer reusable components over inlined help blobs.
- Record major technical decisions in `docs/decisions.md`.
