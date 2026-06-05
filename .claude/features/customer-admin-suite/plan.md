# Feature Plan — Customer Admin Suite

Revamp of five customer-management features from the legacy backend
(`C:\laragon\www\backend` — CodeIgniter + Eloquent + Fractal) into the
`claude-test` stack (Laravel 12 REST API + React 19 SPA).

Features:
1. GDPR Management
2. Customer Change Log
3. Blocked SSN
4. Insurance Policies
5. Sinfrid Account

---

## 1. How it works in the legacy backend (scan results)

All five features live in one module:
`backend/public/shop/app/Modules/Customer/`.

| Concern | Legacy location |
|---|---|
| Controllers | `Controllers/API/{GdprCustomerAPI,BlockedSsnAPI,InsurancePolicyAPI,SinfridAccountAPI}.php` |
| Services | `Services/{GdprCustomerService,BlockedSsnService,InsurancePolicyService,SinfridAccountService}.php` |
| Models | `Models/{GdprCustomer,BlockedSsn,CustomerChange,SinfridAccount,SinfridAccountMember,SinfridMemberAlarm,InsurancePolicy}.php` |
| Enums | `Enums/{GdprStatus,GdprExclusionType}.php` |
| Change logging | `Traits/Model/Logging/CustomerChangeLogger.php` (mixed into `CustomerProfile`) |
| Routes | `Modules/Customer/routes.php` |

Legacy patterns that must be **translated**, not copied:

- **Routing**: CodeIgniter `$route['backend/api/...']['POST'] = 'Controller/method/$1'`
  → Laravel `routes/api.php` resource routes.
- **Responses**: Fractal `Manager` + `Transformer` + `DataTableTrait`
  (POST-based `listTable` with `setTblParams`) → Laravel **API Resources**
  with the project envelope `{ data, links, meta }` for lists and `{ data }`
  for single resources (see `.claude/Plan.md`).
- **Auth**: `AuthenticateService->isPost()` + `UserPermission` gates
  (`Authorizable` trait). `claude-test` currently has **no auth layer** — see
  Open Decisions.
- **External partner APIs**: `DefentryApiInterface` (Sinfrid) and the insurance
  partner gateway do **not** exist in `claude-test` — see Open Decisions.

---

## 2. Target architecture (claude-test conventions)

Per `.claude/Plan.md` and existing `CustomerController`:

| Concern | claude-test location |
|---|---|
| Controllers | `backend/app/Http/Controllers/Api/` |
| Services | `backend/app/Services/` |
| Models | `backend/app/Models/` |
| Enums | `backend/app/Enums/` (new dir) |
| API Resources | `backend/app/Http/Resources/` |
| Routes | `backend/routes/api.php` |
| Migrations | `backend/database/migrations/` (see §3) |
| FE feature components | `frontend/src/components/[feature]/` |
| FE hooks | `frontend/src/hooks/` |
| FE types | `frontend/src/types/` |
| FE API calls | `frontend/src/lib/api.ts` |
| FE routes | `frontend/src/App.tsx` |

Response shape: GET-based pagination via `->paginate()` returning
`AnonymousResourceCollection` (envelope `{ data, links, meta }`), single
resources return `new XResource(...)` (`{ data }`). This matches the existing
`CustomerController`.

---

## 3. Database — IMPORTANT deviation

`MEMORY.md` records "No migrations — all app tables are pre-existing."
**That does not hold here.** A `Schema::hasTable()` probe against the live
connection shows **all seven feature tables are missing**:

```
gdpr_customers        missing
blocked_ssns          missing
customer_changes      missing
sinfrid_account       missing
sinfrid_account_member missing
sinfrid_member_alarm  missing
insurance_policy      missing
```

There is no SQL dump for them in the legacy repo (they exist only in the legacy
live DB). Therefore this work **requires new migrations**. Column definitions
below are derived from the legacy models' `$fillable`/`$casts`. **Confirm exact
column types/lengths against the legacy live DB before finalizing** (update
`.claude/database.md` once created).

Proposed schemas (derived):

**`blocked_ssns`** — from `Models/BlockedSsn.php`
- `id` PK, `ssn` varchar (10–20), `reason` varchar(1000) null,
  `added_by` FK→users.id null, `created_at`, `updated_at`.
- Unique index on `ssn`.

