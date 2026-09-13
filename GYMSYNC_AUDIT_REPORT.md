# GYMSYNC PRO — FULL CURRENT-STATE AUDIT & SYSTEM MAP

**Audit Date:** 2026-09-13
**Auditor:** Base44 AI Agent
**Scope:** Complete read-only inspection of the current GymSync Pro codebase
**Rule:** No modifications were made. This is an inspection/reporting task only.

---

## 1. EXECUTIVE SUMMARY

GymSync Pro is a gym management platform with two distinct user experiences: an **Owner/Staff dashboard** for managing members, payments, trainers, and gym operations, and a **Member portal** for viewing membership, attendance, payments, and submitting feedback.

### Architecture Status

The project follows the intended architecture **partially**:

- ✅ **Authentication** uses Base44's built-in SDK exclusively (login, register, OTP, password reset, Google/Apple OAuth, session management).
- ✅ **Backend functions** (`gymAccess`, `membersData`) use Supabase service-role credentials server-side via a REST client, and identify the caller via `base44.auth.me()`.
- ✅ **Supabase service-role key is never exposed to the browser** — it only lives in backend function secrets.
- ⚠️ **Trainer data** is stored in Base44's built-in entity system, NOT Supabase — a deviation from the intended architecture (all business data should live in Supabase).
- ⚠️ **Owner profile** is stored in `localStorage` only — not persisted to any backend.
- 🔴 **Several pages still use mock/demo data** instead of real backend data (MemberDetails, Feedback, parts of Layout search, Payments receipt).
- 🔴 **No role-based route protection** — any authenticated user can access any route (owner or member). The `ProtectedRoute` only checks authentication, not authorization/role.
- 🔴 **No tenant isolation enforcement on the frontend** — the backend enforces gym-scoping via email matching, but there's no frontend role check preventing a member from navigating to owner pages.

### Key Findings

1. **MemberDetails page shows identical mock payment/activity data for ALL members** — it imports `memberPaymentHistory` and `memberActivity` from `mockData.js` and never uses per-member real data.
2. **Feedback page (owner side) uses mock data** — imports `memberRequests` from `memberMockData.js`, responses are local-only `setTimeout` fakes.
3. **Owner profile is localStorage-only** with hardcoded defaults ("Alex Kovac", "alex@olympicgym.com").
4. **No role-based access control** — a member can navigate to `/dashboard`, `/members`, `/payments` etc. and see owner data (if their email happens to match a gym).
5. **Dashboard "Export" button does nothing** — no onClick handler, no export logic.
6. **Reports CSV/PDF export buttons don't work** — they just close the dropdown.
7. **Payments "Edit" button opens the same view modal** — edit is not implemented.
8. **QuickMessageModal is a demo** — `setTimeout` fake, no actual message sending.
9. **SupportContactForm is a demo** — `setTimeout` fake, no actual email sending.
10. **AppFeedbackModal is a demo** — `setTimeout` fake, no actual feedback submission.
11. **Settings password change is non-functional** — inputs aren't controlled, no API call.
12. **Settings active sessions are hardcoded mock data**.
13. **Settings membership defaults are local-only** — not persisted anywhere.
14. **Notifications are derived from member/payment data client-side** — read state stored in localStorage, not from a real notifications table.
15. **Staff invite stores `full_name` as the email username** (e.g., "autotest" from "autotest@example.com") — not a real name.
16. **`GymProfileSetup` and `PhotoPicker` use `UploadFile`** (retired spelling) instead of `UploadPublicFile` — may break.

---

## 2. CURRENT ARCHITECTURE

### Intended Architecture
```
Base44 Auth → Base44 React Frontend → Secure Base44 Backend Functions → Supabase PostgreSQL
```

### Actual Architecture

| Layer | Intended | Actual | Status |
|-------|----------|--------|--------|
| Authentication | Base44 Auth | Base44 Auth SDK (`loginViaEmailPassword`, `register`, `verifyOtp`, `loginWithProvider`, `resetPassword`, `isAuthenticated`, `me`, `logout`) | ✅ Correct |
| Frontend | React + Tailwind | React + Tailwind + shadcn/ui | ✅ Correct |
| Backend Bridge | Base44 Functions with service-role | `gymAccess` and `membersData` use `createSupabaseRestClient` with `SUPABASE_SERVICE_ROLE_KEY` | ✅ Correct |
| Member/Staff Data | Supabase tables | Supabase tables (members, memberships, payments, staff, feedback_requests, notifications, gyms, membership_plans) | ✅ Correct |
| Trainer Data | Supabase | **Base44 built-in Entity system** (`base44.entities.Trainer`) | ⚠️ Deviation |
| Owner Profile | Supabase profiles table | **localStorage only** (`ownerProfileStore.js`) | ⚠️ Deviation |
| Notifications | Supabase notifications table | **Derived client-side from members/payments data** + localStorage for read state | ⚠️ Deviation |
| Member Details (payment history, activity) | Supabase payments/attendance | **Hardcoded mock data** (`mockData.js`) | 🔴 Broken |

### Deviation Details

**Deviation 1: Trainer data in Base44 Entities, not Supabase**
- **Current:** `trainerStore.js` uses `base44.entities.Trainer.filter/create/update/delete`. Trainer is a Base44 entity defined in `base44/entities/Trainer.jsonc`.
- **Intended:** Trainers should be stored in a Supabase `trainers` table (which does not exist in the schema) or the existing `staff` table.
- **Why it's a problem:** Trainer data is not in the same database as other business data, making cross-table queries impossible and splitting the data layer.
- **Files responsible:** `src/lib/trainerStore.js`, `base44/entities/Trainer.jsonc`, `src/pages/Trainers.jsx`

**Deviation 2: Owner profile in localStorage**
- **Current:** `ownerProfileStore.js` stores owner name/email/phone/photo in `localStorage` with hardcoded defaults ("Alex Kovac", "alex@olympicgym.com", "+1 555 0100").
- **Intended:** Owner profile should come from the authenticated Base44 user (`base44.auth.me()`) and/or a Supabase `profiles` table.
- **Why it's a problem:** Owner identity is fake; data is lost on device switch; hardcoded demo data leaks into production.
- **Files responsible:** `src/lib/ownerProfileStore.js`, `src/pages/Settings.jsx` (Profile tab)

**Deviation 3: Member Details uses mock data**
- **Current:** `MemberDetails.jsx` imports `memberPaymentHistory` and `memberActivity` from `mockData.js` — identical for every member.
- **Intended:** Should fetch the specific member's payments and attendance from Supabase via a backend function.
- **Why it's a problem:** Every member detail page shows the same fake payment history and activity timeline regardless of which member is selected.
- **Files responsible:** `src/pages/MemberDetails.jsx`, `src/lib/mockData.js`

---

## 3. AUTHENTICATION MAP

### How Base44 Identifies the Logged-in User

1. `AuthContext.jsx` calls `base44.auth.isAuthenticated()` on mount.
2. If authenticated, calls `base44.auth.me()` to get the user object (`{ id, email, role, full_name, ... }`).
3. User state is stored in React context.

### How the User's Business Profile is Found

**Owner/Staff path:**
- Backend functions (`gymAccess`, `membersData`) call `base44.auth.me()` to get the caller's email.
- They query Supabase `gyms` table: `email=eq.{ownerEmail}` to find the gym.
- If no gym exists, `membersData` auto-creates one named "Olympic Gym" (hardcoded).
- `gymAccess` returns 404 "Gym not found" if no gym exists (except for `createOwnerGym` operation).

**Member path:**
- `gymAccess` function queries `members` table: `email=eq.{ownerEmail}` to find a linked member.
- Members are linked via the `join` operation (phone + full name match → update member's email to the Base44 user's email).

### How Owner/Member/Staff Roles are Determined

- **Base44 user role:** `user.role` is either `"admin"` or `"user"` (Base44 built-in).
- **AuthContext maps:** `role === "admin" ? "owner" : "member"` — this is a **guess**, not a real role determination.
- **No staff role** is determined from the Base44 user. Staff records in Supabase have a `user_id` column that references `auth.users` (Supabase auth), but Base44 user IDs are not in that table. The migration `migration_base44_auth.sql` drops this FK and adds an `email` column, but there's no logic that checks whether the current Base44 user is a staff member of any gym.
- **Onboarding role:** Stored in `sessionStorage` as `onboarding_role` ("owner" or "member"), but this is never checked for authorization.

### Whether Role Tabs are Actually Enforced

🔴 **NO.** The `ProtectedRoute` component only checks `isAuthenticated` — it does NOT check the user's role. There is no `RoleRoute` component. Any authenticated user can access:
- `/` (Dashboard) — owner page
- `/members` — owner page
- `/payments` — owner page
- `/member` — member page
- `/member/attendance` — member page
- etc.

A member can navigate to `/dashboard` and see owner data (if their email matches a gym). An owner can navigate to `/member` and see a "Membership not linked" error.

### Whether a Normal User Can Access Owner Functionality

🔴 **YES.** There is no frontend role check. The only protection is that backend functions scope data by the user's email — so a member whose email doesn't match a gym will get a 404 from `membersData` (which auto-creates a gym named "Olympic Gym") or from `gymAccess` (which returns "Gym not found").

**Critical issue:** `membersData` auto-creates a gym for ANY authenticated user who doesn't have one, named "Olympic Gym". This means a member who navigates to `/dashboard` would get a new empty gym created for them.

### Whether a Member Can Access Another Member's Data

🟡 **Partially prevented.** The `gymAccess` function's `loadMemberData` queries `members` by `email=eq.{ownerEmail}` — so a member only sees their own linked member record. However, the `membersData` function scopes by gym email, so if a member's email matches a gym owner's email, they'd see all members.

### Whether a Staff User Can Access Unauthorized Owner-only Settings

