# GYMSYNC PRO — PHASE 0 RECONCILIATION REPORT

**Date:** 2026-09-17
**Auditor:** Claude (via Base44 sandbox MCP + direct Supabase inspection)
**Scope:** Reconcile the two existing audits (`GYMSYNC_COMPLETE_PROJECT_AUDIT.md`, 2026-09-01; `GYMSYNC_AUDIT_REPORT.md`, 2026-09-13) against (a) the live Supabase database, and (b) the current state of the checked-in frontend code, ahead of the GymSync Pro → Supabase-native migration described in the project handover brief.
**Method:** Read-only. No code or schema changes made.

---

## 1. WHY THIS REPORT EXISTS

Two prior audits already cover page-by-page and file-level status in detail and remain broadly reliable for **frontend/business-logic** state. This report does not repeat them. It exists because:

1. Both prior audits were produced by reading **files only** (Base44 sandbox + repo). Neither queried the **live Supabase database** directly. Several of their claims about backend security posture turn out to be wrong as a result.
2. The codebase has changed since the most recent audit (2026-09-13) — including a fix to the single item that audit flagged as the P0 blocker.
3. The project brief calls for a bigger architectural shift (full Supabase Auth, complete Base44 removal) than the trajectory visible in the last two weeks of actual migration work (a Base44-Auth + Supabase-data hybrid). This needs a decision before Phase 1 work starts.

---

## 2. LIVE DATABASE FINDINGS (not visible to the prior file-based audits)

Project: `wheeaxbuxpuhgcabcskv`. Checked directly via Supabase inspection tools.

| Prior audit claim (2026-09-13) | Live database reality |
|---|---|
| "No RLS enforcement... all CRITICAL" | RLS is enabled on **every** table, and the Security Advisor returns only 2 WARN-level findings (a `SECURITY DEFINER` function reachable by `authenticated`, and leaked-password-protection being off) — nothing at CRITICAL/ERROR level. |
| "No rate limiting" | A migration named `db_3_audit_rate_limit_protection` (2026-09-06) exists. |
| "No audit logging... audit_logs never written to" | `audit_logs` currently has **574 rows**. Something is writing to it. |
| "profiles table... NOT used by current app" | `profiles` has real columns (`role`, `gym_id`, `staff_role`, `base44_user_id`) and dedicated migrations (`harden_profile_authorization`, `owner_workspace_rpc`, `restrict_owner_onboarding_role`). It's not called from the React frontend yet, but it's far more built-out than "unused scaffolding." |
| "schema.sql is stale, doesn't match actual DB" | **Confirmed independently.** The checked-in `supabase/schema.sql` reflects none of the 25 migrations applied 2026-09-05 through 2026-09-12 (tenant-integrity hardening, least-privilege/definer hardening, permissive-policy splitting, the Base44↔Supabase identity bridge, owner trial fields, onboarding RPCs). Treat `schema.sql` as historical, not authoritative. |

**Additional finding not mentioned in either prior audit:** the database also contains a full workout-tracking schema (`exercises`, `workout_templates`, `workout_plans`, `workout_sessions`, `workout_sets`, etc., all empty) and an `app_subscriptions` table for Apple/Google in-app purchases (also empty). Neither is referenced in the project brief's current-scope feature list. Worth confirming whether these are deliberately-ahead-of-schedule scaffolding or leftover/out-of-scope.

**Live data is not empty.** Current row counts: 1 gym, 1 profile, 2 staff, 3 members, 2 plans, 3 memberships, 4 payments, 574 audit log entries. This is small but real — not a clean slate. Any schema or cleanup work needs to treat it as production-like, per the brief's own caution about not blindly deleting existing records.

---

## 3. CODE DRIFT SINCE THE 2026-09-13 AUDIT

Direct inspection of the current sandbox shows the top-priority item from that audit is already fixed:

