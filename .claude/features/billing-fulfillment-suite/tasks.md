# Tasks — Billing & Fulfillment Suite

Status: [ ] todo · [~] in progress · [x] done

> **DONE (this round) — full stack, verified.** All tables were imported
> (`payments`, `payment_results`, `credit_notes`, `workflow_logs`, `event_log`)
> and `future_order_jobs` created via migration. Backend: models, services,
> resources, controllers, routes for all 5 features — Pint-clean, smoke-tested
> against `test` DB (reads + rolled-back mutations). Frontend: types, api fns,
> hooks, dialogs/panels wired into the existing OrderViewPage &
> SubscriptionViewPage + new InvoiceViewPage (`/invoices/:id`); `tsc --noEmit`
> clean + `npm run build` passes. Confirmed joins: `invoices.invoice_id` =
> `orders.id`; payments via `payment_results.invoice_id` = `invoices.id`;
> reminders by `customer_id`; event log by `sub_id`. Partner/email side effects
> stubbed (local); `initiator`/actors null (no auth).

> Scope: Future Orders, Invoices, Payments, Order Actions (refund / return /
> resend / notes), Subscription Actions (reactivate / final-invoice / event log).
> `invoices` already exists in `test`; import `payments`, `payment_results`,
> `credit_notes`, `workflow_logs`, `event_log` from `gracewel_grace`. Future-order
> jobs need a new `future_order_jobs` table (the `test` `jobs` table is Laravel's
> queue — name collision). All partner/email side effects are stubbed (local-only).
> `initiator`/actors null (no auth). Extends the existing OrderViewPage &
> SubscriptionViewPage from `store-order-subscription-suite`.

## 0. Shared infrastructure
- [x] Import + confirm schemas: `payments`, `payment_results`, `credit_notes`,
      `workflow_logs`, `event_log`; create `future_order_jobs`; update
      `.claude/database.md` ("Billing tables" section)
- [x] Models: `Invoice`, `Payment`, `PaymentResult`, `WorkflowLog`, `EventLog`,
      `FutureOrderJob` (casts, relations)
- [~] Stub externals — implemented as **local service methods** (no real
      partner/mailer); formal `*Interface` files not extracted (deferred — wire
      when a real partner/mailer lands)
- [x] Resolve Open Decisions in plan §6 (job storage, invoice↔order key, refund
      model, notes storage, stubbed externals, schemas, auth)

## 1. Subscription Actions (continued)
- [x] BE: `SubscriptionService::reactivate($id)` (clear cancel fields, active=1)
- [x] BE: `SubscriptionService::setFinalInvoice($id, set|unset, data)`
- [x] BE: `SubscriptionService::eventLog($id)` (from `event_log` by `sub_id`)
- [x] BE: routes `POST /subscriptions/{id}/reactivate`,
      `POST /subscriptions/{id}/final-invoice/{set|unset}`,
      `GET /subscriptions/{id}/event-log`; `EventLogResource`
- [x] FE: api fns + `useSubscriptionActions` (reactivate/final-invoice),
      `useSubscriptionEventLog`
- [x] FE: Reactivate button + `FinalInvoiceDialog` + `SubscriptionEventLog`
      on `SubscriptionViewPage`

## 2. Invoices
- [x] BE: `Invoice` + `WorkflowLog` models; `InvoiceService`
      (listForOrder/getDetails/alterDueDate/regeneratePaymentLink/remindersList)
- [x] BE: `InvoiceResource`, `InvoiceReminderResource`; `InvoiceController`
- [x] BE: routes — `GET /orders/{id}/invoices`, `GET /invoices/{id}`,
      `POST /invoices/{id}/due-date`, `POST /invoices/{id}/payment-link`,
      `GET /invoices/{id}/reminders`
- [x] FE: `types/invoice.ts`, api fns, `useOrderInvoices`, `useInvoice`, `useInvoiceActions`
- [x] FE: `InvoicesPanel` on `OrderViewPage`; `InvoiceViewPage` (route
      `/invoices/:id`); `InvoiceDueDateDialog`; regenerate-link action

## 3. Payments
- [x] BE: `Payment` + `PaymentResult` models; `PaymentService`
      (listForInvoice/addManual — updates `invoices.balance`)
- [x] BE: `PaymentResource`; routes `GET /invoices/{id}/payments`,
      `POST /invoices/{id}/payments`
- [x] FE: `types/payment.ts`, api fns, `useInvoicePayments`, `useInvoicePaymentActions`
- [x] FE: `PaymentsList` + `PaymentAddDialog` on `InvoiceViewPage`

## 4. Order Actions (continued)
- [x] BE: `RefundService::refund($orderId, {mode, lines[], reason})`
      (payment_results=refunded / credit_notes / metadata.refunds[]); stub gateway
- [x] BE: `OrderService::setReturn($id, set|unset, {type})` (metadata.returned)
- [x] BE: `OrderNotificationService::resendConfirmation($id)` (stub mailer)
- [x] BE: `OrderService::addNote($id, text)` (metadata.notes[]); expose in `OrderResource`
- [x] BE: routes — `POST /orders/{id}/refund`, `PATCH /orders/{id}/return/{set|unset}`,
      `POST /orders/{id}/resend-confirmation`, `POST /orders/{id}/notes`
- [x] FE: api fns + `useOrderActions` extensions
- [x] FE: `OrderRefundDialog` (full + per-line), `OrderReturnDialog`,
      resend confirm, `OrderNotesPanel` on `OrderViewPage`

## 5. Future Orders
- [x] BE: `FutureOrderJob` model; `FutureOrderService`
      (listForSubscription/generate/reschedule/skip/cancel) + generator stub
- [x] BE: `FutureOrderJobResource`; `FutureOrderController`
- [x] BE: routes — `GET /subscriptions/{id}/future-orders`,
      `POST /subscriptions/{id}/future-orders/generate`,
      `PATCH /future-orders/{jobId}`, `POST /future-orders/{jobId}/skip`,
      `DELETE /future-orders/{jobId}`
- [x] FE: `types/futureOrder.ts`, api fns, `useFutureOrders`, `useFutureOrderActions`
- [x] FE: `FutureOrdersCard` + `FutureOrderRescheduleDialog` + skip/cancel
      confirms + Generate button on `SubscriptionViewPage`

## 6. Verification
- [x] `./vendor/bin/pint` (backend format)
- [x] `npx tsc --noEmit` + `npm run build` (frontend)
- [x] Smoke-test each feature against imported data (reads + rolled-back mutations)
- [ ] Visual check in the running app (not run by me — needs the dev servers)
