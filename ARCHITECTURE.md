# Opencode Hub Architecture

## Embedding approach

1. The app health-checks each server via `/api/health/[id]`.
2. Health checks inspect `X-Frame-Options` and `Content-Security-Policy` `frame-ancestors` headers.
3. If direct framing appears allowed, the main iframe loads the remote `baseUrl` directly.
4. If direct framing is blocked or uncertain, the iframe switches to proxy mode (`/api/proxy/[id]/...`).

## Reverse proxy strategy

- Proxy routes are scoped by server `id` and only work for signed, synced targets from `/api/targets/sync`.
- Client cannot proxy arbitrary URLs directly.
- Proxy forwards a small allowlist of request headers.
- Proxy strips frame-blocking response headers for proxied content and rewrites HTML base/asset paths.
- Redirects are only rewritten when they stay on the same upstream origin.
- Upstream cookies are path-scoped to `/api/proxy/[id]/` before returning to browser.
- WebSocket upgrades are explicitly rejected on the HTTP proxy route with a clear `426` response.

## Health check strategy

- Browser polls on an interval and on important events (add/edit/delete/manual refresh).
- Polling goes through SvelteKit endpoint to avoid CORS limitations and centralize framing policy detection.
- Responses include status (`online`, `offline`, `degraded`), mode recommendation, and last-checked timestamp.

## Persistence strategy

- Server list + selected server are stored in browser localStorage.
- Persistence is behind `LocalStorageServerRepository` so backend/db persistence can replace it later.
- Every registry change triggers target sync to server endpoint for signed allowlist cookies.

## Security decisions

- URL normalization + validation for all user-entered server URLs.
- Only `http`/`https`; embedded credentials rejected.
- SSRF guardrails:
  - private/loopback ranges blocked by default
  - DNS resolution checked server-side
  - optional override with `ALLOW_PRIVATE_NETWORK_TARGETS=true`
- Proxy scope limited to synced user targets stored in signed httpOnly cookies.
- Global secure headers set in `hooks.server.ts` (`nosniff`, `SAMEORIGIN`, strict permissions policy).
- Proxy body size limit and request timeout reduce abuse impact.

## Known limitations

- Full upstream app compatibility cannot be guaranteed for every third-party UI (complex CSP/cookie/app-router behavior may still break).
- Realtime websocket-dependent features may need direct open-in-new-tab mode.
- HTML rewriting is intentionally minimal and auditable; edge cases may require upstream app adjustments.
- No multi-user auth layer yet; this is currently local-user oriented.
