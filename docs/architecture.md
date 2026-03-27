# Architecture

## Overview

Opencode Hub is a SvelteKit shell for managing multiple OpenCode Web servers. It keeps the UI shell fixed while the selected server is embedded in the content area.

## Layout

- Fixed top bar: server tabs, CRUD actions, theme editor, import/export.
- Main panel: selected server embed or empty-state onboarding.
- Overlay surfaces: add/edit/delete dialogs and the setup guide drawer.

## Server model

Each server stores:

- `id`
- `name`
- `baseUrl`
- `description` (optional)
- `healthcheckUrl` (optional)
- `createdAt`
- `updatedAt`

## Health checks

- The app polls a small SvelteKit endpoint for each server.
- The endpoint checks status, latency, and framing headers.
- Results are rendered as `online`, `offline`, or `degraded`.

## Embedding and proxying

- Direct iframe embedding is used when framing looks safe.
- Proxy mode is used when target framing is blocked.
- Proxying is intentionally minimal and audited.
- WebSocket upgrades are not proxied; those flows should open in a new tab.

## Persistence

- Server definitions, selection, and theme state are stored server-side.
- State is written to `.opencode-hub/state.json` by default.
- `OPENCODE_HUB_STATE_FILE` can override the file path when needed.

## Setup guide

- The add-server flow includes a reusable OpenCode Web setup drawer.
- The drawer explains launch, service, firewall, and security steps.
- Code blocks include copy buttons for quick onboarding.