- **P0-1 (role-based route protection) — FIXED.** `src/components/RoleRoute.jsx` now exists and is wired into `App.jsx` (owner/staff routes, owner-only routes, member routes each gated). `AuthContext.jsx` resolves role via a new backend `gymAccess` operation (`resolveRole`) that derives role from actual gym/staff/member records — not a UI toggle — and supports multi-role users (e.g., owner who is also a member).
- **B23 (logout not clearing local state) — appears fixed.** `logout()` now calls `clearClientSessionState()` (`src/lib/sessionCleanup.js`) before the Base44 logout call.
- `src/lib/ownerProfileStore.js` and `src/lib/supabaseClient.js` (both flagged in the prior audits) **no longer exist** in the tree — replaced by `gymStore.js`, which loads/saves gym profile through the `gymAccess` backend function rather than localStorage.

**Practical implication:** the "Master System Status Matrix" and P0/P1 tables in `GYMSYNC_AUDIT_REPORT.md` are already partially out of date. Don't treat that file as current-state truth for auth/routing without re-checking — the remaining P1/P2/P3 items (MemberDetails mock data, owner Feedback mock data, staff invite naming, non-functional export buttons, etc.) have not been independently re-verified in this pass and should be spot-checked before being treated as still-open.

---

## 4. THE ARCHITECTURAL FORK (needs a decision before Phase 1)

The project brief asks for:
> Supabase Auth is the ONLY authentication system for the final application... Remove dependencies such as `base44.auth.me()`... The application must never use Base44 Auth.

The actual trajectory of the last two weeks of migration work points the other way — a **Base44-Auth + Supabase-data hybrid**:
- Auth stays on Base44 (`base44.auth.*` throughout `AuthContext.jsx`, Login, Register, etc.)
- Business data lives in Supabase, but is only ever reached through Base44 backend functions (`gymAccess`, `membersData`) using the **service-role key** — which bypasses RLS entirely
- Base44 identity is bridged into Supabase via dedicated columns (`base44_user_id`, `owner_base44_user_id`) and a purpose-built migration group (`base44_auth_bridge_foundation` and four related migrations, 2026-09-11)
- The extensive RLS/least-privilege hardening (Section 2) protects against a *future* direct-from-frontend Supabase Auth path, but isn't actually exercised by the app today, since the app never gets an `auth.uid()` from Supabase — it authenticates through Base44 and the backend functions do the rest server-side

These are two different end states, and they're not a small delta — moving to real Supabase Auth would mean rebuilding the login/register/OTP/session flow, replacing the `base44_user_id` bridge columns and matching logic with real `auth.uid()`-based ownership, and re-deriving `RoleRoute`'s role resolution from `profiles` instead of the `gymAccess.resolveRole` operation. It would also make the RLS work in Section 2 finally load-bearing instead of dormant.

I haven't touched anything pending your call on this, per the "no destructive changes" instruction in the brief.

---

## 5. OPEN QUESTIONS FOR YOU

1. **Auth strategy:** full Supabase Auth migration (matches the brief as written, larger/riskier rewrite) vs. continue the Base44-Auth hybrid already two weeks into hardening (smaller remaining lift, but leaves Base44 as a permanent dependency, contradicting the brief's "must NOT depend on Base44" requirement).
2. **Workout tracking & subscriptions tables:** deliberate, or out of scope for now?
3. **Where should ongoing work happen:** the Base44 sandbox tools used for this report write directly to the same git-backed repo (Base44's own docs confirm changes sync both ways with git), so GitHub isn't strictly required just to read/write files. If you want a PR-based review workflow specifically, GitHub is still worth connecting for that reason — but it's not blocking further inspection or planning work.

---

## 6. RECOMMENDATION

Given the size of this project (9 phases, multi-tenant security, a live production-like dataset), and that the brief itself names Claude Code as the intended development environment: this kind of sustained, iterative work — repeated build/typecheck/test loops, multi-file refactors, direct git history — is a much better fit for Claude Code than a chat conversation. This chat can keep doing inspection, planning, and scoped changes via the connected Base44/Supabase tools, but the Phase 2 onward implementation work will go faster and safer there.
