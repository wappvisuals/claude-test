# Database Reference

**Connection:** `mysql` → `gracewel_grace`
**Engine:** MariaDB 10.11 / InnoDB
**Sources:** `test.sql` (HeidiSQL dump), `customer_organizations.sql` (HeidiSQL dump)

> This file must be read before planning or implementing any feature that touches the database.
> Update this file whenever a new table is added or an existing schema changes.

---

## Application Tables

### `customer_profile`

Primary key used by Eloquent: `to_user` (UNIQUE, business key). The table also has an `id` AUTO_INCREMENT column but it is not the Eloquent primary key.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(11) AUTO_INCREMENT | NO | — | Physical PK (not used by Eloquent) |
| `to_user` | int(11) | NO | — | **Eloquent PK** — UNIQUE |
| `organization_id` | varchar(10) | YES | NULL | FK → `customer_organizations.id` (org.id is varchar(64) but this column caps at 10) |
| `status` | tinyint(1) | NO | — | API maps to: 'active' / 'inactive' / 'blocked' |
| `first_visit` | tinyint(1) | NO | 0 | |
| `first_name` | varchar(64) | NO | '' | |
| `last_name` | varchar(64) | YES | '' | |
| `pers_nr` | varchar(40) | NO | '' | Personal / SSN number |
| `sex` | enum('male','female','unknown') | NO | 'unknown' | **Not M/F — full words** |
| `careof` | varchar(100) | YES | '' | Care of (address line) |
| `adress` | varchar(256) | YES | '' | Street address |
| `post_nr` | varchar(11) | YES | '' | Postal code |
| `ort` | varchar(64) | YES | '' | City |
| `tel` | varchar(20) | YES | '' | Primary phone |
| `date_added` | datetime | YES | NULL | |
| `email` | varchar(64) | YES | NULL | |
| `alternative_tel` | varchar(20) | YES | '' | |
| `alternative_email` | varchar(64) | YES | '' | |
| `want_newsletter` | tinyint(1) | YES | 1 | |
| `comments` | text | YES | NULL | Free-text / structured log |
| `gothia_account` | int(2) | YES | 1 | 1=rating, 2=no rating, 3=contract_time |
| `ledgers` | longtext (JSON) | YES | NULL | JSON-valid array |
| `blocked_fees` | longtext (JSON) | YES | NULL | JSON-valid array |
| `reminders` | tinyint(1) | YES | 1 | |
| `do_not_call` | tinyint(1) | YES | 0 | |
| `difficult_customer` | tinyint(1) unsigned | YES | 0 | |
| `region_code` | char(2) | NO | 'SE' | ISO 3166-1 alpha-2: SE, FI, NO, EE, LV, LT, PL |
| `language` | char(2) | YES | NULL | |
| `birthdate` | varchar(20) | YES | '' | |
| `sync` | tinyint(1) | NO | 1 | |
| `credit_check` | int(1) | YES | 1 | |
| `updated_at` | timestamp | YES | current_timestamp() | |

**Indexes:**
- UNIQUE: `to_user`
- Regular: `pers_nr`, `tel`, `alternative_email`, `alternative_tel`, `post_nr`, `do_not_call`, `difficult_customer`, `region_code`, `credit_check`, `sex`, `first_name`, `last_name`, `ort`, `email`, `date_added`, `(to_user, region_code)`
- FULLTEXT: `adress`, `(first_name, last_name)`, `(first_name, last_name, adress)`, `email`, `(first_name, last_name, email, alternative_email)`, `(first_name, last_name, adress, email, alternative_email)`, `(adress, email, alternative_email)`

**FK:** `organization_id` → `customer_organizations.id`

---

### `customer_profile_extras`

