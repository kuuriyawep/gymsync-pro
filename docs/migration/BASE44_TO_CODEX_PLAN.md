# Base44 → Codex: Safe Migration Plan

## Phase 0 — Protect and inventory
- Confirm repo visibility and branch protection; review GitHub history for accidentally committed secrets. If secrets were exposed, rotate them rather than merely deleting a line.
- Verify Base44's repository connection and which branch it watches.
- Capture Supabase schema, deployed migrations, RLS policies, triggers, RPCs, Edge Functions, Auth settings and storage buckets. Store no secrets in Git.
- Establish non-production test project/environment.
- Record baseline workflows and current known bugs.

## Phase 1 — Prepare Codex workspace
- Connect intended GitHub repository to Codex.
- Read AGENTS.md and all docs under docs/architecture and docs/migration.
- Install a small curated set of trusted skills (React/UI, Supabase/Postgres, testing/security/review). Review skill source before use.
- Create project-specific skills for product rules, tenant security, safe UI edits, migration, testing and release.
- Confirm Codex runs only on feature branches and requests approval for high-impact actions.

## Phase 2 — Baseline the application
- Inspect all route definitions, page components, data stores, API calls, environment variables, and package scripts.
- Run install, lint, tests and production build; record actual results and failures.
- Create endpoint/function inventory with callers, auth model, request/response contracts, data tables and secrets used.
- Add integration and tenant-isolation tests before migrating privileged operations.

## Phase 3 — Remove Base44 runtime dependency incrementally
For each Base44 function:
1. Identify callers and deployed implementation.
2. Document request/response contract, authorization rules, validation, rate limits and audit behavior.
3. Implement a Supabase Edge Function or suitable server endpoint.
4. Test against staging with realistic but non-production data.
5. Update frontend caller behind a small, reversible change.
6. Verify Owner, Staff and Member flows, cross-gym isolation and failure modes.
7. Monitor errors and reconcile records before moving to the next function.
8. Keep old path until parity is proven.

Priority order (reconfirm after full inventory):
- Authentication/session and authorization contract.
- Gym/member access and member linking.
- Member CRUD and membership state.
- Payments, renewal and idempotency.
- Staff/trainer management.
- Reports and analytics.
- Feedback/requests and notifications.
- Settings and remaining functions.

## Phase 4 — Automation
- GitHub Actions: install, lint, tests, build, dependency audit and secret scanning on pull requests.
- Block merge when required checks fail.
- Preview deployment per pull request if host supports it.
- Supabase scheduled jobs: membership reminder windows, expired membership status, digest/report delivery and retry queue.
- Every scheduled operation needs idempotency or uniqueness constraints, retry policy, audit log and monitoring.
- Avoid sending sensitive member details through external automation tools.

## Phase 5 — Hosting and cutover
- Select host only after confirming environment variables, routing/SPA fallback, build settings, HTTPS, custom domain, logs and rollback.
- Deploy to preview/staging URL; test on iPhone and laptop.
- Verify login/OTP/OAuth, deep links, member join, Owner/Staff access, payments/renewals, reports and scheduled jobs.
- Reconcile record counts and key totals against Supabase.
- Explicitly approve production cutover. Keep Base44 as rollback option until stability is demonstrated.
- Remove Base44 packages, SDK, environment configuration and function references only after no active code path depends on them.
- Do not delete Base44 app or old repo as part of migration by default.
