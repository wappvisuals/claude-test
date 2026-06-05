# Tasks — Customer Admin Suite

Status: [ ] todo · [~] in progress · [x] done

> **Progress (UI-first):** Frontend for Blocked SSN, GDPR, and Change Log is
> built and the Vite production build passes. Shared primitives (Dialog,
> ConfirmDialog, Drawer, Dropdown, Checkbox, Textarea, Card, useDebouncedValue)
> are in place. Navigation reworked: Customers submenu (NavGroup) + global
> header-menu (AppHeader). Profile SSN block/unblock control + "SSN blocked"
> badge added; Change Log moved to a floating right-edge drawer.
> Backend endpoints, Insurance UI, and Sinfrid UI are still pending — the new
> pages render loading/empty/error states until the API lands.
>
> **Backend done (Blocked SSN, GDPR, Change Log):** tables `blocked_ssns` /
> `gdpr_customers` / `customer_changes` created (FK types corrected to match
> `users.id` bigint-unsigned and `customer_profile.to_user` int); enums, models,
> services, resources, controllers, and routes built; all flows smoke-tested
> (block/unblock, change-log on edit, GDPR flag→review→anonymize→restore with
> Crypt backup). `CustomerResource.is_ssn_blocked` wired on show/update.
> **Insurance + Sinfrid DONE (UI + backend):** tables `insurance_policy`,
> `sinfrid_account`, `sinfrid_account_member`, `sinfrid_member_alarm` created;
> `AccountPlan` enum, models, services (local-DB only — no external Defentry/
> partner API), resources, controllers, routes built and smoke-tested
> (account view/plan-change/activate-deactivate/delete, family-member add/edit/
> remove, alarms, activities; policy list/cancel/sync/delete). Frontend:
> `InsurancePoliciesCard` + `SinfridAccountCard` (with family members, alarms,
> activity, plan-change & member dialogs) mounted on the customer detail page.
> Still pending: auth (added_by / requested_by / change initiator are null until
> auth exists); real partner-API wiring for Insurance/Sinfrid (currently local).
>
> **UI follow-ups done (this round):**
> - [x] Sidebar Customers submenu (`NavGroup`)
> - [x] Global header-menu (`AppHeader` + `ui/dropdown`)
> - [x] Block/unblock SSN from profile + badge (`CustomerSsnBlockControl`,
>       `unblockSsnByValue`, `Customer.is_ssn_blocked`)
> - [x] Change Log floating drawer (`ui/drawer`, `CustomerChangeLogDrawer`)
> - [ ] **Backend:** `CustomerResource` must expose `is_ssn_blocked`

## 0. Shared infrastructure
- [ ] Create `backend/app/Enums/` directory
- [ ] Add migrations: `blocked_ssns`, `gdpr_customers`, `customer_changes`,
      `sinfrid_account`, `sinfrid_account_member`, `sinfrid_member_alarm`,
      `insurance_policy` (confirm column types vs legacy live DB)
- [ ] Update `.claude/database.md` with the new tables
- [x] Add lightweight `dialog.tsx` + `ConfirmDialog.tsx` (no new deps, instead of shadcn alert-dialog)
- [x] Add `checkbox.tsx`, `textarea.tsx`, `card.tsx`, `useDebouncedValue` hook
- [x] Add row-selection (Set-based) in GDPR page
- [x] Add nav links (GDPR, Blocked SSN) to `Sidebar`
- [ ] Resolve Open Decisions in plan §6 (auth, partner APIs, scope)

## 1. Blocked SSN
- [ ] `app/Models/BlockedSsn.php`
- [ ] `app/Services/BlockedSsnService.php` (list/block/unblock/unblockBySsn)
- [ ] `app/Http/Resources/BlockedSsnResource.php`
- [ ] `app/Http/Controllers/Api/BlockedSsnController.php`
- [ ] Routes: GET/POST `/blocked-ssn`, DELETE `/blocked-ssn/{id}`, DELETE `/blocked-ssn/by-ssn/{ssn}`
- [x] FE: `types/blockedSsn.ts`, api fns, `useBlockedSsns`, `useBlockedSsnActions`
- [x] FE: `BlockedSsnPage`, `BlockedSsnAddDialog`, delete confirm; route `/blocked-ssn`