Extended per-customer data. One row per customer.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(11) AUTO_INCREMENT | NO | — | PK |
| `customer_id` | int(11) | NO | — | FK → `customer_profile.to_user` |
| `date_cancelled` | datetime | YES | NULL | |
| `school_start` | date | YES | '0000-00-00' | |
| `block_email` | tinyint(1) | YES | 0 | |
| `block_gdpr` | tinyint(1) | NO | 0 | |
| `block_dm` | tinyint(1) | NO | 0 | |
| `block_trials` | tinyint(1) unsigned | NO | 0 | Block from trials |
| `trial_reducer` | tinyint(1) | NO | 0 | |
| `trial_xantan` | tinyint(1) | NO | 0 | |
| `trial_bredsp` | tinyint(1) | NO | 0 | |
| `trial_sinfrid` | tinyint(1) | NO | 0 | |
| `trial_date` | date | YES | NULL | |
| `migration_date` | date | YES | NULL | |
| `has_purchased` | tinyint(1) | NO | 0 | |
| `visited_introduction` | date | YES | NULL | |
| `points_accumulated` | int(11) | NO | 0 | |
| `points_credits` | int(11) | NO | 0 | |
| `points_from_friends` | int(11) | NO | 0 | |
| `points_from_purchases` | int(11) | NO | 0 | |
| `stowaway` | tinyint(1) | NO | 0 | |
| `parcel_machine` | int(20) | YES | 0 | |
| `parcel_machine_name` | mediumtext | YES | NULL | |
| `payment_preference` | enum('autogiro','b-post','email','sms','paper, no fee','einvoice') | YES | NULL | |
| `delivery_method` | varchar(100) | YES | NULL | |
| `metadata` | longtext | YES | NULL | |
| `date_exported` | timestamp | YES | NULL | |
| `creditclass` | tinyint(1) | YES | NULL | |
| `bisnode_id` | varchar(30) | YES | NULL | |
| `remark_count` | int(11) | YES | NULL | |
| `remarks` | mediumtext | YES | NULL | |
| `amount` | float | YES | NULL | |
| `other_remarks` | varchar(200) | YES | NULL | |
| `household_adults` | int(11) | YES | NULL | |
| `household_children` | int(11) | YES | NULL | |
| `last_open_at` | timestamp | YES | NULL | |

**FK:** `customer_id` → `customer_profile.to_user`

---

### `customer_profile_invoice`

Pivot table: customer ↔ invoices (many-to-many).

| Column | Type | Notes |
|---|---|---|
| `customer_profile_to_user` | int(11) | FK → `customer_profile.to_user` ON DELETE CASCADE |
| `invoice_id` | int(11) | FK → `invoices_old.id` ON DELETE CASCADE |

Composite PK: `(customer_profile_to_user, invoice_id)`

---

### `customer_organizations`

Organisations linked to customers. ~54 rows in production.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | varchar(64) | NO | — | **PK** — org number (e.g. "5569910127"); string, non-incrementing |
| `name` | text | YES | NULL | Organisation name |
| `contact_email` | varchar(100) | YES | NULL | |
| `invoice_email` | varchar(100) | YES | NULL | |
| `created_at` | timestamp | YES | NULL | Managed by Laravel timestamps |
| `updated_at` | timestamp | YES | NULL | Managed by Laravel timestamps |

**Note:** `customer_profile.organization_id` is varchar(10), so only org IDs ≤ 10 chars can be linked to a customer, even though `customer_organizations.id` allows up to 64 chars.

---

## Referenced Tables (not in any dump)

| Table | Referenced By | Notes |
|---|---|---|
| `invoices_old` | `customer_profile_invoice.invoice_id` | Not included in any dump |

---

## Field Constraints Cheatsheet

> Use this when writing validation rules. These are the real DB limits.

| Field | Max length / Type | Validation note |
|---|---|---|
| `first_name` | varchar(64) | max:64 |
| `last_name` | varchar(64) | max:64 |
| `email` | varchar(64) | email\|max:64 |
| `alternative_email` | varchar(64) | email\|max:64 |
| `tel` | varchar(20) | max:20 |
| `alternative_tel` | varchar(20) | max:20 |
| `careof` | varchar(100) | max:100 |
| `adress` | varchar(256) | max:256 |
| `post_nr` | varchar(11) | max:11 |
| `ort` | varchar(64) | max:64 |
| `pers_nr` | varchar(40) | max:40 |
| `region_code` | char(2) | in:SE,FI,NO,EE,LV,LT,PL |
| `sex` | enum | **in:male,female,unknown** (not M/F) |
| `language` | char(2) | max:2 |
| `organization_id` (on customer) | varchar(10) | max:10 — limits which org IDs can be linked |
| `customer_organizations.id` | varchar(64) | max:64 |
| `customer_organizations.name` | text | no length limit |
| `customer_organizations.contact_email` | varchar(100) | email\|max:100 |
| `customer_organizations.invoice_email` | varchar(100) | email\|max:100 |

---

## Store Tables — Orders, Subscriptions, Adjustments

Imported (legacy `gracewel_grace`) for the **store-order-subscription-suite**.
Not Laravel-migrated — bind Eloquent models with explicit `$table`/`$primaryKey`
and the timestamp flags noted below.

### Eloquent binding cheatsheet

