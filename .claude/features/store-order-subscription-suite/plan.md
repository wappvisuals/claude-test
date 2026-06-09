# Feature Plan — Store Order & Subscription Suite

Revamp of the order / subscription / insurance management surface from the
legacy backend (`C:\laragon\www\backend` — CodeIgniter routing + Eloquent +
Fractal) into the `claude-test` stack (Laravel 12 REST API under `backend/` +
React 19 SPA under `frontend/`).

Follows the conventions proven by `.claude/features/customer-admin-suite`
(read that plan first — it establishes the controller/service/resource/hook/
page pattern, the shared `ListView` primitives, `ConfirmDialog`, the
`CustomerProfileTabs` sub-nav, and the "local-DB behind a gateway stub"
treatment of absent partner APIs).

Features (this suite):
1. **Insurance Policies** — list per customer, create, cancel **with reason**;
   document the external-API pattern. *(Largely already built in customer-admin-
   suite — this suite finishes it: adds cancel-reason.)*
2. **Order List** — list, filter by status + date range, clickable rows.
3. **Order View** — read-only detail `/orders/:id` (customer ref, line items,
   payment status, shipment info).
4. **Subscription List** — per customer, on the customer view.
5. **Subscription View** — read-only key fields.
6. **Order Actions** — cancel order; order adjustment (add fee or discount).
7. **Subscription Edit** — change next-shipment date; deactivate with reason.

---

## 1. How it works in the legacy backend (scan results)

Orders and subscriptions live in `backend/public/shop/app/Modules/Store/`.
Insurance lives in `backend/public/shop/app/Modules/Customer/`.

| Concern | Legacy location |
|---|---|
| Order controller | `Store/Controllers/API/OrderAPI.php` |
| Order adjustment controller | `Store/Controllers/API/OrderAdjustmentAPI.php` |
| Subscription controller | `Store/Controllers/API/SubscriptionAPI.php` |
| Insurance controller | `Customer/Controllers/API/InsurancePolicyAPI.php` |
| Services | `Store/Services/{OrderService,OrderAdjustmentService,SubscriptionService}.php`, `Customer/Services/InsurancePolicyService.php` |
| Models | `Store/Models/{Order,BaseOrder,Subscription,OrderAdjustment}.php`, `Customer/Models/InsurancePolicy.php` |
| Transformers | `Store/Transformers/{OrderTransformer,SubscriptionTransformer,OrderAdjustmentTransformer}.php` |
| Enums | `Store/Enums/{OrderActionMapping,OrderType,OrderReturnType}.php` |
| Routes | `Store/routes.php`, `Customer/routes.php` |

Legacy patterns that must be **translated**, not copied (same as customer-admin-suite):

- **Routing** — CodeIgniter `$route['backend/api/...'][VERB] = 'Controller/method/$1'`
  → Laravel `routes/api.php`.
- **List responses** — Fractal `Manager` + `DataTableTrait` POST datatable
  (`order`, `length`, `start`, `columns[]`) → Laravel `->paginate()` returning
  `{ data, links, meta }`. The legacy order list is a **POST** datatable; we
  re-express it as a **GET** paginated endpoint with query filters.
- **Single responses** — Fractal `Item` → API Resource `{ data }`.
- **Auth** — `AuthenticateService->isPost()/isGet()` + `$requireAuthToken` →
  none in claude-test. `initiator`/`by_user` default to `null` until auth lands.
- **`RequestValidator::validate()`** → `$request->validate()`.

### Key legacy behaviours captured

**Order list** — `OrderAPI::list($state)` → `OrderService::getList($filter, $order, $limit)`.
`$state` ∈ `''` (approved) | `rejected` | `deleted` selects the transformer/source
table (`orders` / `orders_temp` / `orders_deleted`). v1 covers approved orders.

**Order view** — `OrderAPI::view($id)` → `OrderService::getDetails($id, $includes)`.
`Order` (`Store/Models/Order.php` + `BaseOrder.php`): `timestamps=false`, PK `id`.
- `customer()` → `CustomerProfile` via `by_user` → `to_user`.
- `cart` is a **PHP-`serialize()`d** blob (see `BaseOrder::get/setCartAttribute`)
  — these are the **line items**. ⚠️ See §3 gotcha.
- `metadata` is JSON (`array` cast).
- payment status = `is_paid` / `is_shipped` / `is_processed` + `payment_method`.
- shipment = `date_shipped` / `shipment_center` / `partner` / `parcel_tracking_id`.
- `adjustments()` hasMany `OrderAdjustment`.

