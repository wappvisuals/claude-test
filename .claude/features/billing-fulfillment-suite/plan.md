# Feature Plan — Billing & Fulfillment Suite

Continuation of the order/subscription work (`store-order-subscription-suite`),
porting the **invoicing, payments, future-orders, and remaining order/sub
actions** from the legacy backend (`C:\laragon\www\backend` — CodeIgniter
routing + Eloquent + Fractal) into the `claude-test` stack (Laravel 12 REST API
under `backend/` + React 19 SPA under `frontend/`).

Read first: `.claude/features/store-order-subscription-suite/plan.md` and
`.claude/features/customer-admin-suite/plan.md` — they establish the conventions
this plan reuses (controller/service/resource/hook/page pattern, `ListView`
primitives, `ConfirmDialog`, the "local-DB behind a gateway stub" treatment of
absent partner/email APIs, sentinel-date normalization, `initiator`=null until
auth).

Features (this suite):
1. **Future Orders** — list queued future-order jobs per subscription; trigger
   generate manually; skip / reschedule a queued job; cancel a queued job.
2. **Invoices** — list per order; invoice detail view; change due date;
   regenerate payment link; view reminder history.
3. **Payments** — list per invoice; add a payment manually.
4. **Order Actions (cont.)** — refund (full + partial per line item); mark
   returned; resend order confirmation email; add internal note.
5. **Subscription Actions (cont.)** — reactivate a deactivated sub; set / unset
   final-invoice flag; view sub event log.

---

## 1. How it works in the legacy backend (scan results)

| Concern | Legacy location |
|---|---|
| Invoices | `Modules/Billing/Controllers/API/InvoiceAPI.php`, `Services/InvoiceService.php`, `Models/Invoice.php` |
| Payments | `Modules/Billing/Controllers/API/PaymentAPI.php`, `Services/PaymentService.php`, `Models/Payment.php`, `Models/PaymentResult.php` |
| Refunds | `Modules/Billing/Services/PaymentRefundService.php`, `CreditNoteService.php`, `Models/{CreditNote,PaymentRefundLog}.php` |
| Future orders | `Modules/Store/Services/FutureOrderService.php`; queued via `Modules/Worker/Models/Job.php` (`jobs` table) |
| Order notify / return | `Modules/Store/Services/OrderNotificationService.php`; `OrderService::processReturnTypeUpdate()`; `OrderAPI::{sendMail,updateReturnType}` |
| Sub actions | `Modules/Store/Services/SubscriptionService::{handleAction,handleFinalInvoiceUpdate}`; event log via `Modules/Transaction/Models/EventLog.php` (`event_log`) + `Log.php` |
| Routes | `Billing/routes.php`, `Worker/routes.php`, `Store/routes.php` |

Legacy patterns to **translate, not copy** (same as prior suites): CI routes →
`routes/api.php`; Fractal datatable lists → `->paginate()` `{data,links,meta}`;
Fractal `Item` → API Resource `{data}`; `AuthenticateService` + `RequestValidator`
→ `$request->validate()`; partner/email side effects → **local-DB behind stub
interfaces**.

### Key legacy behaviours captured

**Future Orders** — `FutureOrderService`:
- `generateForSubscription($subId, $batchNo, $startDate)` and
  `createFutureOrders($payload, $batchNo)` create pre-generated `orders` ahead
  of time (`orders.is_pre_generated`), governed by `canGenerate()`,
  `shouldBlockCreation()`, product intervals & churn date.
- Work is **queued in the worker `jobs` table** (`Worker/Models/Job.php`:
  `batch, entity_id, service, method, partner, payload, status
  (queued/running/failed/done), priority, execute_at, available_at`).
- `deleteForSubscription($subId)` credits/removes future orders (used by
  `SubscriptionAPI::creditFutureOrders`).
- Worker job admin: `WorkerAPI::{getJobs,rerunJob,deleteJob}` (list / rerun /
  delete queued jobs). This is the model for **list / trigger / skip / cancel**.

**Invoices** — `InvoiceService` + `InvoiceAPI`:
- `getByOrderId($id)` / `getDetails($id)` — invoice for an order.
- `alterDueDate($id, $dueDate)` — fires `InvoiceUpdated` partner event, then
  updates the local `invoices.due_date`.