| Model → table | PK | Timestamps | Notes |
|---|---|---|---|
| `Order` → `orders` | `id` | **OFF** (`public $timestamps=false`) | `cart`=PHP-serialized text; `metadata`=JSON |
| `Subscription` → `subscriptions` | `id` | **ON** (has `created_at`/`updated_at`) | sentinel `'0000-00-00'` dates → null in resource |
| `OrderAdjustment` → `order_adjustments` | `id` | **`created_at` only** (`const UPDATED_AT = null`) | `metadata`=JSON |
| `Product` → `products` | `prod_id` | n/a | **no `name` column** — see gotcha |
| `SubscriptionInactivationMenu` → `subscription_inactivation_menus` | `id` | n/a | cancel-reason lookup (tree via `parent_id`) |
| `ProductFee` → `product_fees` | `id` | n/a | fee catalog (optional, for fee adjustments) |
| `ProductComponent` → `products_component` | `id` | n/a | SoftDeletes (`deleted_at`); component line items |
| `SubscriptionDeleted` → `subscriptions_deleted` | `id` | ON | deleted-subscription mirror (optional) |

### Gotchas (read before building)
- **`orders.cart` is PHP-`serialize()`d** (text, NOT JSON). Order View line
  items require an `unserialize()` accessor (mirror legacy `BaseOrder`).
- **`orders` has no status/cancelled column.** Legacy "cancel" moves the row to
  `orders_deleted` (not imported). There **is** an `orders.reason` varchar(255)
  column. v1 order-cancel must either (a) import `orders_deleted` and mirror the
  move, or (b) store a cancel flag in `metadata` + populate `reason`. **Open.**
- **`products` has no human name.** Display name comes from
  `products_component.name` or `products_international.*` — `products` only
  carries `prod_id`, `brand`, `plan_type`, `major_group`, intervals, finance
  flags. The Subscription/Order "product" label must resolve via a component/
  international join, not a `products.name`.
- **Subscription sentinel dates**: `next_shipment`, `date_started`, `date_saved`,
  `date_winback` are `NOT NULL` and use `'0000-00-00'`; normalize to null.
- **`subscriptions.cancel_reason` is `int(11)`** → FK to
  `subscription_inactivation_menus.id` (not free text).

---

### `orders`

PK `id`. No timestamp columns. ~1.9M rows.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(11) | NO | — | **PK** |
| `date_added` | datetime | NO | — | order created |
| `date_shipped` | date | NO | — | |
| `date_paid` | date | YES | NULL | |
| `date_purchased` | date | YES | NULL | |
| `url` | varchar(125) | YES | NULL | |
| `by_user` | int(11) | NO | — | FK → `customer_profile.to_user` (customer) |
| `campaign_id` | int(11) | YES | NULL | |
| `cart` | text | NO | — | **PHP-serialized** line items |
| `metadata` | longtext | YES | NULL | JSON |
| `has_prod` | tinyint(1) | NO | — | |
| `has_pack` | tinyint(1) | NO | — | |
| `vat_rate` | decimal(11,2) | YES | 0.00 | |
| `total` | decimal(11,2) | NO | — | |
| `total_vat` | decimal(11,2) | NO | — | |
| `total_excluding_vat` | decimal(11,2) | YES | NULL | |
| `total_with_coupon` | decimal(11,2) | NO | — | |
| `coupon` | varchar(255) | NO | '' | |
| `payment_method` | enum('faktura','kort') | YES | NULL | |
| `is_processed` | tinyint(1) | NO | 0 | payment/fulfilment status |
| `is_shipped` | tinyint(1) | NO | 0 | |
| `is_paid` | tinyint(1) | YES | 0 | |
| `ref` / `ref1` / `ref2` | varchar(255) | NO | '' | |
| `ip` | varchar(15) | YES | '' | |
| `prod_id` | int(11) | NO | — | FK → `products.prod_id` |
| `invoice_no` | varchar(20) | NO | '' | |
| `sub_account_no` | varchar(100) | YES | NULL | |
| `subscription_id` | int(11) | YES | NULL | FK → `subscriptions.id` |
| `gothia_account` | int(11) | YES | NULL | invoice partner ledger |
| `origin` | varchar(255) | YES | NULL | |
| `region_code` | char(2) | NO | 'SE' | |
| `ipartner` | varchar(255) | YES | NULL | |
| `company_name` | enum('sgb','slp') | YES | 'sgb' | |
| `shipment_center` | enum('SE','EE','PL','HK') | YES | 'PL' | shipment info |
| `audiofile_id` | varchar(255) | YES | NULL | |
| `partner` | enum('monitum','defentry') | YES | NULL | |
| `partner_sent` | tinyint(1) | NO | 0 | |
| `parcel_tracking_id` | varchar(30) | YES | NULL | shipment tracking |
| `reason` | varchar(255) | YES | NULL | **usable for cancel reason** |
| `is_pre_financed` | tinyint(1) | NO | 0 | |
| `is_pre_generated` | tinyint(1) | NO | 0 | |
| `event_processed_at` | datetime | YES | NULL | |
| `batch` | varchar(50) | YES | NULL | |

