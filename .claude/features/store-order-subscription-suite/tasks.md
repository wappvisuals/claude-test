# Tasks — Store Order & Subscription Suite

Status: [ ] todo · [~] in progress · [x] done

> **Progress (this round):** All **backend** for every feature is built,
> Pint-clean, and smoke-tested against live `test` DB (customer 16: 33 subs / 59
> orders; mutations verified in a rolled-back transaction). **Frontend: the two
> existing profile lists (Subscriptions + Orders tabs in `CustomerProfileCenter`)
> are now populated with live data — UI markup unchanged.** Standalone pages
> (Order List `/orders`, Order View `/orders/:id`, Subscription View
> `/subscriptions/:id`) and the action dialogs (cancel/adjust/edit/deactivate/
> insurance-cancel-reason) are wired on the **backend + api client** but their
> dedicated React screens/dialogs are not built yet (no existing UI for them).
> `initiator`/actors are null (no auth).
>
> **Grouping round:** the per-customer endpoints now return **grouped** data
> matching the legacy `CustomerProfileService`: subscriptions grouped by
> `remote_id` (single-item groups collapse to standalone rows, sequence badges
> on grouped members) with **commitment progress** (`order_count` incl. deleted
> orders / `product.time+1`); orders grouped by **region-specific product name**
> (`products_international`). Added a **brand filter** (`?brand=`, via
> `products.brand`) to both, wired as a dropdown in the Subscriptions filter
> strip and the Orders header. New models: `ProductInternational`, `OrderDeleted`.
> Per-customer responses are now `{data: groups[], meta}` (not the paginator
> envelope). Frontend renders group headers, sequence badges, status pills, and
> the commitment progress bar — backend + FE build verified.

> Scope: Insurance Policies (finish: cancel-reason), Order List, Order View,
> Subscription List, Subscription View, Order Actions, Subscription Edit.
> Tables `orders` / `subscriptions` / `order_adjustments` are **imported** (no
> migrations); `insurance_policy` already exists. Reuse customer-admin-suite
> primitives (`ListView`, `ConfirmDialog`, `Select`, `SearchBar`). No auth →
> `initiator`/actors null. All partner-API side effects are out of v1.

## 0. Shared infrastructure
- [x] Confirm imported column names/types for `orders`, `subscriptions`,
      `order_adjustments`, `products`, `subscription_inactivation_menus`,
      `product_fees`, `products_component`, `subscriptions_deleted`; documented
      in `.claude/database.md` (all 8 verified present in `gracewel_grace`)
- [x] `app/Models/Order.php` (cart unserialize accessor, metadata cast, relations)
- [x] `app/Models/Subscription.php` (relations, cancelReason FK)
- [x] `app/Models/OrderAdjustment.php`, `Product.php` (+ display_name),
      `ProductComponent.php`, `SubscriptionInactivationMenu.php`
- [x] Date-sentinel `'0000-00-00' → null` normalization (in resources)
- [ ] `app/Models/Order.php` (`$table=orders`, PK `id`, `timestamps=false`,
      `metadata`⇒array, `cart` unserialize accessor, `customer/subscription/
      adjustments` relations)
- [ ] `app/Models/Subscription.php` (`$table=subscriptions`, casts, `customer/
      product/orders/inactivationMenu` relations; sentinel-date handling)
- [ ] `app/Models/OrderAdjustment.php` (`$table=order_adjustments`,
      `UPDATED_AT=null`, `metadata`⇒array, `order/user` relations)
- [ ] Date-sentinel `'0000-00-00' → null` helper (resource-level)
- [ ] Resolve Open Decisions in plan §6 (schemas, cart shape, scope, cancel
      semantics, insurance reason storage, auth)

## 1. Insurance Policies (finish — cancel with reason)
- [x] BE: `InsurancePolicyService::handleCancellation` persists `reason`
      (folded into `status_message` — no schema change, plan §6.5)
- [x] BE: cancel endpoint validates `endDate` + `reason`
- [x] FE: insurance cancel dialog now has end-date **+ reason** (enhanced the
      existing inline dialog in `InsurancePoliciesCard`; `cancelPolicy` 3-arg)
