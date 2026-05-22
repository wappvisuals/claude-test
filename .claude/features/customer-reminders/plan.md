# Customer Reminders — Feature Plan

## Overview

The `reminders` column in `customer_profile` is a `tinyint(1)` boolean flag (1 = active, 0 = inactive, default 1). This feature exposes it as a togglable card on the customer detail page.

- **Activate** → PATCH `{ reminders: 1 }`
- **Deactivate** → PATCH `{ reminders: 0, comments: "<existing text>\n<reason entry>" }` — the deactivation reason is appended to `comments` in the standard comment format.

"Reminder types" in the current schema is a single type (the general reminders flag). The card displays the current status and provides the appropriate action.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| PATCH | `/api/customers/{id}` | **Existing** — send `reminders` (and optionally `comments`) |

### Backend changes required

`reminders` is not yet in `Customer.$fillable` or the `update()` validator. Both must be added.

**`$fillable` addition:** `'reminders'`

**Validation addition (PATCH):**
```php
'reminders' => 'nullable|boolean',
```

`CustomerResource` already returns `reminders` — no changes needed there.

### Request examples

Activate:
```json
{ "reminders": 1 }
```

Deactivate with reason:
```json
{
  "reminders": 0,
  "comments": "existing comments text\nReason for deactivation /agent, 2026-05-22, 14:00 @all"
}
```

### Response envelope

```json
{ "data": { ...customer } }
```

`customer.reminders` will be `true` or `false` after the cast.

---

## Database Columns

| Column | Table | Type | Default | Notes |
|---|---|---|---|---|
| `reminders` | `customer_profile` | tinyint(1) | 1 | 1 = active, 0 = inactive |
| `comments` | `customer_profile` | text | NULL | Deactivation reason appended here |

---

## Routes

No new routes. Rendered inline on `/customers/:id`.

---

## Component Map

```
CustomerDetailPage (/customers/:id)
└── CustomerProfileCenter   ← existing (or CustomerProfileStats)
    └── CustomerRemindersCard   ← new
        ├── status indicator    ← "Active" (green) / "Inactive" (gray) label
        ├── Activate button     ← visible when reminders = false/0
        └── Deactivate button   ← visible when reminders = true/1
            └── DeactivateReasonForm ← inline; shown when isDeactivating=true
                ├── reason textarea
                └── Confirm / Cancel buttons
```

---

## File Map

```
Backend
app/
├── Models/Customer.php                           ← add 'reminders' to $fillable
└── Http/Controllers/Api/CustomerController.php   ← add 'reminders' to update() validation

Frontend
resources/js/
└── components/customers/
    └── CustomerRemindersCard.tsx                 ← new
```

No new hooks — mutations go through the existing `useUpdateCustomer` hook passed down via `onSave`.

---

## States

### `CustomerRemindersCard`

| State | Type | Initial | Description |
|---|---|---|---|
| `isDeactivating` | `boolean` | `false` | Shows the reason form |
| `reason` | `string` | `''` | Deactivation reason text |
| `clientError` | `string \| null` | `null` | Validation message for reason field |

---

## Props

### `<CustomerRemindersCard>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `customer` | `Customer` | yes | Source of `reminders` and `comments` |
| `saving` | `boolean` | yes | Disables controls while in-flight |
| `onSave` | `(payload: CustomerUpdatePayload) => void` | yes | Passed from `CustomerDetailPage.handleSaveNotes` |

---

## Validation Rules

### Frontend (client-side)

| Field | Rule |
|---|---|
| `reason` | Required when deactivating; max 500 chars; no `\n` characters |

The reason is formatted by the frontend into a comment line before sending:
```
{reason} /{author}, {YYYY-MM-DD}, {HH:MM} @all
```
then appended to the existing `customer.comments` string.

`author` is taken from a module-level constant or config (no auth system in this project).

### Backend

| Field | Rule |
|---|---|
| `reminders` | nullable, boolean |
| `comments` | nullable, string (already validated) |

---

## Agents

No agents required.
