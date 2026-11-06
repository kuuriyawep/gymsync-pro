# GymSync Pro — Target Architecture

## Target outcome
A standalone, maintainable application developed with Codex, stored in GitHub, using Supabase for identity and data, with independent hosting and automated quality gates. Base44 should no longer be a runtime dependency after successful migration, but must remain available during transition.

## Proposed layers
1. Web client — React + Vite; responsive Owner, Staff and Member experiences.
2. Identity — Supabase Auth. The UI may hide unavailable actions, but server-side authorization remains authoritative.
3. Data layer — Supabase Postgres with tenant-scoped RLS. Migrations are version-controlled and applied deliberately.
4. Privileged operations — Supabase Edge Functions for sensitive workflows (onboarding, join/link membership, payment mutations, owner/staff administration, scheduled notifications and other privileged operations). Use service-role only inside trusted server functions and only after explicit authorization.
5. Scheduled work — Supabase Cron/pg_cron or a supported scheduler invoking secure Edge Functions. Every job should be idempotent, observable and retry-safe.
6. Hosting — choose a static/Vite-capable host after comparing build, environment variables, preview deploys, rollback and pricing. Keep host independent of database.
7. CI/CD — GitHub Actions for install, lint, type-check if configured, tests, production build, dependency/security checks and preview verification.
8. Monitoring — structured error reporting and health checks without leaking PII or tokens.
9. AI development — Codex works on branches and pull requests under repository rules in AGENTS.md; ChatGPT maintains project decisions and acceptance criteria.

## Migration principles
- Preserve database and auth identity; avoid data copy unless a verified need exists.
- Migrate one backend capability at a time with contract tests and parity checks.
- Do not add a new vendor merely for convenience if existing Supabase capabilities suffice.
- Separate dev/staging/prod; never test destructive changes on production.
- No deployment or merge without explicit approval.