- `alterPaymentLink($id)` — fires `InvoiceUpdated('alter_payment_link')`,
  stores the returned link in `invoices.metadata.payment_link`.
- `getRemindersList($id)` — reminder history from `workflow_logs`
  (`WorkflowLogTransformer`).
- `withdraw`, `sendMail`, file download — partner-backed.
- `Invoice` model: `invoice_id`, `provider` (zoho/riverty/capway/…),
  `total`, `balance`, `date`, `due_date`, `status` (active/deleted),
  `metadata` json; relations `order()`, `payments()` (HasManyThrough),
  `paymentResults()`, `customer()`, `logs()`, `creditApplications()`.

**Payments** — `PaymentService` + `PaymentAPI`:
- `getList()/getDetails()`; `add($data, $source)` creates `payments` rows and
  enqueues a `GET_RESULT` job (partner reconciliation). `submitRefund()` →
  `PaymentRefundService`.
- `Payment` model: `remote_payment_id, invoice_id, sub_account_id,
  customer_id, payer_name, reference, sum, date, source, is_processed`.
- `PaymentResult`: `payment_id, invoice_id, amount, rebate, balance, status
  (fully_matched/…/refunded), is_sent`.

**Refunds** — `PaymentRefundService::refund($data)` branches
(refundPayment / refundDuplicate / refundCredit / refundOldRebate) and calls
partner gateways (Capway etc.); `CreditNote` (`credit_note_id`, `total`,
`status open/closed/refunded/partially_refund`).

**Order actions (cont.)**
- *Mark returned* — `OrderService::processReturnTypeUpdate($id, 'set'|'unset')`;
  return state derived from a `Log` row (`type=return_order`).
- *Resend confirmation* — `OrderNotificationService::{previewConfirmation,
  sendConfirmation}` (template + SendGrid).
- *Internal note* — **no dedicated legacy feature found**; the closest is the
  `Transaction\Log` audit rows. Treated as **new** here (see §4.4).

**Subscription actions (cont.)**
- *Reactivate* — `SubscriptionService::handleAction($id, 'restart')`: clears
  `date_cancelled/churned/inactivated` + `cancel_*`, sets `active=true`.
- *Final invoice* — `handleFinalInvoiceUpdate($id, 'set'|'unset', $data)` +
  `SubscriptionAPI::updateFinalInvoice`; toggles `subscriptions.final_invoice`.
- *Event log* — `EventLog` (`event_log`: `date_added, user_id, ref, prod_id,
  type, data, sub_id, initiator`) + `Transaction\Log` (sub_cancel /
  sub_inactivate / set_final_invoice …). Surfaced via `SubscriptionTransformer`
  `includeLogs` / `includeEventLogs`.

---

## 2. Target architecture (claude-test conventions)

Identical to the prior suites:

| Concern | claude-test location |
|---|---|
| Controllers | `backend/app/Http/Controllers/Api/` |
| Services | `backend/app/Services/` |
| Models | `backend/app/Models/` |
| API Resources | `backend/app/Http/Resources/` |
| Routes | `backend/routes/api.php` |
| FE components | `frontend/src/components/{invoices,payments,future-orders,orders,subscriptions}/` |
| FE hooks / types / api / routes | `frontend/src/{hooks,types,lib/api.ts,App.tsx}` |

Lists → `->paginate()` `{data,links,meta}`; single → `new XResource()` `{data}`.
Existing anchors to extend: **OrderViewPage** (refund / return / resend / note /
invoices+payments panels) and **SubscriptionViewPage** (reactivate / final
invoice / event log) from `store-order-subscription-suite`.

---

## 3. Database — IMPORTANT

Verified in the app DB (`test`) vs legacy (`gracewel_grace`):

- ✅ **`invoices` already exists in `test`** (full schema: `invoice_id`,
  `remote_invoice_id`, `sub_account_id`, `customer_id`, `region_code`,
  `gothia_account`, `total`, `balance`, `date`, `due_date`, `tax_date`,
  `exchange_rate`, `provider` enum, `owner` enum, `metadata` longtext,
  `status` enum(active,deleted), `tax_status`, timestamps). **No model yet.**