## 2. Customer Change Log
- [ ] `app/Models/CustomerChange.php`
- [ ] `app/Traits/CustomerChangeLogger.php` (logChanges/getBatchId)
- [ ] Mix trait into `Customer`; add `changes()` relation
- [ ] Call `logChanges('edit')` in `CustomerController::update()`
- [ ] `app/Http/Resources/CustomerChangeResource.php`
- [ ] `app/Http/Controllers/Api/CustomerChangeController.php` — GET `/customers/{id}/changes`
- [x] FE: `types/customerChange.ts`, api fn, `useCustomerChanges`
- [x] FE: `CustomerChangeLog.tsx` (grouped by batch) on CustomerDetailPage

## 3. GDPR Management
- [ ] `app/Enums/GdprStatus.php`, `app/Enums/GdprExclusionType.php`
- [ ] `app/Models/GdprCustomer.php` (+ boot hooks, relations)
- [ ] `Customer` model: `gdpr()` relation (+ `leads()` if applicable)
- [ ] `app/Services/GdprCustomerService.php` (flag/unflag/status/anonymize/
      deanonymize/bulk/mask helpers, Crypt backup, set block_gdpr)
- [ ] `app/Http/Resources/GdprCustomerResource.php`
- [ ] `app/Http/Controllers/Api/GdprCustomerController.php`
- [ ] Routes: list, exclusion-types, bulk-action, status, flag, unflag,
      anonymize, deanonymize
- [ ] Server-side transition guards (isLocked / expected→target)
- [x] FE: `types/gdpr.ts`, api fns, `useGdprCustomers`, `useGdprActions`
- [x] FE: `GdprListPage`, `GdprStatusBadge`, `GdprFlagDialog`,
      `GdprBulkActionBar`; confirm dialogs; route `/gdpr`

## 4. Insurance Policies
- [ ] `app/Models/InsurancePolicy.php`
- [ ] `InsuranceGatewayInterface` stub
- [ ] `app/Services/InsurancePolicyService.php` (list/cancel/sync/delete)
- [ ] `app/Http/Resources/InsurancePolicyResource.php`
- [ ] `app/Http/Controllers/Api/InsurancePolicyController.php`
- [ ] Routes: GET `/customers/{id}/policies`, POST cancel, POST sync-status, DELETE
- [ ] FE: `types/insurancePolicy.ts`, api fns, `useInsurancePolicies`, actions
- [ ] FE: `InsurancePoliciesCard`, `InsuranceCancelDialog`; confirms; on CustomerDetailPage

## 5. Sinfrid Account
- [ ] Models: `SinfridAccount`, `SinfridAccountMember`, `SinfridMemberAlarm`
- [ ] `app/Enums/AccountPlan.php` (port from legacy Sinfrid enum)
- [ ] `SinfridGatewayInterface` stub (replaces Defentry calls)
- [ ] `app/Services/SinfridAccountService.php` (view/alarms/activities/
      family-member CRUD/updateDetails/changePlan/status/delete — local DB)
- [ ] Resources: account, member, alarm
- [ ] `app/Http/Controllers/Api/SinfridAccountController.php`
- [ ] Routes: account, alarms, activities, family-members CRUD, update,
      activate/deactivate, change-plan, delete
- [ ] FE: `types/sinfrid.ts`, api fns, `useSinfridAccount`, `useSinfridAlarms`,
      `useSinfridActions`
- [ ] FE: `SinfridAccountCard`, `SinfridFamilyMembers`, `SinfridAlarmsList`,
      `SinfridActivitiesList`, `SinfridPlanChangeDialog`; confirms; on
      CustomerDetailPage

## 6. Verification
- [ ] `./vendor/bin/pint` (backend format)
- [ ] `npm run build` (frontend typecheck/build)
- [ ] Manual smoke test each feature against seeded data