**Order actions**
- *Cancel/delete* — `OrderAPI::updateState($id)` (`action=move_to_delete|move_to_approve`)
  → `OrderService::handleStateChange()` wraps everything in a DB transaction:
  replicates the row into a target table (`orders_deleted`), runs an invoice
  partner action (credit/recover), deletes the order, recalculates the
  subscription churn date, logs. Also `OrderAPI::destroy($id)` →
  `OrderService::delete()`. **v1 simplification:** a single "cancel order"
  that marks the order cancelled locally + logs (no invoice-partner side effects).
- *Adjustment* — `OrderAdjustmentAPI::add($id)` → `OrderAdjustmentService::store()`:
  reads `metadata.cart`, `metadata.adj_total`, `comment`; derives `origin`
  (`manual_added_fee` / `manual_remove_fee` / `manual`); branches per invoice
  partner (zoho/riverty/capway) creating payments/invoice events. **v1
  simplification:** persist an `order_adjustments` row (`type` fee|discount,
  signed `adj_total` in `metadata`, `comment`, `origin`, `initiator`) — drop
  the invoice-partner integration.

**Subscription view** — `SubscriptionAPI::view($id)` → `SubscriptionService::getDetails()`,
`SubscriptionTransformer`. `Subscription` (`Store/Models/Subscription.php`): PK `id`,
has timestamps. Key fields: `active`, `payment_type`, `next_shipment`,
`pre_finance_count`, `is_pre_financed`, `cancel_*`, `date_*`, `ref/ref1/ref2`,
`final_invoice`. Relations: `orders()` hasMany, `product()` hasOne via
`subscription_id`→`prod_id`, `customer()` belongsTo `CustomerProfile` (`user_id`→`to_user`),
`inactivationMenu()` (cancel reason).

**Subscription list** — there is no standalone list endpoint; subscriptions are
listed **per customer**. We add `GET /api/customers/{id}/subscriptions`.

**Subscription edit / deactivate**
- *Edit* — `SubscriptionAPI::update($id)` → `SubscriptionService::alter()`:
  setting `date_restart` (≠ `0000-00-00`) forces `active=0`, recomputes `i`,
  writes logs, optionally stamps `date_saved`/`save_type='pause'`. Then
  `$subscription->update($data)`. We expose **change next-shipment date** via this.
- *Deactivate with reason* — `SubscriptionAPI::action($id, 'cancel')` →
  `SubscriptionService::handleAction()`. Validates `method/mode/brand/reason_id/
  reception`, computes churn date, may delete/credit orders, sets
  `active=false` + `cancel_*` fields. **v1 simplification:** deactivate sets
  `active=0`, `cancel_reason`, `date_cancelled`/`date_inactivated`, logs — no
  order deletion / invoice partner calls.

**Insurance Policies — the external-API pattern (the thing to document)**
`Customer/Services/InsurancePolicyService.php`:
- `createForCustomer()` runs inside `$this->transaction(fn () => …, fn ($e) => …)`.
  Inside the transaction it (a) calls the **remote partner API**
  `$this->insurancePolicyApi->createPolicy($dto, $product, $startDate)`, then
  (b) writes the **local** record from the remote response
  (`$customer->insurancePolicies()->create([... id, request_id,
  external_customer_id, partner_reference, status ...])`), then logs. The
  rollback closure registers a structured error log keyed on the HTTP status
  (502/503/504 → distinct events) so the whole thing is atomic: **local record
  + remote call commit or roll back together.**
- `handleCancellation($id, ['endDate'])` calls `insurancePolicyApi->cancelPolicy()`
  then mirrors the returned `status`/`statusMessage` + `end_date` locally.
- `handleStatusSync($id)` polls `getPolicyById()` and updates local status
  (guarded by `PolicyStatus::isIntermediateStatus`).

→ In `claude-test` the partner gateway does **not** exist, so the established
convention (already in `backend/app/Services/InsurancePolicyService.php`) is
**local-DB only**, documented with a comment marking where a gateway would wire
in. This suite keeps that and only adds **cancel-reason**.

---

## 2. Target architecture (claude-test conventions)

Per `.claude/Plan.md`, `customer-admin-suite`, and the existing code:

| Concern | claude-test location |
|---|---|
| Controllers | `backend/app/Http/Controllers/Api/` |
| Services | `backend/app/Services/` |
| Models | `backend/app/Models/` |
| Enums | `backend/app/Enums/` |
| API Resources | `backend/app/Http/Resources/` |
| Routes | `backend/routes/api.php` |
| FE feature components | `frontend/src/components/{orders,subscriptions,insurance}/` |
| FE hooks | `frontend/src/hooks/` |
| FE types | `frontend/src/types/` |
| FE API calls | `frontend/src/lib/api.ts` |
| FE routes | `frontend/src/App.tsx` |

Response shape: lists via `->paginate()` → `{ data, links, meta }`; single
resources → `new XResource(...)` → `{ data }`.

**Existing anchors already in the repo:**
- `frontend/src/components/orders/` and `.../subscriptions/` exist but are **empty**.
- `frontend/src/components/customers/CustomerProfileCenter.tsx` already renders
  **static** `SubscriptionsContent` and `OrdersContent` tab sections on the
  customer detail page (columns defined, "No subscription/order found" empty
  rows, "Add Order" button). **These are the wire-up targets** for Subscription
  List / Order List-in-profile.
- Insurance is **done**: `Models/InsurancePolicy.php`, `Services/InsurancePolicyService.php`,
  `Http/Controllers/Api/InsurancePolicyController.php`, FE
  `components/insurance/{InsurancePoliciesCard,InsuranceAddDialog}.tsx`,
  `hooks/useInsurancePolicies.ts`, `types/insurancePolicy.ts`, and `lib/api.ts`
  (`fetchCustomerPolicies`/`createPolicy`/`cancelPolicy`/`syncPolicyStatus`/
  `deletePolicy`). Routes: `GET /customers/{id}/policies`, `POST /policies/{id}/cancel`,
  `POST /policies/{id}/sync-status`, `DELETE /policies/{id}`.

---

## 3. Database — IMPORTANT

**✅ Schemas confirmed and documented in `.claude/database.md`.** All 8 tables
are imported in `gracewel_grace`: `orders`, `subscriptions`, `order_adjustments`,
`products`, `subscription_inactivation_menus`, `product_fees`,
`products_component`, `subscriptions_deleted`. Read `database.md` → "Store
Tables" for exact columns, Eloquent binding flags, and gotchas. Highlights that
changed assumptions:

- **`products` has NO `name` column** → resolve product display name via
  `products_component.name` (or `products_international`), not `products.name`.
- **`orders` has NO status/cancelled column**, but does have `reason`
  varchar(255). Order cancel (v1) → set `reason` + a cancel flag in `metadata`
  (or import `orders_deleted` to mirror legacy). See §6.4.
- **`subscriptions.cancel_reason` is `int` FK** → `subscription_inactivation_menus.id`
  (not free text); `subscriptions` has working `created_at`/`updated_at`.
- **`orders.cart` is `text` PHP-`serialize()`d**; `orders` has no timestamps.

Bindings (no migrations — explicit `$table`/`$primaryKey`/timestamp flags):

**`orders`** — from `Store/Models/{Order,BaseOrder}.php`
- PK `id`; **`public $timestamps = false`**.
- Columns used here: `by_user` (→ `customer_profile.to_user`), `subscription_id`,
  `prod_id`, `cart` (PHP-serialized blob), `metadata` (JSON), `payment_method`,
  `is_processed`/`is_shipped`/`is_paid` (tinyint), `ref`/`ref1`/`ref2`,
  `date_added`/`date_shipped`/`date_paid`/`date_purchased`, `total`/`total_vat`/
  `total_excluding_vat`, `region_code`, `gothia_account`, `invoice_no`,
  `shipment_center`, `partner`/`partner_sent`, `parcel_tracking_id`,
  `is_pre_financed`, `origin`, `campaign_id`.
- ⚠️ **`cart` gotcha:** legacy stores cart as PHP `serialize()` (NOT JSON). To
  surface line items, the model needs a `getCartAttribute()` accessor that
  `unserialize()`s (mirror `BaseOrder`), or a normalized line-items shape in the
  resource. Decide how much of the line-item structure to expose (see Open
  Decisions). For a read-only view, unserialize → array of `{name, qty, price}`.

**`subscriptions`** — from `Store/Models/Subscription.php`
- PK `id`; timestamps **on** (legacy has `$timestamps` commented out → default true).
- Columns: `user_id` (→ `customer_profile.to_user`), `active` (tinyint),
  `payment_type`, `next_shipment` (date), `pre_finance_count` (int),
  `is_pre_financed` (tinyint), `subscription_id` (→ product `prod_id`),
  `cancel_method`/`cancel_category`/`cancel_reception`/`cancel_reason`,
  `date_started`/`date_cancelled`/`date_churned`/`date_inactivated`/`date_restart`,
  `i`, `ref`/`ref1`/`ref2`, `final_invoice`, `batch`.
