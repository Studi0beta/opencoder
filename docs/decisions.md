# Decisions

## 2026-03-27 - SvelteKit shell with Node adapter

- Decision: Use SvelteKit + TypeScript + Tailwind with a Node adapter.
- Why: simple deployment, fast dev loop, and container-friendly output.
- Alternatives: SPA shell, Next.js, custom Express frontend.
- Tradeoffs: server-side routes add a small amount of complexity, but keep the architecture flexible.

## 2026-03-27 - Local storage for server registry

- Decision: Store server data and selection in browser localStorage for now.
- Why: fastest path to a durable single-user workflow.
- Alternatives: backend database, indexedDB, remote settings API.
- Tradeoffs: not shared across devices; future migration will need a repository swap.

## 2026-03-27 - Secure proxy fallback instead of embedding hacks

- Decision: Use a minimal, scoped proxy fallback when direct iframe embedding is blocked.
- Why: respects browser security and keeps the app usable when framing rules prevent direct embed.
- Alternatives: unsafe frame-busting workarounds or brittle client-side DOM hacks.
- Tradeoffs: not all upstream behaviors can be proxied perfectly, especially websockets and complex SPA routing.

## 2026-03-27 - Reusable OpenCode Web setup drawer

- Decision: Add onboarding as a reusable help drawer with copyable code blocks.
- Why: keeps the add-server flow clean while giving users a focused setup path.
- Alternatives: inline docs blob, separate static docs only, or hard-coded alert panel.
- Tradeoffs: slightly more UI code, but much better onboarding and reuse potential.

## 2026-03-27 - README framing for project purpose

- Decision: Describe the app as an OpenCode Web server aggregator and add a short acknowledgement.
- Why: the product is mainly a hub for registering, monitoring, and opening multiple OpenCode Web instances, so that framing is clearer for new readers.
- Alternatives: keep the original neutral hub wording or bury the purpose in architecture docs.
- Tradeoffs: a more opinionated README, but much faster onboarding and clearer project identity.