- ❌ **Missing from `test`, present in `gracewel_grace` → import:**
  - `payments` (`id, remote_payment_id, invoice_id, sub_account_id,
    customer_id, bank_account_id, payer_name, reference, sum, date, source,
    is_processed, timestamps`)
  - `payment_results` (`id, payment_id, invoice_id, remote_payment_id, amount,
    rebate, balance, status enum, is_sent, timestamps`)
  - `credit_notes` (`id, credit_note_id, credit_note_number, total, status
    enum(open,closed,refunded,partially_refund), timestamps`)
  - `workflow_logs` (`id, workflow_id, template_id, customer_id, batch,
    payload, response, status, created_at`) — **reminder history**
  - `event_log` (`id, date_added, user_id, ref, prod_id, type enum, company_type,
    data, sub_id, initiator`) — **sub event log**

### ⚠️ Future-orders job table — name collision
The legacy worker queue lives in `jobs` (`batch, entity_id, service, method,
partner, payload, status(queued/running/failed/done), priority, execute_at,
available_at, …`). **`test` already has a `jobs` table — but it's Laravel's
queue** (`id, queue, payload, attempts, reserved_at, available_at, created_at`),
a different schema. So we **cannot** reuse `jobs` for future-order jobs.

**Decision (proposed):** create a dedicated **`future_order_jobs`** table
(`id, subscription_id, batch, status enum(queued,done,failed,skipped,cancelled),
payload json, execute_at datetime, created_at, updated_at`) — a focused subset
of the legacy worker schema scoped to future orders. (Alt: import legacy `jobs`
as `worker_jobs`.) Confirm in §6.

**Order internal notes / return / refund-state**: no dedicated legacy tables in
scope. Store locally on the order — `orders.metadata` (`notes[]`, `returned`,
`return_type`) — mirroring how `store-order-subscription-suite` stored the
cancel flag. (Alt: a small `order_notes` table — see §6.)

> Confirm all imported column types and record them in `.claude/database.md`
> before building (add an "Billing tables" section).

---

## 4. Per-feature plans

### Feature 1 — Future Orders
**Goal:** per-subscription list of queued future-order jobs; trigger generate;
skip/reschedule; cancel.

**Backend**
- `app/Models/FutureOrderJob.php` → `future_order_jobs` (casts `payload`=>array,
  `execute_at`=>datetime; `subscription()` relation).
- `app/Services/FutureOrderService.php` (local adaptation — no worker daemon):
  - `listForSubscription($subId)` — queued/upcoming jobs, newest first.
  - `generate($subId)` — create queued job rows for the sub's upcoming cycles
    (simplified: next N shipments from `next_shipment` + product interval;
    **drop** legacy churn/canGenerate complexity in v1, behind a
    `FutureOrderGeneratorInterface` stub so real generation can be wired later).
  - `reschedule($jobId, $executeAt)` — update `execute_at`.
  - `skip($jobId)` — status=skipped.
  - `cancel($jobId)` — status=cancelled (or delete).
- `FutureOrderJobResource`; `FutureOrderController`:
  - `GET    /api/subscriptions/{id}/future-orders`
  - `POST   /api/subscriptions/{id}/future-orders/generate`
  - `PATCH  /api/future-orders/{jobId}` `{execute_at}` (reschedule)
  - `POST   /api/future-orders/{jobId}/skip`
  - `DELETE /api/future-orders/{jobId}` (cancel)

**Frontend**
- `types/futureOrder.ts`; `lib/api.ts`; `hooks/useFutureOrders.ts`,
  `useFutureOrderActions.ts`.
- `components/future-orders/FutureOrdersCard.tsx` on **SubscriptionViewPage**
  (status chips, execute_at, actions); `FutureOrderRescheduleDialog.tsx`
  (date picker); confirm dialogs for skip/cancel; a "Generate future orders"
  button (confirm).

### Feature 2 — Invoices
**Goal:** list invoices per order; detail view; change due date; regenerate
payment link; reminder history.

**Backend**
- `app/Models/Invoice.php` → `invoices` (PK `id`; casts `total`/`balance`=>float,
  `metadata`=>array; relations `order()` via `invoice_id`→`orders.invoice_no`
  (confirm join key), `customer()`, `payments()`, `reminders()` →
  `workflow_logs`).
