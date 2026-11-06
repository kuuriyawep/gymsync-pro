# GymSync Pro — Automation Roadmap

## Developer workflow
- PR checks: dependency install, lint, unit/integration tests, production build, secret scan and dependency audit.
- Require successful checks before merge.
- PR template: purpose, changed areas, screenshots where relevant, tests run, security/tenant impact, migration impact, rollback plan.
- Release notes generated from merged PRs; deployment approval stays explicit during migration.
- Scheduled dependency update PRs only after CI is reliable.

## Gym business workflows
1. Membership reminders at 5 days before expiry, 1 day before expiry and after expiry.
2. Daily owner summary: new members, payments collected, overdue memberships and failed workflows.
3. Renewal workflow: record payment and extend membership atomically; protect against duplicate submission.
4. Feedback/request workflow: member submits, owner/staff triage, status changes, response notification.
5. Background reconciliation: detect inconsistent payment/membership state and report; do not silently rewrite historical records.
6. Failure queue: retries with backoff, idempotency, alert after repeated failure, audit trace.
7. Scheduled reports with tenant-scoped queries and delivery preferences.

## Implementation constraints
- Inventory existing tables, notifications and deployed functions before creating new schema.
- Prefer existing database fields and infrastructure where correct.
- Do not send external messages until provider, templates, cost and consent behavior are approved.
- Do not assume WhatsApp/SMS/email delivery providers are connected.
- Test schedules in staging using controlled fixtures; avoid spamming real members.
