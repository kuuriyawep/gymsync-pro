# GymSync Pro — Security Baseline

## Non-negotiable controls
- Tenant isolation must be enforced at the database/backend layer, not by client filters.
- Owner accesses only their own gym workspace; staff permissions are explicit and limited; members access only their own profile, membership, payments, attendance and allowed feedback.
- Never trust client-provided role, gym_id, member_id, amount, payment status or ownership.
- Validate input shape, length, type, allowed values and normalization on the server.
- Use least privilege for database roles and Edge Function secrets.
- Never expose service-role keys or other privileged credentials to the browser.
- Keep RLS enabled on sensitive tables and test both allowed and denied cases.
- Add rate limits to sensitive/publicly reachable endpoints, especially OTP, account creation, join-gym, feedback and payment actions.
- Use idempotency for payment/renewal mutations and scheduled jobs to prevent duplicates.
- Audit security-relevant operations; avoid recording passwords, tokens, full OTPs or unnecessary personal data.
- Review CORS origins and headers. CORS is not authentication.
- Enable leaked-password protection after assessing user impact and configuring supported Supabase Auth settings.
- Scan Git history and repository settings for secrets; rotate any credential that may have been exposed.
- Review dependencies and apply updates in small batches with tests.

## Required tests
- A member cannot read another member's record by changing an ID.
- A user from Gym A cannot read or mutate Gym B data.
- Staff cannot execute owner-only operations unless specifically granted.
- A member cannot create or elevate their own owner/staff role.
- Payment amount/status cannot be forged by client payloads.
- Repeated payment/renewal requests do not create duplicate transactions.
- Unauthenticated and expired-session requests are denied.
- Rate limits return expected errors and do not leak whether another person's membership exists.
- Logs and errors do not expose credentials or unnecessary PII.

## Incident handling
If a secret is found in public history, rotate/revoke it first, then clean history if necessary. Do not assume deleting the latest line invalidates a leaked credential. Preserve relevant audit evidence and avoid sharing production data in prompts.