- `app/Models/WorkflowLog.php` → `workflow_logs` (reminder history).
- `app/Services/InvoiceService.php`:
  - `listForOrder($orderId)` / `getDetails($id)`.
  - `alterDueDate($id, $dueDate)` — local update (partner `InvoiceUpdated`
    event → **stub**; just set `due_date`).
  - `regeneratePaymentLink($id)` — **stub** returns/sets a local
    `metadata.payment_link` placeholder.
  - `remindersList($id)` — from `workflow_logs`.
- `InvoiceResource`, `InvoiceReminderResource`; `InvoiceController`:
  - `GET  /api/orders/{id}/invoices`
  - `GET  /api/invoices/{id}`
  - `POST /api/invoices/{id}/due-date` `{due_date}`
  - `POST /api/invoices/{id}/payment-link` (regenerate)
  - `GET  /api/invoices/{id}/reminders`

**Frontend**
- `types/invoice.ts`; `lib/api.ts`; `hooks/useOrderInvoices.ts`,
  `useInvoice.ts`, `useInvoiceActions.ts`.
- `components/invoices/InvoicesPanel.tsx` on **OrderViewPage** (list + status +
  balance), `InvoiceViewPage.tsx` (route `/invoices/:id` — detail + reminder
  history + payments), `InvoiceDueDateDialog.tsx`, regenerate-link action.

### Feature 3 — Payments
**Goal:** list payments per invoice; add a payment manually.

**Backend**
- `app/Models/Payment.php` → `payments`; `app/Models/PaymentResult.php` →
  `payment_results` (relation `invoice()`).
- `app/Services/PaymentService.php`:
  - `listForInvoice($invoiceId)`.
  - `addManual($invoiceId, $data)` — create a `payments` row (`source='manual'`,
    `is_processed=true`), optionally a matching `payment_results`
    (status fully_matched) and decrement `invoices.balance`. (Legacy enqueues a
    reconciliation job → **stub**.)
- `PaymentResource`; `PaymentController`:
  - `GET  /api/invoices/{id}/payments`
  - `POST /api/invoices/{id}/payments` `{sum, date, reference?, payer_name?}`

**Frontend**
- `types/payment.ts`; `lib/api.ts`; `hooks/useInvoicePayments.ts`,
  `useInvoicePaymentActions.ts`.
- `components/payments/PaymentsList.tsx` (inside `InvoiceViewPage`),
  `PaymentAddDialog.tsx`.

### Feature 4 — Order Actions (continued)
On **OrderViewPage** action bar / panels.

**Refund (full + partial per line item)**
- BE `RefundService` (local): `refund($orderId, {mode:full|partial, lines:[{rowid,
  amount}], reason})`. Records refund rows in `payment_results`
  (status=refunded) and/or a `credit_notes` row; writes refund detail to
  `orders.metadata.refunds[]`. Partner refund gateway absent → behind
  `RefundGatewayInterface` stub.
  - `POST /api/orders/{id}/refund`
- FE `OrderRefundDialog.tsx` — full vs. per-line-item amounts (reuse the line
  items already on `OrderViewPage`), reason; confirm.

**Mark returned**
- BE `OrderService::setReturn($id, 'set'|'unset', {type})` → `orders.metadata.
  returned` + `return_type`.
  - `PATCH /api/orders/{id}/return/{set|unset}`
- FE button + `OrderReturnDialog.tsx` (return type) on OrderViewPage.

**Resend confirmation email**
- BE `OrderNotificationService` **stub**: `resendConfirmation($id)` records a
  local log/event (no SendGrid). `POST /api/orders/{id}/resend-confirmation`.
- FE the existing mail icon on OrderViewPage wired to this (confirm dialog).

**Add internal note**
- BE `OrderService::addNote($id, $text)` → append to `orders.metadata.notes[]`
  (`{text, created_at, initiator:null}`); expose `notes` in `OrderResource`.
  - `POST /api/orders/{id}/notes`
- FE `OrderNotesPanel.tsx` (list + add) on OrderViewPage.

### Feature 5 — Subscription Actions (continued)
On **SubscriptionViewPage**.