### `subscriptions`

PK `id`. Has `created_at`/`updated_at`. ~400K rows.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(11) | NO | — | **PK** |
| `user_id` | int(11) | NO | — | FK → `customer_profile.to_user` |
| `active` | tinyint(4) | NO | — | 1=active, 0=inactive (status) |
| `cancel_method` | varchar(255) | YES | NULL | |
| `cancel_category` | varchar(255) | YES | NULL | |
| `cancel_reception` | varchar(64) | YES | NULL | |
| `cancel_reason` | int(11) | YES | NULL | FK → `subscription_inactivation_menus.id` |
| `i` | int(11) | NO | — | interval counter |
| `payment_type` | enum('faktura','kort') | YES | NULL | |
| `remote_id` | int(11) | YES | NULL | base order id |
| `subscription_id` | int(11) | NO | 0 | FK → `products.prod_id` (the product) |
| `next_shipment` | date | NO | — | sentinel `'0000-00-00'` |
| `date_started` | date | NO | — | sentinel |
| `date_cancelled` | date | YES | NULL | |
| `date_churned` | date | YES | NULL | |
| `date_inactivated` | date | YES | NULL | |
| `date_restart` | date | YES | NULL | |
| `date_saved` | date | NO | — | sentinel |
| `date_winback` | date | NO | — | sentinel |
| `save_type` | enum('full','pause','price','commitment') | YES | NULL | |
| `wb_type` | enum('full','pause','price','commitment') | YES | NULL | |
| `send_gift` | int(2) | NO | 0 | |
| `ref` | varchar(32) | NO | '' | |
| `ref1` / `ref2` | varchar(65) | NO | '' | |
| `bounces` | int(11) | YES | 0 | |
| `send_premie` | tinyint(3) unsigned | YES | 0 | |
| `return_date` | timestamp | YES | NULL | |
| `post_binding_price` | decimal(11,2) | YES | NULL | |
| `final_invoice` | date | YES | NULL | |
| `ipartner` | varchar(255) | YES | NULL | |
| `exported` | tinyint(3) | NO | 0 | |
| `exported_on` | date | YES | NULL | |
| `is_pre_financed` | int(11) | NO | 0 | **pre-finance flag** |
| `pre_finance_count` | int(11) | NO | 0 | **pre-finance count** |
| `pre_generated_orders` | int(11) | NO | 0 | |
| `batch` | varchar(50) | YES | NULL | |
| `created_at` | datetime | YES | current_timestamp() | |
| `updated_at` | datetime | YES | current_timestamp() | |

### `order_adjustments`

PK `id`. `created_at` only (no `updated_at`). ~65K rows.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(11) | NO | — | **PK** |
| `order_id` | int(11) | YES | NULL | FK → `orders.id` |
| `type` | varchar(100) | YES | NULL | fee / discount / … |
| `metadata` | longtext | YES | NULL | JSON: holds `cart` + `adj_total` |
| `comment` | longtext | YES | NULL | |
| `origin` | varchar(100) | YES | NULL | `manual` / `manual_added_fee` / `manual_remove_fee` |
| `initiator` | int(11) | YES | NULL | FK → `users.id` (null until auth) |
| `created_at` | timestamp | YES | NULL | |
| `orig_origin_temp` | varchar(70) | YES | NULL | |

### `subscription_inactivation_menus`

PK `id`. Cancel-reason lookup (hierarchical via `parent_id`). 390 rows.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(11) | NO | — | **PK** |
| `parent_id` | int(11) | YES | NULL | self-ref (tree) |
| `level` | int(11) | NO | — | depth |
| `sequence` | int(11) | NO | — | order |
| `name` | varchar(100) | NO | — | display label |
| `status` | int(11) | NO | 1 | 1=active |
| `type` | enum('channel','action','category','reason','detail') | YES | NULL | node type |

### `products`

