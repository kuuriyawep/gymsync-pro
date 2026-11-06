# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.


# GymSync Pro Codex Operating Rules

## Mission and product truths
- Maintain GymSync Pro as a secure multi-tenant gym-management product. Each owner manages one gym workspace; unrelated gyms must be isolated.
- Roles are Owner, Staff and Member. Authorization must be enforced server-side and by Supabase RLS, not just UI routes.
- Member join matches existing registration data (phone + full name) before linking a member record to a Supabase Auth identity.
- Core areas: members, memberships, payments/renewals, attendance, trainers/staff, reports, gym settings, notifications, feedback/requests and profiles.
- Preserve existing mobile-first UI and black/white design unless a task explicitly requests a redesign. Do not invent features or fake data.
- Live Supabase data exists. Never treat the database as disposable.

## Architecture constraints
- React + Vite frontend under src/; Supabase Auth and Postgres are used.
- Some business operations still call Base44 Functions through @/api/base44Client and invokeWithAuth. Removing Base44 is a staged migration, not a global find-and-replace.
- Existing Supabase Edge Functions (including join-gym) and migrations must be inspected before replacements.
- Base44 may be connected to this repository. Do not commit to main, change repository visibility, alter Base44 settings, or deploy without explicit approval.

## Mandatory workflow
1. Inspect relevant code and dependencies before editing.
2. State intended scope and likely files.
3. Work on task-specific branches; never force-push.
4. Keep changes small and reversible; avoid unrelated refactors.
5. Run available lint/build/tests and report exact results. Never claim a test passed unless it ran.
6. Review diffs for regressions, security issues, secrets, mock data and tenant-boundary violations.
7. Report summary, test evidence, risks and rollback instructions.
8. Do not merge, deploy, run production migrations, delete data, rotate keys or change production settings without explicit approval.

## Security
- Never commit service-role keys, database passwords, OAuth secrets, access tokens or production secrets.
- Frontend may use only the intended publishable/anon key and public project URL; privileged operations stay server-side.
- Enforce tenant isolation for every query and mutation. Treat client-supplied role, gym_id, member_id, owner_id, payment status and amount as untrusted.
- Validate and normalize external inputs; use parameterized database access.
- Keep RLS enabled where intended; inspect existing policies before changing them.
- Protect sensitive operations with authorization, rate limits, audit logs and idempotency where applicable.
- Avoid logging PII and credentials. Review CORS; CORS is not authentication.

## Migration rules
- Do not rerun supabase/schema.sql blindly. Production has migration history and live records.
- Use reviewed, forward-only migrations and document rollback/mitigation. Prefer additive changes first.
- Document request/response contracts and callers before migrating a backend operation.
- Migrate one Base44 function at a time; test against non-production first.
- Keep Base44 production operational until replacement hosting, auth, data flows, monitoring and rollback are verified.
- Never export production user data into prompts or public repositories.

## Design and definition of done
- Maintain responsive layouts for iPhone and desktop; keep UI changes scoped and preserve loading, empty, error and success states.
- Do not add workout plans/exercise-library functionality unless explicitly approved; those were excluded from the current frontend scope.
- A task is complete only when changes are reviewed, relevant tests/build run, security and tenant isolation are considered, and limitations are reported. A commit is not proof of successful production deployment.