**`gdpr_customers`** — from `Models/GdprCustomer.php`
- `id` (uuid, `HasUuid`), `customer_id` FK→customer_profile.to_user,
  `status` enum(flagged,pending_review,anonymized,restored,rejected),
  `exclusion_type` enum(2y_after_starter,subscription_end) null,
  `flagged_at`, `anonymized_at`, `restored_at` (datetime null),
  `encrypted_backup` text null, `phone` varchar null,
  `requested_by` FK→users.id null, `source` varchar null,
  `created_at`, `updated_at`.

**`customer_changes`** — from `Models/CustomerChange.php`
- `change_id` PK, `change_initiator_user_id` FK→users.id null,
  `change_date` datetime, `change_batch_id` int,
  `change_user_id` (= customer `to_user`), `change_action` varchar,
  `change_field` varchar, `change_old_value` text null,
  `change_new_value` text null. No `timestamps`.
- Index on (`change_user_id`, `change_batch_id`).

**`sinfrid_account`** — from `Models/SinfridAccount.php`
- `id` (uuid string, non-incrementing), `customer_id` FK→customer_profile.to_user,
  `type`, `plan_id`, `first_name`, `last_name`, `email`, `phone`, `city`,
  `street`, `zipcode`, `lang_code`, `country_code`, `activation_date`,
  `email_confirmed` bool, `phone_confirmed` bool, `status` bool,
  `last_login_at`, `deactivated_at`, `created_at`, `updated_at`,
  `deleted_at` (SoftDeletes).

**`sinfrid_account_member`** — from `Models/SinfridAccountMember.php` (read during impl)
- `id` (uuid), `account_id` FK→sinfrid_account.id, `ssn`, plus member name/
  contact fields, `status`, `deactivated_at`, soft deletes. **Confirm columns.**

**`sinfrid_member_alarm`** — from `Models/SinfridMemberAlarm.php` (read during impl)
- `id`, `account_id`, `text`, `severity`, `status`, `category`, `source`,
  `coachme_available`, `coachme_description`, `date`, `created_at`.
  **Confirm columns.**

**`insurance_policy`** — from `Models/InsurancePolicy.php`
- `id` (uuid string, non-incrementing), `customer_id`, `request_id`,
  `external_customer_id`, `product`, `start_date`, `end_date`,
  `partner_reference`, `metadata` json, `relationship`, `status`, `source`
  (default 'manual'), `status_message`, `created_at`, `updated_at`.

---

## 4. Per-feature plans

### Feature 1 — GDPR Management
**Goal:** Flag customer with exclusion type; anonymize/restore; status state
machine (Flagged → PendingReview → Anonymized → Restored, plus Rejected);
bulk actions; confirmation dialogs before destructive actions.

**Backend**
- `app/Enums/GdprStatus.php` — cases flagged/pending_review/anonymized/restored/
  rejected; `isLocked()` (pending_review, anonymized), `label()`, `all()`.
- `app/Enums/GdprExclusionType.php` — 2y_after_starter, subscription_end;
  `description()`, `options()`.
- `app/Models/GdprCustomer.php` — casts for status/exclusion_type enums;
  `customer()` and `requester()` relations; boot hooks to stamp
  `requested_by`, `anonymized_at`, `restored_at`.
- Add `gdpr()` hasOne relation + `leads()` (if leads exist; otherwise skip lead
  masking) to `Customer` model.
- `app/Services/GdprCustomerService.php` — port:
  `setFlag()`, `handleStatusUpdate()`, `performAnonymization()`,
  `performDeanonymization()`, `performBulkAction()`, masking helpers
  (`maskAll/maskInitial/maskEmail/maskBirthdate`), encrypted backup of PII via
  Laravel `Crypt` (replaces legacy `Encryptor`). **Drop** the SendGrid/Slack
  report dispatch (`handleRecentlyFlaggedReportDispatch`) — out of scope for the
  admin UI; note as future cron work.
  - Mask field map (from legacy): maskInitial→[last_name, adress],
    maskAll→[pers_nr, tel, alternative_tel], maskEmail→[email,
    alternative_email], maskBirthdate→[birthdate].
  - On flag: set `customer_profile_extras.block_gdpr = true` (column exists per
    `.claude/database.md`).
- `app/Http/Resources/GdprCustomerResource.php` — id, customer summary, status
  (value+label), exclusion_type (value+description), timestamps, requester.
- `app/Http/Controllers/Api/GdprCustomerController.php`:
  - `GET  /api/gdpr/customers` (paginated list, filter by status)
  - `GET  /api/gdpr/exclusion-types`
  - `POST /api/gdpr/bulk-action` `{action: flag|unflag|anonymize|reject|restore, customers: []}`
  - `PUT  /api/customers/{id}/gdpr/status` `{status}`
  - `PUT  /api/customers/{id}/gdpr/flag` `{exclusion_type}`
  - `DELETE /api/customers/{id}/gdpr/flag`
  - `POST /api/customers/{id}/gdpr/anonymize`
  - `POST /api/customers/{id}/gdpr/deanonymize`
