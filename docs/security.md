# Security

## Defaults

- Only `http` and `https` URLs are accepted for servers.
- Embedded credentials are rejected.
- Private and loopback targets are blocked by default in proxy-related allowlisting.

## Password guidance

- `OPENCODE_SERVER_PASSWORD` is configured on the remote machine running OpenCode Web, not in this app.
- When adding a non-local server, ensure password protection is enabled.
- Prefer trusted-IP restrictions where possible.
- Prefer HTTPS or a reverse proxy for wider exposure.

## Proxy safety

- Proxying is limited to user-configured targets.
- Redirects are only preserved when they remain on the same origin.
- Proxy request bodies are size-limited.
- Proxy requests have a timeout.
- WebSocket upgrades are not proxied.

## Background checks

- Health checks are server-side to avoid cross-origin limitations.
- Framing headers are observed so the app can prefer direct embed or proxy mode safely.

## Important note

- `robots.txt` is not a security control.