🔴 **YES.** There is no staff role check anywhere. A staff user (if their email matches the gym owner's email, which is the current gym-matching logic) would have full owner access including Settings → Staff & Access → invite/revoke.

### Whether Logout Correctly Clears Application State

🟡 **Partially.** `logout()` calls `base44.auth.logout("/welcome")` which clears the Base44 auth token. However:
- `localStorage` keys are NOT cleared: `owner_profile`, `gymsync-read-notifications`, `gymsync_onboarding_draft`, `onboarding_role`, `base44_*` params.
- In-memory store states (gymStore, memberStore, memberPortalStore) are NOT reset — they retain stale data until the next load.
- `sessionStorage` onboarding draft is NOT cleared on logout.

### Auth Flow Summary

| Flow | Status | Notes |
|------|--------|-------|
| Login (email/password) | ✅ Working | Uses `base44.auth.loginViaEmailPassword`, hard redirect after |
| Register | ✅ Working | `register` → OTP → `verifyOtp` → `setToken` → redirect |
| OTP verification | ✅ Working | 6-digit code, resend supported |
| Forgot password | ✅ Working | `resetPasswordRequest`, generic success message |
| Reset password | ✅ Working | Reads `?token=`, calls `resetPassword`, redirects to `/login` |
| Google login | ✅ Working | `loginWithProvider("google", redirectTo)` |
| Apple login | ✅ Working | `loginWithProvider("apple", redirectTo)` |
| Logout | 🟡 Partial | Clears Base44 token but not localStorage/sessionStorage/stores |
| Session persistence | ✅ Working | Base44 SDK persists token in localStorage |
| Return-to URLs | ✅ Working | `safeReturnTo()` validates same-origin, strips dangerous params |
| Protected routes | 🔴 Broken | Only checks auth, not role |
| Role handling | 🔴 Broken | `admin→owner, else→member` is a guess, not enforced |

---

## 4. USER ROLES & PERMISSIONS

### Defined Roles (Intended)

| Role | Source | Can Do |
|------|--------|--------|
| Owner | Created via onboarding → `createOwnerGym` | Full gym management: members, payments, plans, trainers, staff, settings, reports |
| Staff (Manager/Front Desk/Cashier) | Invited by owner via `inviteStaff` | Limited gym management based on role |
| Member | Linked via JoinGym (phone+name match) | View own membership, attendance, payments, submit feedback |

### Actual Role Enforcement

| Check | Implemented? | Where |
|-------|-------------|-------|
| Is user authenticated? | ✅ Yes | `ProtectedRoute.jsx` |
| Is user an owner? | 🔴 No | Not checked anywhere |
| Is user a staff member? | 🔴 No | Not checked anywhere |
| Is user a member? | 🔴 No | Not checked anywhere |
| Is user the owner of THIS gym? | 🟡 Partial | Backend functions match by email, not by a profiles table role |
| Is user a staff member of THIS gym? | 🔴 No | No staff lookup by email in any backend function |
| Is user accessing their own member data? | 🟡 Partial | `gymAccess.memberData` scopes by email, but no explicit member_id check |

### Staff Role Mapping (UI ↔ DB)

| UI Role | DB Role | Permissions (UI-displayed) |
|---------|---------|---------------------------|
| Manager | `manager` | Manage members and memberships, Record payments, View reports |
| Front Desk | `front_desk` | Manage members, Record attendance |
| Cashier | `cashier` | Record and view payments |

**Note:** These permissions are display-only in `StaffInviteModal.jsx`. They are NOT enforced anywhere in the backend or frontend.

---

## 5. COMPLETE PAGE/ROUTE INVENTORY

### AUTH PAGES

#### WelcomeLobby
- **ROUTE:** `/welcome`
- **ROLE:** Public (unauthenticated)
- **PURPOSE:** Landing page with sign-in/register/join-gym links
- **CURRENT STATUS:** ✅ Working (static page)
- **DATA SOURCE:** None
- **BACKEND FUNCTION:** None
- **SUPABASE TABLE(S):** None
- **AUTHORIZATION:** None (public)
- **MOCK DATA:** Hardcoded "Olympic Gym" brand name in header
- **LOCAL STATE:** None
- **KNOWN BUGS:** Brand name is hardcoded as "Olympic Gym"
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** None

#### Login
- **ROUTE:** `/login`
- **ROLE:** Public (unauthenticated)
- **PURPOSE:** Email/password login with owner/member toggle, Google/Apple OAuth
- **CURRENT STATUS:** ✅ Working
- **DATA SOURCE:** Base44 Auth SDK
- **BACKEND FUNCTION:** None (direct SDK)
- **SUPABASE TABLE(S):** None
- **AUTHORIZATION:** None
- **MOCK DATA:** None
- **LOCAL STATE:** `role` (owner/member toggle — **visual only, not enforced**)
- **KNOWN BUGS:** Role toggle is cosmetic — doesn't affect authorization
- **MISSING CONNECTIONS:** Role toggle should determine post-login routing and access
- **DEPENDENCIES:** `base44Client`, `SocialAuthButtons`, `authReturnTo`

#### Register
- **ROUTE:** `/register`
- **ROLE:** Public (unauthenticated)
- **PURPOSE:** Create gym management account (owner/staff), email+password, OTP verification, Google/Apple
- **CURRENT STATUS:** ✅ Working
- **DATA SOURCE:** Base44 Auth SDK
- **BACKEND FUNCTION:** None
- **SUPABASE TABLE(S):** None
- **AUTHORIZATION:** None
- **MOCK DATA:** None
- **LOCAL STATE:** email, password, confirmPassword, showOtp, otpCode
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `base44Client`, `SocialAuthButtons`, `input-otp`, `authReturnTo`

#### ForgotPassword
- **ROUTE:** `/forgot-password`
- **ROLE:** Public
- **PURPOSE:** Request password reset email
- **CURRENT STATUS:** ✅ Working
- **DATA SOURCE:** Base44 Auth SDK
- **BACKEND FUNCTION:** None
- **AUTHORIZATION:** None
- **MOCK DATA:** None
- **KNOWN BUGS:** None
- **DEPENDENCIES:** `base44Client`

#### ResetPassword
- **ROUTE:** `/reset-password`
- **ROLE:** Public (with token)
- **PURPOSE:** Set new password using reset token
- **CURRENT STATUS:** ✅ Working
- **DATA SOURCE:** Base44 Auth SDK
- **BACKEND FUNCTION:** None
- **AUTHORIZATION:** None
- **MOCK DATA:** None
- **KNOWN BUGS:** None
- **DEPENDENCIES:** `base44Client`

### ONBOARDING PAGES

#### Onboarding
- **ROUTE:** `/onboarding`
- **ROLE:** Public → authenticated (mid-flow)
- **PURPOSE:** Multi-step onboarding for owners (questions, visuals, gym profile setup, paywall) and members (questions, visuals, join CTA)
- **CURRENT STATUS:** ✅ Working
- **DATA SOURCE:** `sessionStorage` (draft persistence), `gymStore` (gym creation)
- **BACKEND FUNCTION:** `gymAccess` (`createOwnerGym` operation)
- **SUPABASE TABLE(S):** `gyms`, `membership_plans`
- **AUTHORIZATION:** `createOwnerGym` checks `base44.auth.me()` — any authenticated user can create a gym
- **MOCK DATA:** None
- **LOCAL STATE:** `path` (owner/member), `step`, `answers`, `savingGym`
- **KNOWN BUGS:** `GymProfileSetup` uses `UploadFile` (retired spelling) instead of `UploadPublicFile`
- **MISSING CONNECTIONS:** Paywall is non-functional (no payment integration)
- **DEPENDENCIES:** `gymStore`, `invokeWithAuth`, onboarding components

#### JoinGym
- **ROUTE:** `/join-gym`
- **ROLE:** Public → authenticated (member)
- **PURPOSE:** Member links their account via phone + full name verification
- **CURRENT STATUS:** ✅ Working
- **DATA SOURCE:** `memberPortalStore` → `gymAccess` (`join` operation)
- **BACKEND FUNCTION:** `gymAccess`
- **SUPABASE TABLE(S):** `members`
- **AUTHORIZATION:** `join` operation checks `base44.auth.me()` and matches phone+full_name in members table
- **MOCK DATA:** None
- **LOCAL STATE:** `step` (form/verifying/success/error), `phone`, `name`
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `memberPortalStore`

### OWNER/STAFF PAGES

#### Dashboard
- **ROUTE:** `/`
- **ROLE:** Owner/Staff (intended) — any authenticated user (actual)
- **PURPOSE:** Overview of gym stats, charts, recent activity, quick actions
- **CURRENT STATUS:** ✅ Working (real data)
- **DATA SOURCE:** `memberStore` → `membersData` (bootstrap operation)
- **BACKEND FUNCTION:** `membersData`
- **SUPABASE TABLE(S):** `members`, `memberships`, `membership_plans`, `payments`
- **AUTHORIZATION:** Backend scopes by email → gym. No frontend role check.
- **MOCK DATA:** None (uses real data via `buildLiveGymAnalytics`)
- **LOCAL STATE:** `range` (7d/30d/6m/year)
- **KNOWN BUGS:** 🔴 "Export" button has no onClick handler — does nothing
- **MISSING CONNECTIONS:** Export functionality
- **DEPENDENCIES:** `memberStore`, `liveGymAnalytics`, dashboard components

#### Members
- **ROUTE:** `/members`
- **ROLE:** Owner/Staff (intended)
- **PURPOSE:** List, search, filter, sort, add, edit, delete members
- **CURRENT STATUS:** ✅ Working (real data, full CRUD)
- **DATA SOURCE:** `memberStore` → `membersData`
- **BACKEND FUNCTION:** `membersData` (create/update/delete/bootstrap operations)
- **SUPABASE TABLE(S):** `members`, `memberships`, `membership_plans`, `payments`
- **AUTHORIZATION:** Backend scopes by gym email
- **MOCK DATA:** None
- **LOCAL STATE:** `query`, `filter`, `sort`, `modalOpen`, `editingId`, `form`, `errors`, `confirmDelete`
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `memberStore`, `PhotoPicker`, `ConfirmDialog`, `ProfileImage`

#### MemberDetails
- **ROUTE:** `/members/:id`
- **ROLE:** Owner/Staff (intended)
- **PURPOSE:** View individual member details, payment history, activity timeline
- **CURRENT STATUS:** 🔴 BROKEN — uses mock data for payment history and activity
- **DATA SOURCE:** `memberStore` (for member profile) + `mockData.js` (for payment history and activity)
- **BACKEND FUNCTION:** `membersData` (bootstrap — loads ALL members, finds by ID client-side)
- **SUPABASE TABLE(S):** `members`, `memberships`, `membership_plans`, `payments`
- **AUTHORIZATION:** Backend scopes by gym email. Member ID is not validated server-side per-request.
- **MOCK DATA:** 🔴 `memberPaymentHistory` (4 hardcoded payments), `memberActivity` (7 hardcoded activities) — identical for ALL members
- **LOCAL STATE:** `quickMsg`
- **KNOWN BUGS:** 🔴 Payment history shows identical data for every member. 🔴 Activity timeline shows identical data for every member. 🔴 "Edit Member" button has no onClick. 🔴 "Renew Membership" button has no onClick. 🔴 "Record Payment" button has no onClick. 🔴 QuickMessageModal is a demo (setTimeout fake).
- **MISSING CONNECTIONS:** Per-member payment history from backend. Per-member activity from backend. Edit/Renew/Record Payment actions.
- **DEPENDENCIES:** `memberStore`, `mockData`, `QuickMessageModal`, `ProfileImage`

#### Payments
- **ROUTE:** `/payments`
- **ROLE:** Owner/Staff (intended)
- **PURPOSE:** List payments, record new payment, view payment details, print receipt
- **CURRENT STATUS:** 🟡 PARTIAL — list and record work, edit doesn't
- **DATA SOURCE:** `memberStore` → `membersData` (analytics.payments)
- **BACKEND FUNCTION:** `membersData` (recordPayment operation)
- **SUPABASE TABLE(S):** `payments`, `memberships`, `members`
- **AUTHORIZATION:** Backend scopes by gym email
- **MOCK DATA:** 🔴 `gymInfo` from `mockData.js` used in receipt (hardcoded "Olympic Gym" address/phone/email)
- **LOCAL STATE:** `query`, `statusFilter`, `methodFilter`, `dateFilter`, `sort`, `recordOpen`, `detailsOpen`, `receiptOpen`, `viewing`, `form`
- **KNOWN BUGS:** 🔴 "Edit" button opens the same view modal (not an edit form). 🔴 Receipt uses mock gym info. 🔴 All payments show status "Paid" (hardcoded in map function).
- **MISSING CONNECTIONS:** Payment edit functionality. Real gym info in receipt.
- **DEPENDENCIES:** `memberStore`, `mockData` (gymInfo), `Modal`

#### Membership
- **ROUTE:** `/membership`
- **ROLE:** Owner (intended)
- **PURPOSE:** Manage membership plans (create, edit, view, toggle active/inactive)
- **CURRENT STATUS:** ✅ Working (real data)
- **DATA SOURCE:** `memberStore` → `membersData` (analytics.plans)
- **BACKEND FUNCTION:** `membersData` (createPlan/updatePlan/togglePlan operations)
- **SUPABASE TABLE(S):** `membership_plans`, `memberships`
- **AUTHORIZATION:** Backend scopes by gym email
- **MOCK DATA:** None
- **LOCAL STATE:** `modalOpen`, `viewOpen`, `editingId`, `viewing`, `form`, `confirm`
- **KNOWN BUGS:** None (delete plan not exposed in UI, only toggle)
- **MISSING CONNECTIONS:** Delete plan functionality (backend supports it, UI doesn't)
- **DEPENDENCIES:** `memberStore`

#### Trainers
- **ROUTE:** `/trainers`
- **ROLE:** Owner/Staff (intended)
- **PURPOSE:** Manage trainers (add, edit, view, toggle, delete)
- **CURRENT STATUS:** ✅ Working (real data — but in Base44 entities, not Supabase)
- **DATA SOURCE:** `trainerStore` → `base44.entities.Trainer`
- **BACKEND FUNCTION:** None (direct Base44 entity SDK)
- **SUPABASE TABLE(S):** None (uses Base44 built-in entity storage)
- **AUTHORIZATION:** `base44.entities.Trainer.filter({ created_by_id: user.id })` — scoped to creator
- **MOCK DATA:** None
- **LOCAL STATE:** `formModal`, `detailsModal`, `editingId`, `viewing`, `form`, `confirm`, `formError`, `busy`
- **KNOWN BUGS:** "Upload photo" button has no onClick handler. Trainer data not in Supabase.
- **MISSING CONNECTIONS:** Photo upload. Supabase integration.
- **DEPENDENCIES:** `trainerStore`, `base44Client`

#### Reports
- **ROUTE:** `/reports`
- **ROLE:** Owner (intended)
- **PURPOSE:** View revenue, member, and membership reports with charts
- **CURRENT STATUS:** 🟡 PARTIAL — charts work, export doesn't
- **DATA SOURCE:** `memberStore` → `membersData` → `buildLiveGymAnalytics`
- **BACKEND FUNCTION:** `membersData`
- **SUPABASE TABLE(S):** `members`, `memberships`, `membership_plans`, `payments`
- **AUTHORIZATION:** Backend scopes by gym email
- **MOCK DATA:** None
- **LOCAL STATE:** `range`, `exportOpen`
- **KNOWN BUGS:** 🔴 "Export CSV" button just closes dropdown. 🔴 "Export PDF" button just closes dropdown. 🔴 "Print" works (window.print) but prints the whole page, not a formatted report.
- **MISSING CONNECTIONS:** CSV/PDF export functionality
- **DEPENDENCIES:** `memberStore`, `liveGymAnalytics`, report components

#### Settings
- **ROUTE:** `/settings`
- **ROLE:** Owner (intended)
- **PURPOSE:** Manage profile, gym profile, membership defaults, notifications, security, staff, danger zone
- **CURRENT STATUS:** 🟡 PARTIAL — gym profile and staff work, others are local/fake
- **DATA SOURCE:** `gymStore` (gym profile), `ownerProfileStore` (profile — localStorage), `staffStore` (staff)
- **BACKEND FUNCTION:** `gymAccess` (getGymProfile, updateGymProfile, inviteStaff, revokeStaff, listStaff)
- **SUPABASE TABLE(S):** `gyms`, `staff`
- **AUTHORIZATION:** Backend scopes by gym email
- **MOCK DATA:** 🔴 `sessions` (hardcoded active sessions), 🔴 `ownerProfileStore` defaults (hardcoded "Alex Kovac")
- **LOCAL STATE:** `active` (tab), `notif`, `gym`, `profile`, `membership`, `invite`, `revoke`, `deleteOpen`
- **KNOWN BUGS:** 🔴 Profile tab saves to localStorage only. 🔴 Password change is non-functional (uncontrolled inputs, no API call). 🔴 Active sessions are hardcoded. 🔴 Membership defaults are local-only (not persisted). 🔴 Notification toggles are local-only. 🔴 Delete account is a demo ("This is a demo — no data was deleted"). 🔴 "Revoke" session button just shows a toast.
- **MISSING CONNECTIONS:** Profile should use `base44.auth.me()` / `updateMe()`. Password change should call Base44 API. Sessions should come from backend. Membership defaults should persist. Delete account should call backend.
- **DEPENDENCIES:** `gymStore`, `ownerProfileStore`, `staffStore`, `AuthContext`, `StaffAccessPanel`, `StaffInviteModal`

#### Feedback (Owner side)
- **ROUTE:** `/feedback`
- **ROLE:** Owner/Staff (intended)
- **PURPOSE:** View and respond to member feedback/requests
- **CURRENT STATUS:** 🔴 BROKEN — uses mock data, responses are fake
- **DATA SOURCE:** `memberMockData.js` (`memberRequests`)
- **BACKEND FUNCTION:** None
- **SUPABASE TABLE(S):** `feedback_requests` (exists in schema but not used by this page)
- **AUTHORIZATION:** None
- **MOCK DATA:** 🔴 `memberRequests` from `memberMockData.js` (5 hardcoded requests)
- **LOCAL STATE:** `items`, `filter`, `active`, `response`, `saving`
- **KNOWN BUGS:** 🔴 All feedback is mock data. 🔴 "Send response" is a `setTimeout` fake. 🔴 Status changes are local-only. 🔴 No connection to Supabase `feedback_requests` table.
- **MISSING CONNECTIONS:** Should load from `feedback_requests` table via backend function. Should persist responses.
- **DEPENDENCIES:** `memberMockData`

#### Support
- **ROUTE:** `/support`
- **ROLE:** Owner (intended)
- **PURPOSE:** Documentation, guides, video tutorials, API reference, contact form
- **CURRENT STATUS:** ⚪ MOCK/LOCAL — all links show "Coming soon" toast, contact form is fake
- **DATA SOURCE:** None
- **BACKEND FUNCTION:** None
- **SUPABASE TABLE(S):** None
- **AUTHORIZATION:** None
- **MOCK DATA:** Resource links are static, all show "Coming soon"
- **LOCAL STATE:** Contact form state (name, email, subject, priority, message)
- **KNOWN BUGS:** 🔴 All resource links show "Coming soon" toast. 🔴 Contact form is a `setTimeout` fake.
- **MISSING CONNECTIONS:** Real documentation links. Real contact form submission (email via backend).
- **DEPENDENCIES:** `SupportContactForm`

### MEMBER PAGES

#### MemberDashboard
- **ROUTE:** `/member`
- **ROLE:** Member (intended)
- **PURPOSE:** Member home — membership status, streak, payments summary, profile link
- **CURRENT STATUS:** ✅ Working (real data)
- **DATA SOURCE:** `memberPortalStore` → `gymAccess` (memberData operation)
- **BACKEND FUNCTION:** `gymAccess`
- **SUPABASE TABLE(S):** `members`, `memberships`, `membership_plans`, `payments`, `attendance`, `notifications`, `feedback_requests`, `gyms`
- **AUTHORIZATION:** Backend scopes by member email
- **MOCK DATA:** None
- **LOCAL STATE:** None (reads from store)
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `memberPortalStore`, `memberPortalUtils`, `MemberLayout`

#### MemberAttendance
- **ROUTE:** `/member/attendance`
- **ROLE:** Member (intended)
- **PURPOSE:** View attendance streak, last 7 days, monthly calendar, check-ins count
- **CURRENT STATUS:** ✅ Working (real data)
- **DATA SOURCE:** `memberPortalStore` → `gymAccess` (memberData → attendance)
- **BACKEND FUNCTION:** `gymAccess`
- **SUPABASE TABLE(S):** `attendance`
- **AUTHORIZATION:** Backend scopes by member email
- **MOCK DATA:** None
- **LOCAL STATE:** None
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `memberPortalStore`, `memberPortalUtils`

#### MemberPayments
- **ROUTE:** `/member/payments`
- **ROLE:** Member (intended)
- **PURPOSE:** View membership balance and payment history
- **CURRENT STATUS:** ✅ Working (real data)
- **DATA SOURCE:** `memberPortalStore` → `gymAccess` (memberData → payments)
- **BACKEND FUNCTION:** `gymAccess`
- **SUPABASE TABLE(S):** `payments`, `memberships`
- **AUTHORIZATION:** Backend scopes by member email
- **MOCK DATA:** None
- **LOCAL STATE:** None
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `memberPortalStore`

#### MemberFeedback
- **ROUTE:** `/member/feedback`
- **ROLE:** Member (intended)
- **PURPOSE:** View and submit feedback/requests to the gym
- **CURRENT STATUS:** ✅ Working (real data)
- **DATA SOURCE:** `memberPortalStore` → `gymAccess` (memberData → feedback, createFeedback operation)
- **BACKEND FUNCTION:** `gymAccess` (createFeedback)
- **SUPABASE TABLE(S):** `feedback_requests`
- **AUTHORIZATION:** Backend scopes by member email
- **MOCK DATA:** None
- **LOCAL STATE:** `open`, `filter`, `saving`, `form`
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `memberPortalStore`

#### MemberProfile
- **ROUTE:** `/member/profile`
- **ROLE:** Member (intended)
- **PURPOSE:** View profile, membership details, personal info, logout
- **CURRENT STATUS:** ✅ Working (real data)
- **DATA SOURCE:** `memberPortalStore` → `gymAccess` (memberData → profile)
- **BACKEND FUNCTION:** `gymAccess`
- **SUPABASE TABLE(S):** `members`, `memberships`, `gyms`
- **AUTHORIZATION:** Backend scopes by member email
- **MOCK DATA:** None
- **LOCAL STATE:** None
- **KNOWN BUGS:** None
- **MISSING CONNECTIONS:** None
- **DEPENDENCIES:** `memberPortalStore`, `AuthContext`

### OTHER PAGES

#### OAuthConsent
- **ROUTE:** Not registered in App.jsx (exists as file but unreachable)
- **ROLE:** Authenticated user
- **PURPOSE:** MCP OAuth consent page for AI client authorization
- **CURRENT STATUS:** ⚫ UNUSED (not routed)
- **DATA SOURCE:** MCP API endpoints
- **DEPENDENCIES:** `app-params`

---

## 6. FRONTEND DATA-SOURCE AUDIT

### Categorization of Every Data Source

| Source Type | Files Using It | Status |
|-------------|---------------|--------|
| A. Supabase through secure backend | `gymStore`, `memberStore`, `memberPortalStore`, `staffStore` | ✅ Correct |
| B. Base44 backend/entity | `trainerStore` (Trainer entity) | ⚠️ Deviation |
| C. Mock data | `MemberDetails.jsx`, `Feedback.jsx`, `Layout.jsx` (search), `Payments.jsx` (receipt) | 🔴 Broken |
| D. localStorage | `ownerProfileStore`, `NotificationsMenu` (read state) | ⚠️ Deviation |
| E. sessionStorage | `Onboarding.jsx` (draft) | ⚠️ Acceptable (draft state) |
| F. React local state | All pages (form state, modal state) | ✅ Correct |
| G. Hardcoded/demo data | `Settings.jsx` (sessions), `WelcomeLobby.jsx` (brand name), `mockData.js`, `memberMockData.js` | 🔴 Broken |
| H. Unknown/broken source | None | ✅ |

### Detailed Mock/Demo Data Inventory

| File | Data | Used By | Replacement Needed | Priority |
|------|------|---------|-------------------|----------|
| `src/lib/mockData.js` | `memberPaymentHistory` (4 payments) | `MemberDetails.jsx` | Per-member payment history from `membersData` or new backend operation | P1 |
| `src/lib/mockData.js` | `memberActivity` (7 activities) | `MemberDetails.jsx` | Per-member activity from attendance/payments | P1 |
| `src/lib/mockData.js` | `payments` (12 mock payments) | `Layout.jsx` (search) | Remove — search should use real `analytics.payments` | P2 |
| `src/lib/mockData.js` | `trainers` (4 mock trainers) | `Layout.jsx` (search) | Remove — search should use real `trainerStore` data | P2 |
| `src/lib/mockData.js` | `gymInfo` (hardcoded gym) | `Payments.jsx` (receipt) | Use `gymStore` real gym data | P2 |
| `src/lib/memberMockData.js` | `memberRequests` (5 requests) | `Feedback.jsx` (owner) | Load from `feedback_requests` table via backend | P1 |
| `src/lib/ownerProfileStore.js` | Hardcoded defaults ("Alex Kovac") | `Settings.jsx` (Profile tab) | Use `base44.auth.me()` + `updateMe()` | P1 |
| `src/pages/Settings.jsx` | `sessions` (3 hardcoded sessions) | `Settings.jsx` (Security tab) | Real session data from Base44 or remove | P3 |
| `src/pages/WelcomeLobby.jsx` | "Olympic Gym" brand name | `WelcomeLobby.jsx` | App-wide brand constant or from config | P3 |

---

## 7. BACKEND FUNCTION INVENTORY

### Function: gymAccess

| Field | Value |
|-------|-------|
| **File path** | `base44/functions/gymAccess/entry.ts` |
| **Purpose** | Gym profile management, staff management, member portal data, member join, member feedback |
| **Who can call** | Any authenticated Base44 user |
| **Authentication** | `base44.auth.me()` — checks user exists |
| **Authorization** | Gym scoped by `email=eq.{ownerEmail}` — matches gym owner's email. No role check. |
| **Input parameters** | `operation` (string), plus operation-specific fields |
| **Operations** | `listStaff`, `inviteStaff`, `revokeStaff`, `join`, `memberData`, `createFeedback`, `getGymProfile`, `updateGymProfile`, `createOwnerGym` |
| **Database operations** | SELECT, INSERT, UPDATE, DELETE on Supabase REST API |
| **Supabase tables** | `gyms`, `staff`, `members`, `memberships`, `membership_plans`, `payments`, `attendance`, `notifications`, `feedback_requests` |
| **Service-role credentials** | ✅ Yes — uses `SUPABASE_SERVICE_ROLE_KEY` from secrets |
| **Trusts client-supplied IDs** | 🟡 Partial — `revokeStaff` trusts client-supplied `body.id` (but scopes by gym_id). `memberData` doesn't take an ID (uses email). |
| **Tenant isolation** | 🟡 Partial — all queries include `gym_id=eq.{gym.id}` or `email=eq.{ownerEmail}`. But gym is matched by email, not by a verified owner relationship. |
| **Frontend callers** | `gymStore`, `memberPortalStore`, `staffStore`, `Onboarding.jsx` |
| **Still used** | ✅ Yes |
| **Duplicates** | No |
| **Bugs/security concerns** | 🔴 `createOwnerGym` allows ANY authenticated user to create a gym. 🔴 No staff role check — any user whose email matches a gym can manage staff. 🔴 `inviteStaff` stores `full_name` as email username (e.g., "autotest" from "autotest@example.com"). 🔴 `join` operation allows linking by phone+name match without verifying the person actually owns that phone number. |

### Function: membersData

| Field | Value |
|-------|-------|
| **File path** | `base44/functions/membersData/entry.ts` |
| **Purpose** | Member CRUD, payment recording, membership plan CRUD, analytics aggregation |
| **Who can call** | Any authenticated Base44 user |
| **Authentication** | `base44.auth.me()` — checks user exists |
| **Authorization** | Gym scoped by `email=eq.{ownerEmail}`. No role check. |
| **Input parameters** | `operation` (string), plus operation-specific fields |
| **Operations** | `bootstrap`, `create`, `update`, `delete`, `recordPayment`, `deletePayment`, `createPlan`, `updatePlan`, `togglePlan`, `deletePlan` |
| **Database operations** | SELECT, INSERT, UPDATE, DELETE on Supabase REST API |
| **Supabase tables** | `gyms`, `members`, `memberships`, `membership_plans`, `payments` |
| **Service-role credentials** | ✅ Yes — uses `SUPABASE_SERVICE_ROLE_KEY` from secrets |
| **Trusts client-supplied IDs** | 🟡 Partial — `update`, `delete`, `recordPayment`, `deletePayment`, `updatePlan`, `togglePlan`, `deletePlan` all trust client-supplied IDs but verify `gym_id=eq.{gymFilter}` ownership before operating. |
| **Tenant isolation** | 🟡 Partial — all queries include `gym_id=eq.{gymFilter}`. But gym is matched by email. |
| **Frontend callers** | `memberStore` |
| **Still used** | ✅ Yes |
| **Duplicates** | No |
| **Bugs/security concerns** | 🔴 Auto-creates a gym named "Olympic Gym" for ANY user who doesn't have one (bootstrap operation). 🔴 No role check — any authenticated user can create/update/delete members if their email matches a gym. 🔴 `delete` operation doesn't verify ownership before deleting (it does include gym_id filter in the DELETE URL, which provides implicit scoping). 🔴 Member ID generation parses `notes` JSON for all members — O(n) scan, fragile. 🔴 `ensurePlan` uses `is_active` column but schema defines `status` column — possible schema mismatch. |

### Function: sendOwnerWelcomeEmail

| Field | Value |
|-------|-------|
| **File path** | `base44/functions/sendOwnerWelcomeEmail/entry.ts` |
| **Purpose** | Send welcome email to new gym owner |
| **Who can call** | Any authenticated Base44 user |
| **Authentication** | `base44.auth.me()` — checks user exists |
| **Authorization** | None — trusts caller to provide any email |
| **Input parameters** | `email` (string), `dashboardUrl` (string, optional) |
| **Database operations** | None |
| **Supabase tables** | None |
| **Service-role credentials** | No (uses `base44.asServiceRole.integrations.Core.SendEmail`) |
| **Trusts client-supplied IDs** | N/A |
| **Tenant isolation** | None |
| **Frontend callers** | None found in current code |
| **Still used** | ⚫ UNUSED — no frontend caller found |
| **Duplicates** | No |
| **Bugs/security concerns** | 🟡 Caller can send welcome email to any address. 🟡 `dashboardUrl` is caller-supplied (potential phishing if app doesn't control). 🟡 Uses `@base44/sdk@0.8.44` (older version than gymAccess/membersData which use 0.8.48). |

### Function: gymData (mentioned in audit request)

| Field | Value |
|-------|-------|
| **Status** | ⚫ DOES NOT EXIST — no `gymData` function exists in the codebase. The audit request mentioned it as an expected function, but it was never created. `gymAccess` handles gym-related operations. |

---

## 8. FRONTEND ↔ BACKEND CONNECTION MAP

### Connection Map

| Frontend File | Function Called | Operation | Supabase Table | Authorization | Status |
|---------------|----------------|-----------|----------------|-------------|--------|
| `gymStore.js` | `gymAccess` | `getGymProfile` | `gyms` | Email match | ✅ Working |
| `gymStore.js` | `gymAccess` | `updateGymProfile` | `gyms` | Email match | ✅ Working |
| `memberStore.js` | `membersData` | `bootstrap` | `members`, `memberships`, `membership_plans`, `payments` | Email match | ✅ Working |
| `memberStore.js` | `membersData` | `create` | `members`, `memberships`, `payments`, `membership_plans` | Email match | ✅ Working |
| `memberStore.js` | `membersData` | `update` | `members`, `memberships`, `membership_plans` | Email match + gym_id | ✅ Working |
| `memberStore.js` | `membersData` | `delete` | `members` | Email match + gym_id | ✅ Working |
| `memberStore.js` | `membersData` | `recordPayment` | `payments`, `memberships` | Email match + gym_id | ✅ Working |
| `memberStore.js` | `membersData` | `createPlan` | `membership_plans` | Email match | ✅ Working |
| `memberStore.js` | `membersData` | `updatePlan` | `membership_plans` | Email match + gym_id | ✅ Working |
| `memberStore.js` | `membersData` | `togglePlan` | `membership_plans` | Email match + gym_id | ✅ Working |
| `memberPortalStore.js` | `gymAccess` | `memberData` | `members`, `memberships`, `membership_plans`, `payments`, `attendance`, `notifications`, `feedback_requests`, `gyms` | Email match | ✅ Working |
| `memberPortalStore.js` | `gymAccess` | `join` | `members` | Email match + phone+name | ✅ Working |
| `memberPortalStore.js` | `gymAccess` | `createFeedback` | `feedback_requests` | Email match | ✅ Working |
| `staffStore.js` | `gymAccess` | `listStaff` | `staff` | Email match | ✅ Working |
| `staffStore.js` | `gymAccess` | `inviteStaff` | `staff` | Email match | ✅ Working |
| `staffStore.js` | `gymAccess` | `revokeStaff` | `staff` | Email match + gym_id | ✅ Working |
| `Onboarding.jsx` | `gymAccess` | `createOwnerGym` | `gyms`, `membership_plans` | Auth only | ✅ Working |
| `trainerStore.js` | None (Base44 entity) | N/A | N/A (Base44 entity) | `created_by_id` filter | ⚠️ Deviation |
| `MemberDetails.jsx` | None (mock data) | N/A | N/A | N/A | 🔴 Broken |
| `Feedback.jsx` | None (mock data) | N/A | N/A | N/A | 🔴 Broken |
| `Layout.jsx` | None (mock data for search) | N/A | N/A | N/A | 🔴 Broken |
| `Payments.jsx` | `membersData` (recordPayment) + mock (gymInfo) | `recordPayment` | `payments` | Email match | 🟡 Partial |
| `ownerProfileStore.js` | None (localStorage) | N/A | N/A | N/A | ⚠️ Deviation |
| `NotificationsMenu.jsx` | None (derived from memberStore) | N/A | N/A | N/A | ⚠️ Deviation |

### Mismatches Found

1. 🔴 **MemberDetails.jsx** calls NO backend function for per-member data — uses `memberStore` (which loads ALL members) and finds by ID client-side. Payment history and activity are from `mockData.js`.
2. 🔴 **Feedback.jsx** (owner side) calls NO backend function — uses `memberMockData.js`.
3. ⚠️ **trainerStore.js** uses Base44 entities instead of a Supabase-backed backend function.
4. ⚠️ **ownerProfileStore.js** uses localStorage instead of any backend.
5. ⚠️ **NotificationsMenu.jsx** derives notifications client-side from member/payment data instead of reading from the `notifications` Supabase table.
6. ⚠️ **Layout.jsx** search uses mock `payments` and `trainers` from `mockData.js` alongside real `members` from `memberStore`.
7. ⚫ **sendOwnerWelcomeEmail** function has NO frontend caller — it's unused.

---

## 9. SUPABASE DATABASE MAP

### Tables

| Table | Primary Key | Key Columns | Foreign Keys | RLS | Purpose |
|-------|------------|-------------|--------------|-----|---------|
| `gyms` | `id` (uuid) | `name`, `address`, `phone`, `email`, `logo_url` | None | ✅ Enabled | Gym entity |
| `profiles` | `id` (uuid → auth.users) | `gym_id`, `role`, `full_name`, `phone`, `avatar_url` | `auth.users`, `gyms` | ✅ Enabled | User profile (NOT used by current app) |
| `staff` | `id` (uuid) | `gym_id`, `user_id` (nullable after migration), `email`, `staff_role`→`role`, `status`, `permissions` | `gyms` (FK kept), `auth.users` (FK dropped by migration) | ✅ Enabled | Staff associations |
| `members` | `id` (uuid) | `gym_id`, `member_id`, `full_name`, `phone`, `email`, `user_id`, `status`, `joined_at`, `avatar_url`, `notes` | `gyms`, `auth.users` | ✅ Enabled | Gym members |
| `membership_plans` | `id` (uuid) | `gym_id`, `name`, `duration_months`, `price`, `status`→`is_active` | `gyms` | ✅ Enabled | Membership plan definitions |
| `memberships` | `id` (uuid) | `member_id`, `gym_id`, `plan_id`, `start_date`, `expiry_date`→`end_date`, `status`, `auto_renew`, `amount_due`, `amount_paid` | `members`, `gyms`, `membership_plans` | ✅ Enabled | Member membership records |
| `payments` | `id` (uuid) | `gym_id`, `member_id`, `membership_id`, `amount`, `amount_paid`, `balance`, `status`, `method`, `reference`, `recorded_by`, `payment_date`→`paid_at`, `notes`→`note` | `gyms`, `members`, `memberships`, `profiles` | ✅ Enabled | Payment records |
| `attendance` | `id` (uuid) | `gym_id`, `member_id`, `check_in_at`, `recorded_by` | `gyms`, `members`, `profiles` | ✅ Enabled | Check-in records |
| `feedback_requests` | `id` (uuid) | `gym_id`, `member_id`, `type`, `title`, `body`, `status`, `response`, `responded_by` | `gyms`, `members`, `profiles` | ✅ Enabled | Member feedback/requests |
| `notifications` | `id` (uuid) | `gym_id`, `user_id`, `member_id`, `type`, `title`, `body`, `read` | `gyms`, `auth.users`, `members` | ✅ Enabled | User notifications |
| `audit_logs` | `id` (uuid) | `gym_id`, `actor_id`, `action`, `target_type`, `target_id`, `metadata` | `gyms`, `auth.users` | ✅ Enabled | Audit trail (NOT used by current app) |

### Schema vs. Backend Function Column Mapping Issues

| Table | Schema Column | Backend Function Uses | Status |
|-------|--------------|----------------------|--------|
| `staff` | `staff_role` | `role` | ⚠️ Mismatch — backend inserts/reads `role`, schema defines `staff_role` |
| `staff` | `status` check: `('Active','Invited','Revoked')` | Backend inserts `'invited'` (lowercase) | 🔴 Constraint violation — the check constraint requires capitalized values, but backend inserts lowercase. **This was previously fixed but the schema.sql still shows capitalized values.** The actual DB may have been altered. |
| `staff` | `user_id` (NOT NULL in schema) | Backend doesn't send `user_id` (migration drops NOT NULL) | ⚠️ Schema.sql is stale — migration alters this |
| `staff` | No `email` column in schema | Backend inserts/reads `email` | ⚠️ Schema.sql is stale — migration adds this |
| `staff` | No `full_name` column in schema | Backend inserts `full_name` | ⚠️ Schema.sql is stale — `full_name` column must have been added separately |
| `membership_plans` | `status` check: `('Active','Inactive')` | Backend uses `is_active` (boolean) | ⚠️ Mismatch — backend uses `is_active`, schema defines `status` |
| `memberships` | `expiry_date` | Backend uses `end_date` | ⚠️ Mismatch |
| `memberships` | No `amount_due`, `amount_paid` in schema | Backend uses `amount_due`, `amount_paid` | ⚠️ Schema.sql is stale |
| `memberships` | `status` check: `('Active','Expiring Soon','Expired')` | Backend inserts `'active'`, `'expired'` (lowercase) | ⚠️ Possible constraint violation |
| `payments` | `payment_date` | Backend uses `paid_at` | ⚠️ Mismatch |
| `payments` | `notes` | Backend uses `note` | ⚠️ Mismatch |
| `payments` | `status` check: `('Paid','Partially Paid','Outstanding','Expired','Renewal Due','Refunded')` | Backend doesn't insert `status` (relies on default) | ⚠️ Possible issue |
| `members` | No `joined_at`, `avatar_url`, `notes` in schema | Backend uses `joined_at`, `avatar_url`, `notes` | ⚠️ Schema.sql is stale |
| `members` | `status` check: `('Active','Expiring Soon','Expired','Suspended')` | Backend inserts `'active'`, `'suspended'` (lowercase) | ⚠️ Possible constraint violation |
| `attendance` | `check_in_at` | Backend (gymAccess) reads `check_in_at` | ✅ Correct |

**Note:** The `schema.sql` file appears to be a PROPOSAL that was never run as-is. The actual database has been altered through migrations and manual changes. The backend functions use column names that don't match the schema.sql proposal, which means the actual database schema differs from what's documented in `schema.sql`.

### RLS Policies

RLS is enabled on all tables. Key policies:
- Gyms: read by `current_gym_id()`, update by owner
- Staff: read by owner/staff/self, insert/update/delete by owner
- Members: read by self or gym staff, write by gym staff, delete by owner
- Payments: read by self or gym staff, write by gym staff, delete by owner
- Feedback: read by self or gym staff, insert by self, update by gym staff
- Notifications: read/update/delete by self

**Note:** RLS policies reference `auth.uid()` (Supabase auth), but the app uses Base44 auth. The backend functions use the service-role key which bypasses RLS, so RLS policies are effectively not used by the current app. They would only matter if the frontend tried to access Supabase directly (which it doesn't).

### How Base44 User → Profile → Gym → Member/Staff is Mapped

```
Base44 User (base44.auth.me())
    ↓ email
gyms table (email = user.email)  ← Owner identification
    ↓ gym.id
members/memberships/payments/attendance/staff/feedback  ← Scoped by gym_id
    ↓
members table (email = user.email)  ← Member identification
    ↓ member.id
memberships/payments/attendance/feedback  ← Scoped by member_id
```

**Gap:** The `profiles` table (which links `auth.users.id` → `gym_id` + `role`) is NOT used by the current app. Role is not determined from the database. The `handle_new_user` trigger creates a profile with `role='member'` for every new Supabase auth user, but Base44 auth users don't go through Supabase auth, so this trigger doesn't fire for them.

---

## 10. SECURITY AUDIT

### CRITICAL

| # | Issue | File/Function | Details |
|---|-------|---------------|---------|
| C1 | No role-based access control | `ProtectedRoute.jsx`, `App.jsx` | Any authenticated user can access any route. No role check anywhere. A member can navigate to `/dashboard`, `/members`, `/payments`, `/settings` and access owner functionality. |
| C2 | Auto-gym creation for any user | `membersData/entry.ts` (bootstrap) | If no gym exists for the user's email, `membersData` auto-creates a gym named "Olympic Gym". This means ANY authenticated user (including members) who hits the dashboard gets a new gym created. |
| C3 | `createOwnerGym` has no role check | `gymAccess/entry.ts` (createOwnerGym) | Any authenticated user can create a gym. No check that the user is actually an owner. |
| C4 | Staff `full_name` is email username | `gymAccess/entry.ts` (inviteStaff) | `full_name: email.split('@')[0]` — stores "autotest" as the staff member's name. This is misleading and not a real name. |

### HIGH

| # | Issue | File/Function | Details |
|---|-------|---------------|---------|
| H1 | Gym matching by email only | `gymAccess/entry.ts`, `membersData/entry.ts` | Gym ownership is determined by `gyms.email = user.email`. There's no `profiles` table lookup or role verification. If a gym's email is changed, the owner loses access. If two users share an email (impossible in Base44, but still), they'd share a gym. |
| H2 | Member join has no verification beyond phone+name | `gymAccess/entry.ts` (join) | The `join` operation matches by phone + full_name (case-insensitive) and links the member's email to the Base44 user. Anyone who knows a member's phone and full name can claim their membership. |
| H3 | No staff role enforcement | `gymAccess/entry.ts`, all frontend | Staff roles (Manager/Front Desk/Cashier) are stored but never checked. Any staff member (if their email matches the gym) has full owner-level access. |
| H4 | `sendOwnerWelcomeEmail` trusts caller-supplied email and URL | `sendOwnerWelcomeEmail/entry.ts` | Caller can send an email to any address with any dashboard URL. No verification that the caller owns the email or that the URL is legitimate. |
| H5 | Logout doesn't clear local state | `AuthContext.jsx` (logout) | `localStorage` keys (`owner_profile`, `gymsync-read-notifications`, `base44_*`) and `sessionStorage` are not cleared on logout. Sensitive data may persist on shared devices. |

### MEDIUM

| # | Issue | File/Function | Details |
|---|-------|---------------|---------|
| M1 | Client-side member ID generation | `membersData/entry.ts` (create) | Member ID is generated by scanning all members' `notes` JSON for existing IDs. O(n) operation, fragile parsing, race condition risk. |
| M2 | No input sanitization on Supabase queries | `supabaseRest.ts` | Query strings are built with `encodeURIComponent` but not sanitized for SQL injection (PostgREST handles this, but the pattern is fragile). |
| M3 | Error messages may leak information | `gymAccess/entry.ts`, `membersData/entry.ts` | Error messages from Supabase are passed through to the frontend (`error.message`), which could reveal database structure. |
| M4 | No rate limiting | All backend functions | No rate limiting on any operation. A user could spam staff invites, member creation, etc. |
| M5 | No audit logging | All backend functions | The `audit_logs` table exists but is never written to. No record of who did what. |
| M6 | `UploadFile` (retired) used in components | `GymProfileSetup.jsx`, `PhotoPicker.jsx` | Uses `base44.integrations.Core.UploadFile` (retired spelling) instead of `UploadPublicFile`. May break or already be broken. |

### LOW

| # | Issue | File/Function | Details |
|---|-------|---------------|---------|
| L1 | Onboarding draft in sessionStorage | `Onboarding.jsx` | Draft state persists in sessionStorage. Not sensitive but could confuse users. |
| L2 | Notification read state in localStorage | `NotificationsMenu.jsx` | Read state is per-device, not synced. |
| L3 | Hardcoded "Olympic Gym" in WelcomeLobby | `WelcomeLobby.jsx` | Brand name is hardcoded. |
| L4 | Missing aria-labels on some icon buttons | Various | Some icon-only buttons lack `aria-label` or `title` attributes (e.g., some trash icons in Members table). |

---

## 11. OWNER WORKFLOW STATUS

### Owner Lifecycle Trace

| Step | Status | Details |
|------|--------|---------|
| Welcome | ✅ Working | `WelcomeLobby` at `/welcome` |
| Onboarding (questions) | ✅ Working | Multi-step question flow in `Onboarding.jsx` |
| Account creation | ✅ Working | Redirects to `/register` → Base44 auth register |
| OTP | ✅ Working | `verifyOtp` → `setToken` → redirect |
| Authentication | ✅ Working | Base44 auth session |
| Owner identity | 🔴 Broken | `ownerProfileStore` uses localStorage with hardcoded "Alex Kovac". Real identity from `base44.auth.me()` is not used for profile. |
| Gym creation | ✅ Working | `createOwnerGym` operation in `gymAccess` |
| Gym profile | ✅ Working | `getGymProfile` / `updateGymProfile` in `gymAccess`, displayed in Settings |
| Trial/paywall | ⚪ MOCK | Paywall component exists but no payment integration. "Restore purchase" shows toast. |
| Dashboard | ✅ Working | Real data from `membersData` |
| Members | ✅ Working | Full CRUD via `membersData` |
| Payments | 🟡 Partial | List and record work. Edit doesn't. Receipt uses mock gym info. |
| Plans | ✅ Working | CRUD via `membersData` (delete not exposed in UI) |
| Staff | ✅ Working | Invite/revoke via `gymAccess`. Name is email username. |
| Reports | 🟡 Partial | Charts work. Export doesn't. |
| Settings | 🟡 Partial | Gym profile and staff work. Profile/password/sessions/membership defaults are local/fake. |
| Feedback (owner) | 🔴 Broken | Uses mock data, fake responses |
| Notifications | ⚠️ Deviation | Derived client-side, not from notifications table |

### Verification Points

- ✅ Only owner should create a gym → 🔴 **NOT enforced** — `createOwnerGym` allows any authenticated user.
- ✅ Manager/staff should join through invitation → ⚠️ **Partially** — onboarding redirects managers/staff to login, but there's no actual invitation acceptance flow. Staff are just inserted into the `staff` table by email.
- ✅ Owner should be associated with the correct gym → ✅ **Yes** — gym is matched by email.
- ✅ Owner identity should come from authenticated identity → 🔴 **NO** — `ownerProfileStore` uses localStorage with hardcoded defaults.
- ✅ Gym data should not be stored only in localStorage → ✅ **Correct** — gym data is in Supabase via `gymAccess`.

---

## 12. MEMBER WORKFLOW STATUS

### Member Lifecycle Trace

| Step | Status | Details |
|------|--------|---------|
| Join Gym | ✅ Working | Phone + full name verification at `/join-gym` |
| Phone + name verification | ✅ Working | `gymAccess` `join` operation matches by phone + full_name (case-insensitive) |
| Existing registered member lookup | ✅ Working | Queries `members` table by phone + full_name |
| Account creation/linking | ✅ Working | Updates member's `email` to the Base44 user's email |
| Member authentication | ✅ Working | Base44 auth |
| Member dashboard | ✅ Working | Real data from `gymAccess` `memberData` |
| Membership | ✅ Working | Real data |
| Payments | ✅ Working | Real data |
| Attendance | ✅ Working | Real data from `attendance` table |
| Feedback/requests | ✅ Working | Real data, `createFeedback` writes to `feedback_requests` |
| Profile | ✅ Working | Real data |

### Verification Points

- ✅ Prevent random person joining without being registered → ✅ **Yes** — `join` requires exact phone + full_name match in `members` table.
- ✅ Prevent one member accessing another member's information → ✅ **Yes** — `memberData` scopes by `email=eq.{ownerEmail}`, only returns the linked member's data.
- ✅ Prevent member accessing owner/staff pages → 🔴 **NO** — no role check. A member can navigate to `/dashboard` (which would auto-create a gym via `membersData` bootstrap) or `/members`.

---

## 13. STAFF WORKFLOW STATUS

### Staff Lifecycle Trace

| Step | Status | Details |
|------|--------|---------|
| Staff invitation | ✅ Working | Owner invites via Settings → Staff & Access. `inviteStaff` inserts into `staff` table. |
| Staff access | 🔴 Broken | No login flow for staff. Staff record has an email but no password or invitation link. The `staff` table has `status: 'invited'` but there's no mechanism for the invited user to accept. |
| Staff role | ⚠️ Partial | Role is stored (`manager`, `front_desk`, `cashier`) but never checked. |
| Staff permissions | ⚪ MOCK | Permissions are display-only in `StaffInviteModal`. Not enforced. |
| Staff listing | ✅ Working | `listStaff` returns staff for the gym |
| Staff revoke | ✅ Working | `revokeStaff` deletes the staff record |
| Staff authentication | 🔴 Broken | Staff would need to register with their invited email via Base44 auth, but there's no guided flow for this. If they register and their email matches the gym owner's email, they'd get owner access. If it doesn't match, they can't access the gym at all (gym is matched by owner email). |
| Staff tenant isolation | 🔴 Broken | No staff-specific gym matching. Staff can't access the gym they were invited to because gym matching is by owner email, not by staff email. |

### Staff Status

| Feature | Status |
|---------|--------|
| Real backend | ✅ Yes (Supabase `staff` table) |
| Staff invitation | ✅ Working |
| Staff listing | ✅ Working |
| Staff revoke | ✅ Working |
| Staff authentication/login | 🔴 Broken (no flow) |
| Staff role enforcement | 🔴 Not implemented |
| Staff permissions | ⚪ Display only |
| Staff tenant isolation | 🔴 Broken |

---

## 14. MOCK/DEMO DATA INVENTORY

| # | File | Data | Used By | Replacement Needed | Priority |
|---|------|------|---------|-------------------|----------|
| 1 | `src/lib/mockData.js` | `members` (12 mock members) | NOT used by any current page (memberStore uses real data) | Remove file | P3 |
| 2 | `src/lib/mockData.js` | `payments` (12 mock payments) | `Layout.jsx` (search only) | Use `analytics.payments` from memberStore | P2 |
| 3 | `src/lib/mockData.js` | `gymInfo` (hardcoded gym) | `Payments.jsx` (receipt) | Use `gymStore` real gym data | P2 |
| 4 | `src/lib/mockData.js` | `activities` (7 mock activities) | NOT used by any current page | Remove | P3 |
| 5 | `src/lib/mockData.js` | `plans` (4 mock plans) | NOT used by any current page | Remove | P3 |
| 6 | `src/lib/mockData.js` | `analyticsData` | NOT used by any current page | Remove | P3 |
| 7 | `src/lib/mockData.js` | `dashboardStats` | NOT used by any current page | Remove | P3 |
| 8 | `src/lib/mockData.js` | `expiryOverview` | NOT used by any current page | Remove | P3 |
| 9 | `src/lib/mockData.js` | `memberPaymentHistory` (4 payments) | `MemberDetails.jsx` | Per-member payment history from backend | P1 |
| 10 | `src/lib/mockData.js` | `memberActivity` (7 activities) | `MemberDetails.jsx` | Per-member activity from backend | P1 |
| 11 | `src/lib/mockData.js` | `trainers` (4 mock trainers) | `Layout.jsx` (search only) | Use `trainerStore` real data | P2 |
| 12 | `src/lib/mockData.js` | `notifications` (6 mock notifications) | NOT used by any current page | Remove | P3 |
| 13 | `src/lib/mockData.js` | `revenueBreakdown`, `memberSummary`, `membershipStats`, `expirationTrends`, `planPerformance` | NOT used by any current page | Remove | P3 |
| 14 | `src/lib/mockData.js` | `staffRoles`, `staffPermissions`, `staff` | NOT used by any current page (StaffAccessPanel has its own permissions) | Remove | P3 |
| 15 | `src/lib/memberMockData.js` | `memberProfile`, `memberMembership`, `memberBalance`, `memberPayments`, `memberStreak`, `memberWeek`, `memberAttendanceCalendar` | NOT used by any current page (member portal uses real data) | Remove file | P3 |
| 16 | `src/lib/memberMockData.js` | `memberRequests` (5 requests) | `Feedback.jsx` (owner side) | Load from `feedback_requests` table | P1 |
| 17 | `src/lib/memberMockData.js` | `memberNotifications` | NOT used by any current page | Remove | P3 |
| 18 | `src/lib/ownerProfileStore.js` | Hardcoded defaults ("Alex Kovac", "alex@olympicgym.com", "+1 555 0100") | `Settings.jsx` (Profile tab) | Use `base44.auth.me()` + `updateMe()` | P1 |
| 19 | `src/pages/Settings.jsx` | `sessions` (3 hardcoded sessions) | `Settings.jsx` (Security tab) | Real session data or remove | P3 |

---

## 15. CURRENT BUG INVENTORY

### Confirmed Bugs

| # | Bug | File | Severity | Details |
|---|-----|------|----------|---------|
| B1 | MemberDetails shows identical payment history for all members | `MemberDetails.jsx` | 🔴 HIGH | Imports `memberPaymentHistory` from `mockData.js` — same 4 payments for every member |
| B2 | MemberDetails shows identical activity for all members | `MemberDetails.jsx` | 🔴 HIGH | Imports `memberActivity` from `mockData.js` — same 7 activities for every member |
| B3 | Dashboard Export button does nothing | `Dashboard.jsx` | 🟡 MEDIUM | No onClick handler |
| B4 | Reports CSV/PDF export doesn't work | `Reports.jsx` | 🟡 MEDIUM | Buttons just close dropdown |
| B5 | Payments Edit button opens view modal | `Payments.jsx` | 🟡 MEDIUM | Edit button calls `openDetails(p)` instead of an edit form |
| B6 | Owner Feedback page uses mock data | `Feedback.jsx` | 🔴 HIGH | Imports `memberRequests` from `memberMockData.js` |
| B7 | Owner Feedback responses are fake | `Feedback.jsx` | 🔴 HIGH | `setTimeout` fake, no backend call |
| B8 | Owner profile is localStorage-only | `ownerProfileStore.js` | 🔴 HIGH | Hardcoded defaults, not persisted to backend |
| B9 | Settings password change is non-functional | `Settings.jsx` | 🟡 MEDIUM | Uncontrolled inputs, no API call |
| B10 | Settings active sessions are hardcoded | `Settings.jsx` | 🟡 MEDIUM | 3 fake sessions |
| B11 | Settings membership defaults not persisted | `Settings.jsx` | 🟡 MEDIUM | Local state only, SaveButton just shows toast |
| B12 | Settings notification toggles not persisted | `Settings.jsx` | 🟡 MEDIUM | Local state only |
| B13 | Settings delete account is a demo | `Settings.jsx` | 🟡 MEDIUM | "This is a demo — no data was deleted" |
| B14 | QuickMessageModal is a demo | `QuickMessageModal.jsx` | 🟡 MEDIUM | `setTimeout` fake, "Saved to member's record (demo)" |
| B15 | SupportContactForm is a demo | `SupportContactForm.jsx` | 🟡 MEDIUM | `setTimeout` fake, no email sent |
| B16 | AppFeedbackModal is a demo | `AppFeedbackModal.jsx` | 🟡 MEDIUM | `setTimeout` fake, no feedback sent |
| B17 | Support resource links show "Coming soon" | `Support.jsx` | 🟡 MEDIUM | All links are non-functional |
| B18 | Payments receipt uses mock gym info | `Payments.jsx` | 🟡 MEDIUM | Uses `gymInfo` from `mockData.js` instead of `gymStore` |
| B19 | Layout search uses mock payments and trainers | `Layout.jsx` | 🟡 MEDIUM | Search mixes real members with mock payments/trainers |
| B20 | Staff invite stores email username as full_name | `gymAccess/entry.ts` | 🟡 MEDIUM | `full_name: email.split('@')[0]` |
| B21 | `membersData` auto-creates "Olympic Gym" for any user | `membersData/entry.ts` | 🔴 HIGH | Bootstrap creates gym if none exists — any user gets a gym |
| B22 | No role-based route protection | `ProtectedRoute.jsx` | 🔴 HIGH | Any authenticated user can access any route |
| B23 | Logout doesn't clear local state | `AuthContext.jsx` | 🟡 MEDIUM | localStorage/sessionStorage not cleared |
| B24 | `UploadFile` (retired spelling) used | `GymProfileSetup.jsx`, `PhotoPicker.jsx` | 🟡 MEDIUM | Should use `UploadPublicFile` |
| B25 | MemberDetails Edit/Renew/Record Payment buttons do nothing | `MemberDetails.jsx` | 🟡 MEDIUM | No onClick handlers |
| B26 | Payments all show status "Paid" | `Payments.jsx` | 🟡 MEDIUM | Hardcoded `status: "Paid"` in payment map |
| B27 | Trainer "Upload photo" button does nothing | `Trainers.jsx` | 🟡 MEDIUM | No onClick handler |
| B28 | `sendOwnerWelcomeEmail` is unused | `sendOwnerWelcomeEmail/entry.ts` | ⚪ LOW | No frontend caller |
| B29 | `OAuthConsent` page is not routed | `App.jsx`, `OAuthConsent.jsx` | ⚪ LOW | File exists but no route registered |
| B30 | Schema.sql is stale | `supabase/schema.sql` | 🟡 MEDIUM | Column names don't match actual DB (staff_role vs role, status vs is_active, etc.) |

---

## 16. BUILD/CODE QUALITY STATUS

### Build Status

- **npm build:** Not run in this audit (read-only). No obvious build-breaking issues found in code inspection.
- **TypeScript/JavaScript errors:** Backend functions use TypeScript (`.ts`) with `@base44/sdk` imports. Frontend uses JSX. No obvious type errors.
- **ESLint:** Config exists (`eslint.config.js`) but not run in this audit.

### Code Quality Issues

| Issue | Files | Severity |
|-------|-------|----------|
| Duplicate data access layers | `gymStore` (gymAccess), `memberStore` (membersData), `memberPortalStore` (gymAccess), `staffStore` (gymAccess) — all call `gymAccess` but with different operations | 🟡 LOW |
| `mockData.js` and `memberMockData.js` contain large amounts of unused mock data | `src/lib/mockData.js`, `src/lib/memberMockData.js` | 🟡 LOW |
| `ownerProfileStore.js` duplicates profile data that should come from auth | `src/lib/ownerProfileStore.js` | 🟡 MEDIUM |
| `sendOwnerWelcomeEmail` uses older SDK version (0.8.44) | `base44/functions/sendOwnerWelcomeEmail/entry.ts` | 🟡 LOW |
| `OAuthConsent.jsx` exists but is not routed | `src/pages/OAuthConsent.jsx` | ⚪ LOW |
| No circular dependencies detected | — | ✅ OK |
| No broken imports detected | — | ✅ OK |
| `schema.sql` is stale and doesn't match actual DB | `supabase/schema.sql` | 🟡 MEDIUM |

---

## 17. MASTER SYSTEM STATUS MATRIX

| AREA | PAGE/FUNCTION | STATUS | REAL DATA? | BACKEND | SUPABASE | AUTH | SECURITY | BUGS | PRIORITY |
|------|---------------|--------|------------|---------|----------|------|----------|------|----------|
| AUTH | WelcomeLobby | ✅ WORKING | N/A | None | None | ✅ | ✅ | Hardcoded brand | P3 |
| AUTH | Login | ✅ WORKING | ✅ | Base44 SDK | None | ✅ | ✅ | Role toggle cosmetic | P2 |
| AUTH | Register | ✅ WORKING | ✅ | Base44 SDK | None | ✅ | ✅ | None | — |
| AUTH | ForgotPassword | ✅ WORKING | ✅ | Base44 SDK | None | ✅ | ✅ | None | — |
| AUTH | ResetPassword | ✅ WORKING | ✅ | Base44 SDK | None | ✅ | ✅ | None | — |
| AUTH | ProtectedRoute | 🔴 BROKEN | N/A | None | None | 🟡 Auth only | 🔴 No role check | No role enforcement | P0 |
| ONBOARDING | Onboarding | ✅ WORKING | ✅ | gymAccess | gyms, plans | ✅ | 🟡 Any user can create gym | UploadFile retired | P2 |
| ONBOARDING | JoinGym | ✅ WORKING | ✅ | gymAccess | members | ✅ | 🟡 Phone+name only | None | P2 |
| OWNER | Dashboard | ✅ WORKING | ✅ | membersData | members, payments | 🔴 No role | 🔴 Auto-gym | Export broken | P1 |
| OWNER | Members | ✅ WORKING | ✅ | membersData | members, etc. | 🔴 No role | ✅ Gym-scoped | None | P2 |
| OWNER | MemberDetails | 🔴 BROKEN | ⚪ MOCK | membersData (partial) | members | 🔴 No role | ✅ | Mock payments/activity | P1 |
| OWNER | Payments | 🟡 PARTIAL | 🟡 MIXED | membersData | payments | 🔴 No role | ✅ | Edit broken, mock gym info | P1 |
| OWNER | Membership | ✅ WORKING | ✅ | membersData | plans | 🔴 No role | ✅ | None | P2 |
| OWNER | Trainers | ✅ WORKING | ✅ | Base44 entity | None | 🔴 No role | ⚠️ Not Supabase | Photo upload broken | P2 |
| OWNER | Reports | 🟡 PARTIAL | ✅ | membersData | members, payments | 🔴 No role | ✅ | Export broken | P2 |
| OWNER | Settings | 🟡 PARTIAL | 🟡 MIXED | gymAccess | gyms, staff | 🔴 No role | ✅ | Multiple fakes | P1 |
| OWNER | Feedback | 🔴 BROKEN | ⚪ MOCK | None | None | 🔴 No role | 🔴 | Mock data, fake responses | P1 |
| OWNER | Support | ⚪ MOCK | N/A | None | None | 🔴 No role | ✅ | All fake | P3 |
| OWNER | Notifications | ⚠️ DEVIATION | 🟡 DERIVED | None | None | 🔴 No role | ✅ | Client-side derived | P2 |
| MEMBER | MemberDashboard | ✅ WORKING | ✅ | gymAccess | members, etc. | 🔴 No role | ✅ | None | P2 |
| MEMBER | MemberAttendance | ✅ WORKING | ✅ | gymAccess | attendance | 🔴 No role | ✅ | None | P2 |
| MEMBER | MemberPayments | ✅ WORKING | ✅ | gymAccess | payments | 🔴 No role | ✅ | None | P2 |
| MEMBER | MemberFeedback | ✅ WORKING | ✅ | gymAccess | feedback | 🔴 No role | ✅ | None | P2 |
| MEMBER | MemberProfile | ✅ WORKING | ✅ | gymAccess | members | 🔴 No role | ✅ | None | P2 |
| BACKEND | gymAccess | ✅ WORKING | ✅ | — | gyms, staff, members, etc. | ✅ Auth | 🟡 Email-only match | Staff name issue | P1 |
| BACKEND | membersData | ✅ WORKING | ✅ | — | members, etc. | ✅ Auth | 🔴 Auto-gym creation | Schema mismatch | P1 |
| BACKEND | sendOwnerWelcomeEmail | ⚫ UNUSED | N/A | — | None | ✅ Auth | 🟡 Trusts caller email | Unused | P3 |

---

## 18. P0/P1/P2/P3/P4 PRIORITY LIST

### P0 — BLOCKERS (Prevent safe application function)

| # | Task | Area | Details |
|---|------|------|---------|
| P0-1 | Implement role-based route protection | Auth/Routing | Add role determination (owner vs member) and enforce it in `ProtectedRoute` or a new `RoleRoute` component. Prevent members from accessing owner pages and vice versa. |

### P1 — CORE CONNECTION FIXES (Make current pages work with intended architecture)

| # | Task | Area | Details |
|---|------|------|---------|
| P1-1 | Fix MemberDetails to use real per-member data | MemberDetails | Replace `memberPaymentHistory` and `memberActivity` from `mockData.js` with real data from `membersData` (or a new backend operation that returns per-member payments and activity). |
| P1-2 | Fix owner Feedback page to use real data | Feedback.jsx | Replace `memberRequests` from `memberMockData.js` with real data from `feedback_requests` table via a backend function. Wire response submission to update the database. |
| P1-3 | Fix owner profile to use real auth data | Settings.jsx, ownerProfileStore | Replace `ownerProfileStore.js` localStorage with `base44.auth.me()` for display and `base44.auth.updateMe()` for saving. |
| P1-4 | Prevent auto-gym creation for non-owners | membersData | Remove the auto-create gym logic from `membersData` bootstrap. Return an error if no gym exists (which would redirect to onboarding). |
| P1-5 | Fix staff invite to store real name | gymAccess | Either require a `full_name` in the invite form, or derive a better name than `email.split('@')[0]`. |

### P2 — FUNCTIONAL BUGS (Existing features that are broken)

| # | Task | Area | Details |
|---|------|------|---------|
| P2-1 | Implement Dashboard Export | Dashboard | Wire the Export button to generate a CSV/PDF of dashboard data. |
| P2-2 | Implement Reports CSV/PDF export | Reports | Wire the Export CSV and Export PDF buttons to actual export logic. |
| P2-3 | Implement Payments Edit | Payments | Create an edit form/modal for payments (currently opens view modal). |
| P2-4 | Fix Payments receipt to use real gym info | Payments | Replace `gymInfo` from `mockData.js` with `gymStore` data. |
| P2-5 | Fix Layout search to use real data | Layout | Replace mock `payments` and `trainers` in search with real data from stores. |
| P2-6 | Fix Payments status display | Payments | Don't hardcode `status: "Paid"` — use real status from backend. |
| P2-7 | Implement MemberDetails action buttons | MemberDetails | Wire Edit, Renew, Record Payment buttons. |
| P2-8 | Fix `UploadFile` → `UploadPublicFile` | GymProfileSetup, PhotoPicker | Replace retired `UploadFile` with `UploadPublicFile`. |
| P2-9 | Implement real notifications from Supabase | NotificationsMenu | Read from `notifications` table via backend instead of deriving client-side. |
| P2-10 | Fix logout to clear local state | AuthContext | Clear localStorage, sessionStorage, and reset stores on logout. |

### P3 — POLISH (UX/accessibility/cleanup)

| # | Task | Area | Details |
|---|------|------|---------|
| P3-1 | Remove unused mock data files | mockData.js, memberMockData.js | Remove or trim unused mock data (most of it is not referenced). |
| P3-2 | Fix Settings password change | Settings | Wire to Base44 auth password change API or remove. |
| P3-3 | Fix Settings active sessions | Settings | Use real session data or remove the hardcoded mock. |
| P3-4 | Fix Settings membership defaults persistence | Settings | Persist to backend or remove. |
| P3-5 | Fix Settings notification toggle persistence | Settings | Persist to backend or remove. |
| P3-6 | Fix Settings delete account | Settings | Implement real account deletion or clearly mark as demo. |
| P3-7 | Fix QuickMessageModal | QuickMessageModal | Implement real message sending or remove. |
| P3-8 | Fix SupportContactForm | SupportContactForm | Implement real email sending via backend or remove. |
| P3-9 | Fix AppFeedbackModal | AppFeedbackModal | Implement real feedback submission or remove. |
| P3-10 | Fix Support resource links | Support | Link to real documentation or remove. |
| P3-11 | Fix Trainer photo upload | Trainers | Wire the "Upload photo" button. |
| P3-12 | Add aria-labels to icon-only buttons | Various | Accessibility improvement. |
| P3-13 | Fix hardcoded "Olympic Gym" in WelcomeLobby | WelcomeLobby | Use app config or remove. |
| P3-14 | Remove or route OAuthConsent page | OAuthConsent | Register route or remove file. |
| P3-15 | Remove unused sendOwnerWelcomeEmail | Backend | Remove if not needed, or wire it to onboarding. |
| P3-16 | Update stale schema.sql | supabase/schema.sql | Update to match actual database schema. |

### P4 — FUTURE FEATURES (Do NOT implement now)

| # | Task | Area |
|---|------|------|
| P4-1 | Migrate Trainer data to Supabase | Trainers |
| P4-2 | Implement staff authentication/invitation acceptance flow | Staff |
| P4-3 | Implement payment integration (Stripe) | Payments |
| P4-4 | Implement paywall/trial during onboarding | Onboarding |
| P4-5 | Implement audit logging | All backend functions |
| P4-6 | Implement rate limiting | All backend functions |
| P4-7 | Implement real-time attendance check-in | Attendance |
| P4-8 | Implement member-to-member messaging | Messages |
| P4-9 | Implement workout tracking | Member portal |
| P4-10 | Implement trainer assignment to members | Trainers/Members |

---

## 19. DUPLICATE/OLD/UNUSED COMPONENTS

| Component/File | Status | Details |
|----------------|--------|---------|
| `src/lib/mockData.js` | ⚪ MOSTLY UNUSED | Only `memberPaymentHistory`, `memberActivity`, `gymInfo`, `payments`, `trainers` are used. The rest (members, activities, plans, analyticsData, dashboardStats, expiryOverview, notifications, revenueBreakdown, memberSummary, membershipStats, expirationTrends, planPerformance, staffRoles, staffPermissions, staff) are unused. |
| `src/lib/memberMockData.js` | ⚪ MOSTLY UNUSED | Only `memberRequests` is used (by Feedback.jsx). The rest (memberProfile, memberMembership, memberBalance, memberPayments, memberStreak, memberWeek, memberAttendanceCalendar, memberNotifications, daysBetween, membershipProgress) are unused — the member portal uses real data. |
| `src/lib/ownerProfileStore.js` | 🔴 BROKEN | Uses localStorage with hardcoded defaults. Should be replaced by `base44.auth.me()`. |
| `base44/functions/sendOwnerWelcomeEmail/entry.ts` | ⚫ UNUSED | No frontend caller. |
| `src/pages/OAuthConsent.jsx` | ⚫ UNROUTED | File exists but no route in App.jsx. |
| `supabase/schema.sql` | ⚫ STALE | Column names don't match actual database. |
| `supabase/migration_base44_auth.sql` | ⚫ RUN ONCE | Migration to drop staff.user_id FK. Already applied (assumed). |

---

## 20. RECOMMENDED IMPLEMENTATION ORDER

Based on the current code state, the recommended order is:

1. **P0-1: Role-based route protection** — Without this, the app is fundamentally insecure. Any user can access any data.
2. **P1-4: Prevent auto-gym creation** — This is a data integrity issue that creates phantom gyms.
3. **P1-1: Fix MemberDetails real data** — Most visible broken feature.
4. **P1-2: Fix owner Feedback real data** — Second most visible broken feature.
5. **P1-3: Fix owner profile** — Identity should come from auth, not localStorage.
6. **P1-5: Fix staff invite name** — Quick fix, improves data quality.
7. **P2-1 through P2-10: Functional bug fixes** — One at a time.
8. **P3-1 through P3-16: Polish** — One at a time.

---

## 21. TASK 01 RECOMMENDATION

### Task 01: Implement Role-Based Route Protection

**What it is:**
Add role determination logic and enforce it at the route level so that:
- Owners/staff can only access owner pages (`/`, `/members`, `/payments`, `/membership`, `/trainers`, `/reports`, `/settings`, `/feedback`, `/support`).
- Members can only access member pages (`/member`, `/member/attendance`, `/member/payments`, `/member/feedback`, `/member/profile`).
- Unauthorized access redirects to the user's appropriate home page.

**Why it must be first:**
This is the P0 blocker. Without role-based access control:
- Any member can navigate to owner pages and see all gym data.
- The `membersData` function auto-creates a gym for any user, meaning a member hitting `/dashboard` creates a phantom gym.
- No amount of feature work matters if the app doesn't enforce basic authorization.
- Every subsequent task assumes that the user is in the correct role context.

**Exact files/functions likely involved:**
- `src/components/ProtectedRoute.jsx` — Enhance to accept a `role` prop and check the user's role.
- `src/lib/AuthContext.jsx` — Enhance `profile` to determine role from backend data (whether the user has a gym = owner, whether the user has a linked member record = member, whether the user has a staff record = staff).
- `src/App.jsx` — Split protected routes into owner routes and member routes, each gated by the appropriate role.
- Possibly a new `src/lib/roleStore.js` or enhancement to `AuthContext` that calls `gymAccess` (getGymProfile) and `membersData` (bootstrap or a lightweight check) to determine the user's role on login.
- Possibly a new lightweight backend operation in `gymAccess` (e.g., `getUserRole`) that checks: does this user's email match a gym? Does it match a member? Does it match a staff record?

**What success will look like:**
- A member who logs in and navigates to `/dashboard` is redirected to `/member`.
- An owner who logs in and navigates to `/member` is redirected to `/`.
- A member cannot access `/members`, `/payments`, `/settings`, etc.
- An owner cannot access `/member/attendance`, `/member/payments`, etc.
- The role is determined from real backend data, not from a UI toggle or sessionStorage.

**What should be tested after implementation:**
1. Login as an owner → verify redirect to `/` (Dashboard) → verify can access all owner pages → verify cannot access `/member` pages.
2. Login as a member → verify redirect to `/member` → verify can access all member pages → verify cannot access owner pages.
3. Login as a member → manually navigate to `/dashboard` → verify redirect to `/member`.
4. Login as an owner → manually navigate to `/member` → verify redirect to `/`.
5. Verify that the role is determined from backend data (gym exists = owner, member exists = member), not from a UI toggle.
6. Verify that logout clears the role state.
7. Verify that a newly registered user (no gym, no member) is redirected to onboarding.

---

*END OF AUDIT REPORT*