- Validation via `$request->validate()` (replaces `RequestValidator`).
- Guard transitions server-side using `GdprStatus::isLocked()` and the
  expected→target checks from `resolveGdprAction()`.

**Frontend**
- `types/gdpr.ts` — GdprCustomer, GdprStatus, GdprExclusionType, bulk-action payloads.
- `lib/api.ts` — gdpr list/exclusion-types/flag/unflag/anonymize/deanonymize/
  status/bulk functions.
- `hooks/useGdprCustomers.ts`, `useGdprActions.ts`.
- `components/gdpr/GdprListPage.tsx` (table with row checkboxes + status filter),
  `GdprStatusBadge.tsx`, `GdprFlagDialog.tsx` (exclusion-type select),
  `GdprBulkActionBar.tsx`, `ConfirmDialog.tsx` (shared, see §5).
- Route `/gdpr` in `App.tsx`; nav entry in `AdminLayout`.
- **Confirmation dialogs required** before anonymize/restore/bulk destructive
  actions (shadcn `AlertDialog`).

### Feature 2 — Customer Change Log
**Goal:** audit trail of all customer edits.

**Backend**
- `app/Models/CustomerChange.php` — `change_id` PK, no timestamps, `customer()`
  + `user()` relations.
- `app/Traits/CustomerChangeLogger.php` — port `logChanges($action)` +
  `getBatchId()`. Records `getChanges()` minus `comments`/`updated_at`; one row
  per field with old/new values, batch id, initiator user, action.
- Mix the trait into `Customer` and call `logChanges('edit')` from
  `CustomerController::update()` after `$customer->update()` (the existing edit
  flow). Capture initiator from auth (or null until auth exists).
- Add `changes()` hasMany to `Customer` (`change_user_id` → `to_user`).
- `app/Http/Resources/CustomerChangeResource.php`.
- `app/Http/Controllers/Api/CustomerChangeController.php`:
  - `GET /api/customers/{id}/changes` (paginated, newest first, grouped by batch).

**Frontend**
- `types/customerChange.ts`, `lib/api.ts` `fetchCustomerChanges`,
  `hooks/useCustomerChanges.ts`.
- `components/customers/CustomerChangeLog.tsx` exports `CustomerChangeLogContent`
  — timeline grouped by `change_batch_id`, showing field, old→new, action, user,
  date.
- **UI requirement (updated):** the profile content must stay clean, so the
  change log is NOT an inline card. Instead `CustomerChangeLogDrawer.tsx`
  renders a **floating button pinned to the right edge** of the customer profile
  that opens the log in a right slide-over (`components/ui/drawer.tsx`).

### Feature 3 — Blocked SSN
**Goal:** list blocklisted SSNs; add with reason; remove. **Plus (updated):**
block/unblock a customer's SSN directly from the customer profile, and show a
"SSN blocked" badge on blocked customers.

**Backend**
- `app/Models/BlockedSsn.php` — `blocked_ssns` table, `searchableColumns`
  [ssn, reason], `isBlocked()` static, `addedBy()` relation, boot stamp
  `added_by`.
- `app/Services/BlockedSsnService.php` — `getList()`, `block(ssn, reason)`
  (dedupe via `existsBySsn`), `unblock(id)`, `unblockBySsn(ssn)`.
  (Inline the legacy repository methods directly on the model/query — no
  separate Repository layer in claude-test.)
- `app/Http/Resources/BlockedSsnResource.php` — id, ssn, reason, added_by user, created_at.
- **`CustomerResource` must expose `is_ssn_blocked`** (bool) — computed via
  `BlockedSsn::isBlocked($customer->pers_nr)`. To avoid N+1 on the list,
  resolve it per-row only on the detail endpoint, or eager-batch on the list.
- `app/Http/Controllers/Api/BlockedSsnController.php`:
  - `GET    /api/blocked-ssn` (paginated + `q` search)
  - `POST   /api/blocked-ssn` `{ssn(10–20), reason?}`  ← also used from the profile
  - `DELETE /api/blocked-ssn/{id}`
  - `DELETE /api/blocked-ssn/by-ssn/{ssn}`  ← used by the profile unblock