- [x] FE: `cancelPolicy(id, endDate, reason)` in `lib/api.ts`
- [ ] BE: document external-API pattern (local record + remote call in one
      transaction) in `InsurancePolicyService` + `database.md`
- [x] (existing) list/create/cancel/sync/delete + `InsurancePoliciesCard`

## 2. Subscription List (per customer)
- [x] BE: `SubscriptionService::getListForCustomer`
- [x] BE: `app/Http/Resources/SubscriptionResource.php` (status, product,
      next_shipment, pre-finance, commitment, days)
- [x] BE: `SubscriptionController` — `GET /customers/{id}/subscriptions`
- [x] FE: `types/subscription.ts`, `lib/api.ts` `fetchCustomerSubscriptions`,
      `hooks/useCustomerSubscriptions.ts`
- [x] FE: wired `CustomerProfileCenter.tsx` `SubscriptionsContent` to live data
      (existing markup preserved)
- [x] FE: rows clickable → `/subscriptions/:id`

## 3. Subscription View
- [x] BE: `SubscriptionService::getDetails`; detail resource (active,
      payment_type, next_shipment, pre_finance_count + cancel block)
- [x] BE: `GET /subscriptions/{id}`
- [x] FE: `lib/api.ts` `fetchSubscription`; `hooks/useSubscription.ts`
- [x] FE: `components/subscriptions/SubscriptionViewPage.tsx`; route `/subscriptions/:id`

## 4. Subscription Edit
- [x] BE: `SubscriptionService::alter` (change `next_shipment`)
- [x] BE: `SubscriptionService::deactivate($id, reason)` (active=0 + cancel_reason + dates)
- [x] BE: `PATCH /subscriptions/{id}`, `POST /subscriptions/{id}/deactivate`
- [x] FE: `lib/api.ts` `updateSubscription`, `deactivateSubscription`
- [x] FE: `SubscriptionEditDialog.tsx` / `SubscriptionDeactivateDialog.tsx` (on view page)

## 5. Order List
- [x] BE: `OrderService::getList` (status + date-range + search filters, paginate)
- [x] BE: `app/Http/Resources/OrderResource.php` (list + detail shapes)
- [x] BE: `OrderController` — `GET /orders` + `GET /customers/{id}/orders`
- [x] FE: `types/order.ts`, `lib/api.ts` `fetchOrders`/`fetchCustomerOrders`,
      `hooks/useCustomerOrders.ts`
- [x] FE: wired `CustomerProfileCenter.tsx` `OrdersContent` to live data
      (existing markup preserved)
- [x] FE: standalone `components/orders/OrderListPage.tsx` (`useOrders`) +
      `/orders` route + sidebar `Orders` entry (status `Select` + date range + search)

## 6. Order View
- [x] BE: `OrderService::getDetails`; detail resource (customer, **line items
      from cart**, payment block, shipment block, totals, adjustments)
- [x] BE: `GET /orders/{id}`
- [x] FE: `lib/api.ts` `fetchOrder`
- [x] FE: `hooks/useOrder.ts`, `components/orders/OrderViewPage.tsx`; route `/orders/:id`

## 7. Order Actions
- [x] BE: `OrderService::cancel($id, reason)` (metadata flag + reason; no partner side effects)
- [x] BE: `OrderAdjustmentService::store` (type fee|discount, signed adj_total, comment, origin)
- [x] BE: `app/Http/Resources/OrderAdjustmentResource.php`
- [x] BE: `POST /orders/{id}/cancel`, `POST /orders/{id}/adjustments`
- [x] FE: `lib/api.ts` `cancelOrder`, `addOrderAdjustment`
- [x] FE: `OrderCancelDialog.tsx` / `OrderAdjustmentDialog.tsx` on `OrderViewPage`

## 8. Verification
- [x] `./vendor/bin/pint` (backend format — style-only fixes applied)
- [x] `npm run build` (frontend typecheck/build — passes)
- [x] Smoke test each backend feature against `test` DB (reads + rolled-back mutations)
- [x] `npx tsc --noEmit` — no type errors in app code (vite build alone skips types)
- [x] Standalone pages + dialogs verified end-to-end (order/sub detail, cancel,
      adjustment, edit, deactivate) via rolled-back HTTP transaction
- [ ] Visual check in the running app