**Reactivate**
- BE `SubscriptionService::reactivate($id)` — clear `cancel_*` + `date_cancelled/
  churned/inactivated`, set `active=1`. `POST /api/subscriptions/{id}/reactivate`.
- FE "Reactivate" button (shown when inactive) + confirm.

**Set / unset final invoice**
- BE `SubscriptionService::setFinalInvoice($id, 'set'|'unset', $data)` — toggle
  `subscriptions.final_invoice` (set = date; unset = null).
  `POST /api/subscriptions/{id}/final-invoice/{set|unset}`.
- FE toggle/button + `FinalInvoiceDialog.tsx` (date when setting).

**View event log**
- BE `app/Models/EventLog.php` → `event_log` (`sub_id` relation);
  `SubscriptionService::eventLog($id)` merges `event_log` (by `sub_id`) — and
  optionally `Transaction\Log` if imported — newest first.
  `GET /api/subscriptions/{id}/event-log`.
- FE `SubscriptionEventLog.tsx` (timeline: type, ref, data, date, initiator) on
  SubscriptionViewPage.

---

## 5. Shared / cross-cutting work
- **Reuse** existing primitives — `ListView`, `ConfirmDialog`, `Dialog`,
  `Input`, `Textarea`, `Button`, `Skeleton`, date-sentinel + money helpers.
  Do not re-create them.
- **Stub interfaces** for absent externals (consistent with insurance/sinfrid):
  `FutureOrderGeneratorInterface`, `InvoicePartnerGatewayInterface`,
  `RefundGatewayInterface`, `OrderMailerInterface` — all no-op/local so partner
  + email wiring can land later without touching the UI.
- **OrderViewPage** gains: Invoices panel, Payments (via invoice), Refund /
  Return / Resend / Notes actions. **SubscriptionViewPage** gains: Future
  Orders card, Reactivate, Final-invoice, Event log.
- **Money / status tone** helpers shared across invoice/payment/refund.
- `initiator` / actors = `null` until auth exists.

---

## 6. Open decisions (need product/owner input)
1. **Future-order job storage.** Create `future_order_jobs` (recommended,
   focused) vs. import legacy `jobs` as `worker_jobs` (full worker schema). And:
   should "trigger generate" also create real pre-generated `orders` rows, or
   only queue job rows in v1?
2. **Invoice↔order join key.** Confirm how invoices link to orders in this DB:
   `invoices.invoice_id` ↔ `orders.invoice_no`? or `sub_account_id`? (Legacy
   uses `getByOrderId` + a pivot). Needed before the per-order invoice list.
3. **Refund model.** Local refund recording target: `payment_results`
   (status=refunded) + `credit_notes`, or a simpler `orders.metadata.refunds[]`?
   Confirm partial-per-line semantics (amount caps per line).
4. **Internal notes / return state storage.** `orders.metadata` (recommended,
   no new table) vs. a dedicated `order_notes` table.
5. **Email / partner side effects out of v1.** Resend-confirmation, invoice
   partner `InvoiceUpdated` events, payment reconciliation jobs, real payment
   links, and all Capway/Riverty/Zoho calls are **stubbed** (local-only).
   Confirm acceptable.
6. **Imported schemas.** Confirm exact columns of `payments`, `payment_results`,
   `credit_notes`, `workflow_logs`, `event_log` after import; update
   `.claude/database.md`.
7. **Auth / initiator** — null until auth lands (same as prior suites).

---

## 7. Suggested build order
1. **Confirm imports + schemas** → `database.md`; create `Invoice`, `Payment`,
   `PaymentResult`, `WorkflowLog`, `EventLog`, `FutureOrderJob` models.
2. **Subscription Actions (cont.)** — smallest, extends existing
   SubscriptionViewPage: reactivate, final-invoice, event log.
3. **Invoices** — model + per-order list + detail page + due-date + payment-link
   + reminders.
4. **Payments** — list per invoice + add manual (on InvoiceViewPage).
5. **Order Actions (cont.)** — notes + mark-returned + resend (stub) + refund
   (full/partial) on OrderViewPage.
6. **Future Orders** — `future_order_jobs` + generator stub + per-sub card.

See `tasks.md` for the itemized checklist.