**Frontend**
- `types/blockedSsn.ts`, `lib/api.ts` (`fetchBlockedSsns`/`blockSsn`/
  `unblockSsn`/`unblockSsnByValue`), `hooks/useBlockedSsns.ts`,
  `useBlockedSsnActions.ts`.
- `components/blocked-ssn/BlockedSsnPage.tsx` (table + debounced search),
  `BlockedSsnAddDialog.tsx`, delete via shared `ConfirmDialog`.
- **In-profile control:** `components/customers/CustomerSsnBlockControl.tsx`
  — renders next to `pers_nr` on the profile header; shows a red **"SSN blocked"
  badge** + Unblock (confirm) when blocked, or a **Block SSN** action (dialog
  with read-only SSN + reason) when not. Reads `customer.is_ssn_blocked`; bubbles
  the new state up so the profile updates without a refetch.
- `Customer` type gains `is_ssn_blocked: boolean | null`.
- Route `/blocked-ssn` + nav entry (now under the Customers submenu).

### Feature 4 — Insurance Policies
**Goal:** view policies for a customer; cancel (with end date); sync status;
delete. (Legacy actions: `cancel`, `syncStatus`, `destroy`.)

**Backend**
- `app/Models/InsurancePolicy.php` — uuid string PK non-incrementing,
  `metadata` array cast, `source` default 'manual', `customer()` relation.
- `app/Services/InsurancePolicyService.php` — `listForCustomer()`,
  `handleCancellation(id, {endDate})` (set status=pending + end_date),
  `handleStatusSync(id)`, `delete(id)`.
  - **Partner API note:** legacy cancel/sync call an external insurance partner.
    That gateway is absent here → implement as **local status updates only**
    behind an `InsuranceGatewayInterface` stub so the partner call can be wired
    later (see Open Decisions).
- `app/Http/Resources/InsurancePolicyResource.php`.
- `app/Http/Controllers/Api/InsurancePolicyController.php`:
  - `GET    /api/customers/{id}/policies`
  - `POST   /api/policies/{id}/cancel` `{endDate}`
  - `POST   /api/policies/{id}/sync-status`
  - `DELETE /api/policies/{id}`

**Frontend**
- `types/insurancePolicy.ts`, `lib/api.ts`, `hooks/useInsurancePolicies.ts`,
  `useInsurancePolicyActions.ts`.
- `components/insurance/InsurancePoliciesCard.tsx` (on CustomerDetailPage),
  `InsuranceCancelDialog.tsx` (end-date picker), confirm dialogs for
  cancel/delete.

### Feature 5 — Sinfrid Account
**Goal:** view account details (plan, alarms, activities); manage family members
(add/update/remove); change account plan. (Legacy also: activate/deactivate,
resend welcome/invite, delete — include activate/deactivate + delete; treat
email-resend as optional since it needs SendGrid.)

**Backend**
- Models: `SinfridAccount` (SoftDeletes, `familyMembers()`, `alarms()`,
  `customer()`, `is_active`/`is_deactivated` accessors, `reactivate()`/
  `deactivate()`), `SinfridAccountMember`, `SinfridMemberAlarm`.
- `app/Enums/AccountPlan.php` — port plan ids/types, `getPlanTypeById()`,
  `isUpgrade()`, `getMaxMembersCount()`, `getCategory()` (read legacy
  `Base/Api/Sinfrid/Enums/AccountPlan.php` during impl).
- `app/Services/SinfridAccountService.php` — **local-DB adaptation** of:
  `getForCustomer()`, `getListOfAlarmsForCustomer()` (from
  `sinfrid_member_alarm` instead of Defentry), `getListOfActivitiesForCustomer()`
  (from email logs / local activity table if present, else return empty paged
  set), `createFamilyMember()`, `updateDetails()`, `handlePlanChange()`,
  `handleStatusUpdate(activate|deactivate)`, `delete()`.
  - **All `DefentryApiInterface` calls** become a `SinfridGatewayInterface`
    stub (no-op / local) so external sync can be added later. The DB writes
    (create member, change plan, activate/deactivate) are performed regardless.
- Resources: `SinfridAccountResource`, `SinfridAccountMemberResource`,
  `SinfridAlarmResource`.
