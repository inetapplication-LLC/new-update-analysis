# CLAUDE.md

## Project

- **Repo**: inetapplication-LLC/new-update-analysis
- **Current Version**: v1.1

## Versioning

- Follow semantic versioning: v1.0, v1.1, v1.2, etc.
- Each new version increment is a minor release (v1.x) unless a major rewrite occurs.
- When a version is ready to release: tag it (e.g., `git tag -a v1.1 -m "v1.1"`) and push the tag.
- Create a GitHub release for each version with a summary of changes.

### Version History

| Version | Description |
|---------|-------------|
| v1.0 | Initial release — PVT-branded Update Command Center dashboard with 7-day bar chart, KPI cards, updates detail page with sidebar, category tables, and Supabase integration |
| v1.1 | Multi-client support — configurable client name via `NEXT_PUBLIC_CLIENT_NAME` env var, enabling same codebase to serve multiple client deployments (defaults to "Demo Company") |
| v1.2 | Supabase Auth — email + password login (invite-only), cookie-based sessions via `@supabase/ssr`, route protection with middleware, split-screen login page |
| v1.3 | Mobile & Desktop App — PWA with push notifications (Phase 1), Capacitor native shell (Phase 2), React Native full-native app (Phase 3) |

## Git Workflow

- Default branch: `main`
- Push all changes to `origin main`.
- Tag releases on `main` before creating GitHub releases.
- **Release rule**: After a feature is fully implemented and tested, commit and push it as the next version (v1.next). Do not version-bump until testing confirms the feature works.

## Browser Automation

- Always use agent browser skills (mcp__claude-in-chrome__*) for browser interactions and web automation tasks.

## Frontend Design

- Always use frontend design plugin skills when working on UI/UX and frontend design tasks.
