# Roadmap

## Milestones

### 1. App shell and layout

- [x] Fixed top navigation shell
- [x] Themeable surface system
- [x] Responsive layout for main content
- [x] Validate shell on desktop and mobile

### 2. Server management flow

- [x] Add/edit/delete servers
- [x] Local persistence with duplicate protection
- [x] Selection state and fast switching
- [x] Validate CRUD interactions

### 3. OpenCode Web setup guide

- [x] Reusable onboarding drawer component
- [x] Copy buttons for code blocks
- [x] Service, firewall, and security instructions
- [x] Add Server integration and non-local warning
- [x] Validate accessibility and keyboard interactions

### 4. Health/status system

- [x] Server polling endpoint
- [x] Status indicators and last-checked time
- [x] Graceful error handling
- [x] Validate network failure states

### 5. Embedding/proxy architecture

- [x] Direct iframe mode when allowed
- [x] Secure proxy fallback when framed content is blocked
- [x] Document limitations and known gaps
- [x] Validate redirect and SSRF guardrails

### 6. Local persistence

- [x] Browser storage repository
- [x] Registry sync layer
- [x] Theme state persistence
- [x] Validate load/save behavior

### 7. Containerisation

- [x] Production Dockerfile
- [x] Dev Dockerfile and compose support
- [x] `.dockerignore`
- [x] Validate build in container

### 8. CI/CD

- [x] GitHub Actions CI
- [x] GitHub Actions CD with GHCR image publish
- [x] Optional deploy job
- [x] Validate workflow syntax and image publish path

### 9. Documentation and polish

- [x] Update README and docs after setup-guide work
- [x] Add decision log entries for new onboarding UI
- [x] Keep roadmap status current
- [x] Review visual polish after guide integration