- ⚠️ legacy uses sentinel `'0000-00-00'` for empty dates — normalize to `null`
  in the resource.

**`order_adjustments`** — from `Store/Models/OrderAdjustment.php`
- PK `id`; **`created_at` only** (`const UPDATED_AT = null`).
- Columns: `order_id`, `type`, `metadata` (JSON — holds `cart` + `adj_total`),
  `comment`, `origin`, `initiator` (→ users.id), `created_at`.
- `user()` belongsTo User via `initiator`; `order()` belongsTo Order.

---

## 4. Per-feature plans

### Feature 1 — Insurance Policies (finish)
**Status:** list/create/cancel/sync/delete already shipped (local-DB; gateway
stub documented in `InsurancePolicyService`).
**This suite adds:** *cancel with reason.*

**Backend**
- `InsurancePolicyService::handleCancellation($id, $data)` — accept and persist
  `reason` (store on `status_message` or a `metadata.cancel_reason` key; prefer
  `status_message = "Cancelled: {reason}"` to avoid a schema change, or add a
  `cancel_reason` column if the import has one).
- `InsurancePolicyController` cancel action — validate `endDate` (required,
  date) + `reason` (required, string, max 1000).

**Frontend**
- `components/insurance/InsuranceCancelDialog.tsx` (end-date picker + **reason**
  textarea) routed through `ConfirmDialog`; `cancelPolicy(id, endDate, reason)`
  in `lib/api.ts`; `useInsurancePolicyActions` cancel passes reason.
- Mount `InsurancePoliciesCard` where appropriate (already on the Sinfrid
  dashboard per customer-admin-suite; confirm it also appears on the customer
  detail page if required).

**Document** the external-API pattern (§1) in code comments + `database.md` so
the local-only stub is unambiguous.

### Feature 2 — Order List
**Goal:** paginated list, filter by **status** + **date range**, clickable rows
→ Order View.

**Backend**
- `app/Models/Order.php` — `$table='orders'`, `$primaryKey='id'`,
  `public $timestamps=false`, `metadata`⇒array cast, `cart` accessor
  (unserialize), `customer()` (`by_user`→`to_user`), `subscription()`,
  `adjustments()` hasMany.
- `app/Services/OrderService.php` — `getList(array $filters)`:
  `Order::query()->with('customer')`, optional `whereBetween('date_added', …)`
  for the date range, status filter (approved only in v1 — `where` on paid/
  shipped or just all `orders`), `latest('date_added')->paginate()`.
- `app/Http/Resources/OrderResource.php` — id, ref, customer summary
  (id/name), date_added, total, payment status flags, region_code,
  subscription_id.
- `app/Http/Controllers/Api/OrderController.php`:
  - `GET /api/orders` (`?status=&date_from=&date_to=&q=&per_page=`).

**Frontend**
- `types/order.ts` (Order, OrderList, OrderListFilters).
- `lib/api.ts` — `fetchOrders(filters)`.
- `hooks/useOrders.ts`.
- `components/orders/OrderListPage.tsx` — uses shared `ListView` primitives
  (header + count chip, `ListViewToolbar` with a **status `Select`** + date-range
  inputs + `SearchBar`, `ListTable`, `ListFooter` pagination). Rows are
  **clickable** → `navigate('/orders/:id')`.
- Route `/orders` in `App.tsx`; nav entry (Orders) in the sidebar.

### Feature 3 — Order View
**Goal:** read-only `/orders/:id` — customer ref, line items, payment status,
shipment info.

**Backend**
- `OrderService::getDetails($id)` — `Order::with('customer','subscription',
  'adjustments')->findOrFail($id)`.
- `OrderResource` (detail variant / `whenLoaded`) exposes: customer block,
  **line items** from `cart` (unserialized → `[{name, qty, price, …}]`),
  payment block (`is_paid`/`is_shipped`/`is_processed`/`payment_method`/
  `date_paid`/`invoice_no`/`gothia_account`), shipment block (`date_shipped`/
  `shipment_center`/`partner`/`parcel_tracking_id`), totals, adjustments list.
- `GET /api/orders/{id}`.

**Frontend**
- `lib/api.ts` `fetchOrder(id)`; `hooks/useOrder.ts`.
- `components/orders/OrderViewPage.tsx` — read-only layout: header (ref +
  customer link), Line Items table (from cart), Payment status panel, Shipment
  panel, Adjustments list. Action bar hosts Order Actions (Feature 6).
