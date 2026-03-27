# Repository Operations

## Branch protection (Codeberg)

Configure these rules in repository settings for `main`:

1. Require pull requests before merge.
2. Require up-to-date branch before merge.
3. Require passing checks:
   - `CI / validate`
4. Restrict direct pushes to admins/maintainers.

## Release flow

1. Merge completed work into `main`.
2. Update `CHANGELOG.md` from `Unreleased` into a new version section.
3. Create and push an annotated tag:

```bash
git tag -a v0.1.0 -m "release: v0.1.0"
git push origin v0.1.0
```

4. CD workflow builds and publishes the container image for `main`.

## Changelog template reminder

For each version, keep headings:

- `Added`
- `Changed`
- `Fixed`

Keep entries short and user-facing.