- `app/Http/Controllers/Api/SinfridAccountController.php`:
  - `GET    /api/customers/{id}/sinfrid-account`
  - `GET    /api/customers/{id}/sinfrid-account/alarms`
  - `GET    /api/customers/{id}/sinfrid-account/activities`
  - `POST   /api/sinfrid-account/{id}/family-members`
  - `PATCH  /api/sinfrid-account/{id}/family-members/{memberId}`
  - `DELETE /api/sinfrid-account/{id}/family-members/{memberId}`
  - `PATCH  /api/sinfrid-account/{id}`
  - `PATCH  /api/sinfrid-account/{id}/{activate|deactivate}`
  - `POST   /api/sinfrid-account/{id}/change-plan/{planId}`
  - `DELETE /api/sinfrid-account/{id}`

**Frontend**
- `types/sinfrid.ts`, `lib/api.ts`, `hooks/useSinfridAccount.ts`,
  `useSinfridAlarms.ts`, `useSinfridActions.ts`.
- `components/sinfrid/SinfridAccountCard.tsx` (details + plan),
  `SinfridFamilyMembers.tsx` (add/edit/remove), `SinfridAlarmsList.tsx`,
  `SinfridActivitiesList.tsx`, `SinfridPlanChangeDialog.tsx`. Mount on
  `CustomerDetailPage` (tabbed). Confirm dialogs for remove member / deactivate
  / delete / plan change.

---

## 5. Shared / cross-cutting work
- **Lightweight UI primitives (no new deps)** — built in `components/ui/`:
  `dialog.tsx`, `ConfirmDialog.tsx`, `drawer.tsx` (right slide-over),
  `dropdown.tsx`, `checkbox.tsx` (tri-state), `textarea.tsx`, `card.tsx`; plus
  `hooks/useDebouncedValue.ts`. (Chosen over shadcn/radix add-ons to avoid
  installing `@radix-ui/react-dialog` etc.)
- **ConfirmDialog** wraps all destructive actions (GDPR anonymize/restore/bulk,
  blocked-ssn delete, profile SSN unblock, insurance cancel/delete, sinfrid
  remove/deactivate/delete).
- **DataTable + bulk select**: GDPR and Blocked SSN use the `ui/table` primitives;
  GDPR row selection is a `Set<number>` with select-all/indeterminate.
- **Navigation (updated):**
  - **Sidebar** — `NavGroup.tsx` makes **Customers** an expandable group whose
    sub-items are **All Customers / GDPR / Blocked SSNs** (auto-expands by route).
  - **Header-menu** — `AppHeader.tsx` is a global top bar in `AdminLayout`
    showing a route breadcrumb (left) and an account dropdown menu (right). The
    redundant avatar was removed from `CustomerPageHeader`.
  - Change Log = floating-button drawer on the profile; Insurance, Sinfrid are
    tabs/cards on the customer detail page.
- **Enums dir**: create `app/Enums/` (new); register no special autoload (PSR-4
  already covers `App\`).
- **Crypt**: use Laravel `Crypt`/`encrypt()` for GDPR backup (legacy used a
  custom `Encryptor`). Ensure `APP_KEY` is set.

---

## 6. Open decisions (need product/owner input)
1. **Auth & permissions.** Legacy gates these behind auth tokens + `UserPermission`
   (super-admin for Blocked SSN). `claude-test` has no auth. Options:
   (a) ship without auth for now (sandbox), (b) add lightweight middleware/gate.
   `requested_by`/`added_by`/change initiator default to `null` until auth exists.
2. **External partner APIs.** Sinfrid's Defentry API and the insurance partner
   gateway are absent. Plan implements **local-DB behavior behind stub
   interfaces**; confirm this is acceptable vs. wiring real partners.
3. **Migrations vs. import.** Tables are missing. Either (a) create migrations
   here (recommended), or (b) import the table definitions from the legacy live
   DB. Confirm exact column types either way and update `.claude/database.md`.
4. **Scope trims.** Excluding from v1: GDPR Slack/SendGrid weekly report cron,
   Sinfrid email resend (welcome/invite) + all Defentry sync crons, Sinfrid
   `createForCustomer` from orders. Confirm these are out of v1.
5. **`leads` masking** in GDPR anonymization — only if a leads table/relation
   exists in this DB; otherwise skip.

---

## 7. Suggested build order
1. Shared infra: `app/Enums/` dir, `ConfirmDialog`, table-selection hook,
   migrations for all 7 tables.
2. Blocked SSN (simplest, self-contained) — proves the controller/resource/
   hook/page pattern end-to-end.
3. Customer Change Log (wires into existing edit flow).
4. GDPR Management (depends on ConfirmDialog + bulk-select + Crypt).
5. Insurance Policies (customer-detail card + gateway stub).
6. Sinfrid Account (largest; gateway stub + plan enum + tabs).

See `tasks.md` for the itemized checklist.