- Route `/orders/:id` in `App.tsx`.

### Feature 4 — Subscription List (per customer)
**Goal:** list a customer's subscriptions on the customer view: status, product,
next shipment, pre-finance flag.

**Backend**
- `app/Models/Subscription.php` — `$table='subscriptions'`, `$primaryKey='id'`,
  casts (dates), `customer()` (`user_id`→`to_user`), `product()`
  (`subscription_id`→`prod_id`), `orders()` hasMany,
  `inactivationMenu()` (cancel reason) — bind only what the import has.
- `app/Services/SubscriptionService.php` — `getListForCustomer($customerId, $params)`
  → `Subscription::where('user_id', $customerId)->with('product')
  ->latest('date_started')->paginate()`.
- `app/Http/Resources/SubscriptionResource.php` (list shape) — id, active
  (→ status label), product (id/name from `subscription_id`/relation),
  next_shipment (null if sentinel), `is_pre_financed`, `pre_finance_count`,
  ref, date_started.
- `app/Http/Controllers/Api/SubscriptionController.php`:
  - `GET /api/customers/{id}/subscriptions`.

**Frontend**
- `types/subscription.ts`; `lib/api.ts` `fetchCustomerSubscriptions(customerId)`;
  `hooks/useCustomerSubscriptions.ts`.
- Wire `CustomerProfileCenter.tsx` `SubscriptionsContent` — replace the static
  table/empty row with live data (status, product, next shipment, pre-finance
  badge). Keep the existing column layout/styling. Rows clickable →
  `/subscriptions/:id`.

### Feature 5 — Subscription View
**Goal:** read-only key fields — active, payment type, next shipment,
pre_finance_count.

**Backend**
- `SubscriptionService::getDetails($id)` — `Subscription::with('customer',
  'product','orders')->findOrFail($id)`.
- `SubscriptionResource` (detail variant) — active/status, payment_type,
  next_shipment, pre_finance_count, is_pre_financed, dates (normalized),
  cancel block (method/category/reception/reason), product, related orders
  summary, customer.
- `GET /api/subscriptions/{id}`.

**Frontend**
- `lib/api.ts` `fetchSubscription(id)`; `hooks/useSubscription.ts`.
- `components/subscriptions/SubscriptionViewPage.tsx` — key-field panel + related
  orders list; action bar hosts Subscription Edit (Feature 7).
- Route `/subscriptions/:id` in `App.tsx`.

### Feature 6 — Order Actions
**Goal:** cancel an order; add an adjustment (fee or discount).

**Backend**
- `app/Models/OrderAdjustment.php` — `$table='order_adjustments'`,
  `const UPDATED_AT = null`, `metadata`⇒array, `order()`/`user()` relations.
- `OrderService::cancel($id, ['reason'])` — v1 local cancel: mark order
  cancelled (status flag / move semantics simplified), recalc subscription
  churn **skipped** in v1 (note for later), log via a local log/no-op. Behind
  the same transaction wrapper for parity.
- `app/Services/OrderAdjustmentService.php` — `store($orderId, $data)`:
  validate `type` ∈ fee|discount, compute signed `adj_total` (discount negative),
  persist `order_adjustments` row (`metadata` = `{cart?, adj_total}`, `comment`,
  `origin` derived: `manual_added_fee`/`manual_remove_fee`/`manual`, `initiator`
  null). **No invoice-partner side effects in v1.**
- `app/Http/Resources/OrderAdjustmentResource.php`.
- Controller endpoints:
  - `POST /api/orders/{id}/cancel` `{reason}`
  - `POST /api/orders/{id}/adjustments` `{type, amount, comment}`

**Frontend**
- `lib/api.ts` `cancelOrder(id, reason)`, `addOrderAdjustment(id, payload)`.
- `hooks/useOrderActions.ts`.
- `components/orders/OrderCancelDialog.tsx` (reason) via `ConfirmDialog`;
  `components/orders/OrderAdjustmentDialog.tsx` (fee/discount toggle + amount +
  comment). Both on `OrderViewPage` action bar; refetch on success.

### Feature 7 — Subscription Edit
**Goal:** change next-shipment date; deactivate with reason.

**Backend**
- `SubscriptionService::alter($id, $data)` — v1 supports updating
  `next_shipment` (validate date). Keep it minimal (drop the `i`/log
  recomputation unless needed).