PK `prod_id`. **No `name` column** — resolve display name via
`products_component.name` / `products_international`. ~15K rows.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `prod_id` | int(11) | NO | — | **PK** |
| `time` | int(11) | NO | 0 | commitment length |
| `intervall` | int(5) | NO | 30 | refill interval days |
| `supply_type` | enum('even','upfront') | YES | NULL | |
| `supply_start` | enum('starter_kit','second_package') | NO | 'second_package' | |
| `plan_type` | enum('id-protect-single','-duo','-family','-business') | YES | NULL | |
| `regret_period` | int(11) | YES | NULL | |
| `second_package` | int(5) | NO | 30 | |
| `brand` | enum('grace','shave','dentally','generic','dentle','vialina','zuave','nordicshave','borsta','sinfrid') | YES | NULL | |
| `major_group` | enum('startpackage','rebill','single','fee','installment') | YES | NULL | |
| `cancellation_period` | int(11) | YES | NULL | |
| `is_pre_financed` | int(1) | NO | 0 | |
| `pre_finance_count` | int(11) | NO | 0 | |
| `pre_generated_orders` | int(11) | NO | 0 | |
| `remote_id` | varchar(25) | YES | NULL | |

> (Other columns exist: `antal_kollin`, `multiplier`, `can_be_first`,
> `has_subscription`, `additional_samples`, `is_extension`, `sub_product`,
> `auto_terminate_after_orders`, `auto_post_price_after_rebills`,
> `year_offer_holder`, `is_winback_product`, `base_contract_inheritance`,
> `is_excl_vat`, `note`. Not needed for this suite.)

### `product_fees` (optional — fee-catalog adjustments)

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(11) | NO | — | **PK** |
| `product_id` | int(255) | NO | — | FK → `products.prod_id` |
| `fee_id` | int(255) | NO | — | the fee product |
| `type` | enum('invoice','credit_card','shipping','postage','bundle','other') | NO | 'invoice' | |
| `is_second_package` | tinyint(1) | NO | 0 | |

### `products_component` (optional — component line items)

SoftDeletes (`deleted_at`).

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | int(10) unsigned | NO | — | **PK** |
| `prod_id` | int(11) | YES | NULL | FK → `products.prod_id` |
| `component_id` | int(11) | YES | NULL | |
| `second_package_component_id` | int(11) | YES | NULL | |
| `name` | text | NO | — | component display name |
| `group` | enum('start_package','refill_normal','refill_special','refill_bundle','single','fee','other','installment','startpackage','rebill') | NO | — | |
| `deleted_at` | datetime | YES | NULL | soft delete |

### `subscriptions_deleted` (optional — deleted-subscription mirror)

Mirror of `subscriptions` plus `date_deleted` (datetime, NOT NULL). Same PK `id`,
has `created_at`/`updated_at`. Only needed for a deleted-subscriptions view
(out of v1).

---

## Billing & Fulfillment Tables

Imported for the **billing-fulfillment-suite**. `invoices` pre-existed; the rest
were imported from `gracewel_grace`. `future_order_jobs` is a NEW table created
by migration (`2026_06_10_000000_create_future_order_jobs_table`) because the
legacy worker `jobs` schema collides with Laravel's queue `jobs` table.

### Eloquent binding cheatsheet

| Model → table | PK | Notes |
|---|---|---|
| `Invoice` → `invoices` | `id` | `invoice_id` (varchar) == order id; `total`/`balance` float; `metadata` json |
| `Payment` → `payments` | `id` | `sum` float; linked to invoice through `payment_results` |
| `PaymentResult` → `payment_results` | `id` (unsigned) | `invoice_id` → `invoices.id`; `payment_id` → `payments.id` |
| `CreditNote` → `credit_notes` | `id` (unsigned) | `status` enum(open,closed,refunded,partially_refund) |
| `WorkflowLog` → `workflow_logs` | `id` | reminder history, by `customer_id`; `created_at` only |
| `EventLog` → `event_log` | `id` | no timestamps (`date_added`); sub event log via `sub_id` |
| `FutureOrderJob` → `future_order_jobs` | `id` | NEW; `subscription_id`, `status`, `payload` json, `execute_at` |

### Key joins (verified against data)
- **Invoice ↔ Order:** `invoices.invoice_id` = `orders.id` (the order id is the
  invoice number). `Invoice::order()` and `listForOrder($orderId)` use this.
- **Payments ↔ Invoice:** through `payment_results` —
  `payment_results.invoice_id` = `invoices.id`, `payment_results.payment_id` =
  `payments.id` (HasManyThrough). A manual payment writes a `payments` row +
  matching `payment_results` row and decrements `invoices.balance`.
- **Reminders:** `workflow_logs.customer_id` = `invoices.customer_id`.
- **Event log:** `event_log.sub_id` = `subscriptions.id` (most rows are `sub_id=0`).

### Notes
- Order-level **refunds, internal notes, return state, resend timestamp** are
  stored locally in `orders.metadata` (`refunds[]`, `notes[]`, `returned` +
  `return_type`, `confirmation_sent_at`) — no dedicated tables.
- `payments.invoice_id` also exists as a direct column but is unreliable; the
  canonical link is via `payment_results`.
