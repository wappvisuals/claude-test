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