- `SubscriptionService::deactivate($id, ['reason'])` — set `active=0`,
  `cancel_reason`, `date_inactivated`/`date_cancelled = today`, log. (Maps to
  legacy `handleAction('cancel')`, simplified — no order deletion / churn /
  invoice calls in v1.)
- Controller:
  - `PATCH /api/subscriptions/{id}` `{next_shipment}`
  - `POST  /api/subscriptions/{id}/deactivate` `{reason}`

**Frontend**
- `lib/api.ts` `updateSubscription(id, {next_shipment})`,
  `deactivateSubscription(id, reason)`.
- `hooks/useSubscriptionActions.ts`.
- `components/subscriptions/SubscriptionEditDialog.tsx` (next-shipment date
  picker), `SubscriptionDeactivateDialog.tsx` (reason) via `ConfirmDialog`. On
  `SubscriptionViewPage` action bar.

---

## 5. Shared / cross-cutting work
- **Reuse** the customer-admin-suite primitives — do **not** re-create them:
  `components/ui/ListView.tsx` (+ `ListViewHeader/Toolbar/Table/Thead/Th/Row/
  Cell/Empty/Footer`), `ConfirmDialog`, `dialog`, `Select`, `SearchBar`,
  `textarea`, `card`, `useDebouncedValue`. Accent teal **#00C48C**.
- **List pages** (Order List) use `ListView`; **status filters are `Select`
  dropdowns, not tabs**; date range = two date inputs in the toolbar.
- **ConfirmDialog** wraps every destructive/irreversible action: order cancel,
  subscription deactivate, insurance cancel.
- **Navigation** — add an **Orders** sidebar entry (top-level list page).
  Subscriptions and Orders-in-profile stay on the customer detail page via the
  existing `CustomerProfileCenter` tabs. Subscription View + Order View are
  standalone routes reached by clicking a row.
- **Enums** — `app/Enums/` already exists. Add only if needed (e.g. an
  `OrderAdjustmentType` fee|discount, `SubscriptionStatus`). Prefer simple
  string constants if an enum is overkill.
- **Date sentinels** — centralize `'0000-00-00' → null` normalization (a small
  helper or resource-level guard) so subscription/order dates render cleanly.

---

## 6. Open decisions (need product/owner input)
1. ~~**Imported table schemas.**~~ ✅ **Resolved** — all 8 tables verified in
   `gracewel_grace` and documented in `.claude/database.md`. New finding: the
   **product display name** is not on `products` (use `products_component.name`
   / `products_international`) — confirm which source to show for the
   Subscription/Order "product" label.
2. **`cart` line-items.** Legacy `cart` is a PHP-`serialize()`d object graph.
   For Order View, do we (a) unserialize and expose a minimal `{name, qty,
   price}` list (recommended, read-only), or (b) join a normalized product/
   line-item table if the import includes one? Confirm the serialized shape.
3. **Scope trims (excluded from v1).** Winback/full-save/extensions,
   installments, replacements, shipment processing/printing, order documents &
   confirmation emails, ledger/gothia updates, credit-future-orders, final
   invoice, churn-date recalculation, and **all invoice-partner side effects**
   (zoho/riverty/capway) in cancel & adjustment. Confirm these are out of v1.
4. **Order cancel semantics.** Legacy moves the row to `orders_deleted` and runs
   partner credit/recover. v1 = local status flag + log only. Confirm a soft
   "cancelled" state is acceptable (and whether the imported table has a column
   for it, else use `metadata`).
5. **Insurance cancel-reason storage.** Add a `cancel_reason` column to
   `insurance_policy`, or fold the reason into `status_message`? (Recommend
   `status_message` to avoid a schema change.)
6. **Auth & initiator.** No auth in claude-test; `initiator`/`by_user`/log
   actors default to `null` until auth exists (same as customer-admin-suite).

---

## 7. Suggested build order
1. **Confirm imported schemas** → update `.claude/database.md`; add
   `Order`/`Subscription`/`OrderAdjustment` models (correct `$table`/PK/
   timestamp flags + `cart` accessor).
2. **Insurance cancel-reason** (smallest; finishes an existing feature; proves
   the dialog+confirm pattern).
3. **Subscription List + View** (per-customer; wires into existing
   `CustomerProfileCenter`; standalone `/subscriptions/:id`).
4. **Subscription Edit** (next-shipment + deactivate w/ reason).
5. **Order List + View** (standalone `/orders` + `/orders/:id`; cart line items).
6. **Order Actions** (cancel + adjustment).

See `tasks.md` for the itemized checklist.
