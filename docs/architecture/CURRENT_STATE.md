# GymSync Pro — Current State Snapshot

Last reviewed: 2026-10-15. This is an observed snapshot, not a guarantee that every screen or production flow is healthy. Re-verify before migration work.

## Repository and deployment relationship
- GitHub repository: kuuriyawep/gymsync-pro
- Default branch: main
- Base44 app previously identified as 6a88c3b7227972f6634080e3
- Base44 preview URL previously identified as https://app.base44.com/apps/6a88c3b7227972f6634080e3/editor/preview
- Repository may be connected to Base44 Builder. Changes pushed to the linked branch may be reflected in Base44's workspace; verify integration settings before writes to the default branch.
- A previously created dashboard theme PR was reported as PR #5. Re-check its current state rather than relying on historic notes.

## Frontend
- React + Vite.
- Owner and member routes/components live under src/pages and src/components.
- Supabase client is in src/lib/supabaseClient.js.
- Auth context is in src/lib/AuthContext.jsx.
- Member data flows include src/lib/memberPortalStore.js.
- src/lib/invokeWithAuth.js currently invokes Base44 Functions and forwards a Supabase access token as part of the payload.
- src/api/base44Client.js creates the Base44 SDK client.
- Base44 SDK/function usage is a key migration dependency. Search the whole repo before removing it.

## Authentication and backend
- Supabase Auth is the intended canonical identity provider for current member flows.
- Supabase Edge Function join-gym exists and verifies bearer access token with Supabase Auth, rejects owner/staff accounts from member join, validates basic inputs and uses a database rate-limit RPC. Review current deployed code before changes.
- Base44 Functions gymAccess and membersData are referenced by frontend through invokeWithAuth; verify their deployed implementations and secrets.
- Do not assume all application data paths use Supabase directly just because Supabase Auth is active.

## Supabase
- Project reference: wheeaxbuxpuhgcabcskv
- Region observed: eu-central-1
- Production-like project contains real records. A snapshot query returned approximately: 60 members, 61 memberships, 73 payments, 68 notifications, 1,529 audit logs and 3 staff. Counts are time-sensitive and must be rechecked.
- Migration history includes September–October 2026 migrations for tenant integrity, audit/rate-limit protection, role onboarding, trainer relations, RLS hardening and staff profile photos.
- A policy inspection showed RLS enabled on reviewed public tables, with substantial policies. This does not prove every policy is correct; test tenant isolation.
- A Supabase security advisor previously indicated leaked-password protection is disabled. Confirm current Auth settings and decide whether to enable after evaluating impact.
- Never run supabase/schema.sql against the existing database without diffing it against deployed migrations and obtaining explicit approval.

## Known migration goals
- Replace Base44 runtime/functions with a standalone backend path, preferably Supabase Edge Functions where suitable.
- Preserve Supabase Auth users, live relational records, RLS policies and audit trail.
- Deploy outside Base44 only after end-to-end parity is proven.
- Keep existing Base44 production available until cutover is explicitly approved.
