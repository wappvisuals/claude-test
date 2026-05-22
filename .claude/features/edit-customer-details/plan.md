# Edit Customer Details — Feature Plan

## API Endpoints

| Method | Path | Description |
|---|---|---|
| PATCH | `/api/customers/{id}` | Partial update of editable customer fields |

### PATCH /api/customers/{id}

No query params. Payload sent as JSON request body.

**Request body fields:**

| Field | Type | Notes |
|---|---|---|
| `first_name` | string\|null | |
| `last_name` | string\|null | |
| `email` | string\|null | |
| `alternative_email` | string\|null | |
| `tel` | string\|null | |
| `alternative_tel` | string\|null | |
| `careof` | string\|null | |
| `adress` | string\|null | |
| `post_nr` | string\|null | |
| `ort` | string\|null | |
| `region_code` | string\|null | One of: SE, FI, NO, EE, LV, LT, PL |
| `sex` | string\|null | One of: M, F |
| `pers_nr` | string\|null | |

### Response envelope

Single-resource envelope — same shape as `GET /api/customers/{id}`:

```json
{
  "data": { ...customer }
}
```

### Example response

```json
{
  "data": {
    "id": 1,
    "first_name": "Per",
    "last_name": "Gustafsson",
    "full_name": "Per Gustafsson",
    "email": "per@example.com",
    "alternative_email": null,
    "tel": "0701234567",
    "alternative_tel": null,
    "status": "active",
    "careof": null,
    "adress": "Storgatan 1",
    "post_nr": "11122",
    "ort": "Stockholm",
    "region_code": "SE",
    "sex": "M",
    "pers_nr": "19800101-1234",
    "do_not_call": false,
    "difficult_customer": false,
    "want_newsletter": true,
    "birthdate": "1980-01-01",
    "language": "sv",
    "date_added": "2023-06-01",
    "first_visit": "2023-06-01",
    "updated_at": "2024-01-15T08:30:00.000000Z",
    "last_order": "2024-01-10",
    "organization_id": null,
    "comments": null,
    "ledgers": [],
    "blocked_fees": [],
    "reminders": null,
    "gothia_account": null,
    "credit_check": null,
    "sync": null,
    "relevance_score": null,
    "matched_fields": null
  }
}
```

---

## Existing Database Table

Table: `customer_profile`   Primary key: `to_user`

No migration — table already exists.

### Full column list

| Column | Type | Notes |
|---|---|---|
| to_user | PK | Primary key |
| organization_id | | |
| status | | active / inactive / blocked |
| first_visit | | |
| first_name | | **Editable** |
| last_name | | **Editable** |
| pers_nr | | Personal/SSN — **Editable** |
| sex | | **Editable** |
| careof | | Care of (address line) — **Editable** |
| adress | | **Editable** |
| post_nr | | Postal code — **Editable** |
| ort | | City — **Editable** |
| tel | | Primary phone — **Editable** |
| date_added | | |
| email | | **Editable** |
| alternative_tel | | **Editable** |
| alternative_email | | **Editable** |
| want_newsletter | | Boolean |
| comments | | Structured JSON |
| gothia_account | | |
| ledgers | | JSON array |
| blocked_fees | | JSON array |
| reminders | | |
| do_not_call | | Boolean flag |
| difficult_customer | | Boolean flag |
| region_code | | SE, FI, NO, EE, LV, LT, PL — **Editable** |
| language | | |
| birthdate | | |
| credit_check | | |
| sync | | |
| updated_at | | |

### List display columns vs detail-only columns

| Column | List Display | Detail Only | Editable |
|---|---|---|---|
| to_user | yes (ID) | — | no |
| first_name + last_name | yes (Name) | — | yes |
| pers_nr | yes (SSN) | — | yes |
| adress + post_nr + ort | yes (Address) | — | yes |
| tel | yes (Phone) | — | yes |
| last_order (computed) | yes | — | no |
| email | — | yes | yes |
| alternative_email | — | yes | yes |
| alternative_tel | — | yes | yes |
| careof | — | yes | yes |
| region_code | — | yes | yes |
| sex | — | yes | yes |
| status | — | yes | no |
| do_not_call | — | yes | no |
| difficult_customer | — | yes | no |
| want_newsletter | — | yes | no |
| birthdate | — | yes | no |
| language | — | yes | no |
| organization_id | — | yes | no |
| first_visit | — | yes | no |
| updated_at | — | yes | no |
| comments / ledgers / blocked_fees / reminders / gothia_account | — | yes | no |

---

## Routes

No new routes. Edit mode lives entirely within the existing detail page.

| Path | Component | Notes |
|---|---|---|
| `/customers` | CustomerListPage | Existing — unchanged |
| `/customers/:id` | CustomerDetailPage | Existing — gains `isEditing` toggle |

---

## Component Map

```
App
└── BrowserRouter
    └── AdminLayout
        └── <main>
            ├── CustomerListPage              (existing — unchanged)
            └── CustomerDetailPage            ← /customers/:id  (modified)
                ├── top row                   ← flex justify-between
                │   ├── back button           ← ghost <Button> + navigate(-1); always visible
                │   └── Edit button           ← shadcn <Button variant="outline"> Pencil icon
                │                                visible only when !isEditing
                ├── CustomerDetailHeader      ← existing, unchanged (full_name + StatusBadge + date)
                └── when !isEditing:
                    │   CustomerDetailCard    ← existing, unchanged
                    └── when isEditing:
                        CustomerEditForm      ← new; replaces card in-place
                            ├── Name section     ← first_name input, last_name input
                            ├── Emails section   ← email input, alternative_email input
                            ├── Phones section   ← tel input, alternative_tel input
                            ├── Address section  ← careof input, adress input, post_nr input,
                            │                       ort input, region_code <Select>
                            ├── Identity section ← sex <Select> (M / F / blank), pers_nr input
                            └── FormActions      ← Cancel ghost button + Save primary button
```

---

## File Map

```
Backend
app/
└── Http/Controllers/Api/CustomerController.php   ← add update() method

routes/api.php                                    ← add PATCH /customers/{id} route

Frontend
resources/js/
├── types/customer.ts                             ← add CustomerUpdatePayload interface
├── lib/api.ts                                    ← add updateCustomer(id, payload)
├── hooks/
│   └── useUpdateCustomer.ts                      ← new mutation hook
└── components/customers/
    ├── CustomerDetailPage.tsx                    ← add isEditing state, Edit button, form swap
    └── CustomerEditForm.tsx                      ← new (form with all sections + FormActions)
```

No new routes in `App.tsx`. No new page component. `CustomerDetailCard` and `CustomerDetailHeader` are untouched.

---

## States

### `CustomerDetailPage`

| State | Type | Initial | Description |
|---|---|---|---|
| `isEditing` | `boolean` | `false` | Toggles between read (CustomerDetailCard) and edit (CustomerEditForm) |

Existing states (`customer`, `loading`, `error` from `useCustomer`) are unchanged.

### `useUpdateCustomer` hook

| State | Type | Initial | Description |
|---|---|---|---|
| `saving` | `boolean` | `false` | True while PATCH request is in-flight |
| `error` | `string \| null` | `null` | Top-level error message (non-422 failures) |
| `fieldErrors` | `Record<string, string>` | `{}` | Per-field messages from 422 response |

### `CustomerEditForm`

| State | Type | Initial | Description |
|---|---|---|---|
| `form` | `CustomerUpdatePayload` | Mapped from `customer` prop | Controlled form values |
| `isDirty` | `boolean` | `false` | True when any field differs from initial; gates Save button |
| `clientErrors` | `Record<string, string>` | `{}` | Client-side validation errors, cleared on field change |

---

## Props

### `<CustomerEditForm>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `customer` | `Customer` | yes | Populates initial form values |
| `saving` | `boolean` | yes | Disables all inputs and shows spinner on Save |
| `error` | `string \| null` | yes | Top-level error banner above FormActions |
| `fieldErrors` | `Record<string, string>` | yes | Per-field server-side errors merged with `clientErrors` |
| `onSubmit` | `(payload: CustomerUpdatePayload) => void` | yes | Called after client-side validation passes |
| `onCancel` | `() => void` | yes | Sets `isEditing = false` in parent; resets form state |

---

## Validation Rules

### Backend — PATCH /api/customers/{id}

| Field | Rule |
|---|---|
| `id` (route) | integer; 404 if not found |
| `first_name` | nullable, string, max:100 |
| `last_name` | nullable, string, max:100 |
| `email` | nullable, email, max:200 |
| `alternative_email` | nullable, email, max:200 |
| `tel` | nullable, string, max:30 |
| `alternative_tel` | nullable, string, max:30 |
| `careof` | nullable, string, max:100 |
| `adress` | nullable, string, max:200 |
| `post_nr` | nullable, string, max:20 |
| `ort` | nullable, string, max:100 |
| `region_code` | nullable, in:SE,FI,NO,EE,LV,LT,PL |
| `sex` | nullable, in:M,F |
| `pers_nr` | nullable, string, max:20 |

Laravel returns `422 Unprocessable Content` with `{ message, errors: { field: ['message'] } }` on failure.

### Frontend — client-side (before submit)

| Field | Rule |
|---|---|
| `first_name` | trim whitespace; max 100 chars |
| `last_name` | trim whitespace; max 100 chars |
| `email` | if non-empty: must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `alternative_email` | if non-empty: must match email pattern |
| `tel` | max 30 chars |
| `alternative_tel` | max 30 chars |
| `careof` | max 100 chars |
| `adress` | max 200 chars |
| `post_nr` | max 20 chars |
| `ort` | max 100 chars |
| `pers_nr` | max 20 chars |
| `region_code` | if non-empty: must be one of SE, FI, NO, EE, LV, LT, PL |
| `sex` | if non-empty: must be M or F |

Field-level errors from the server (422) are merged with client errors and displayed inline beneath each input. A top-level error banner is shown for non-422 failures (500, network).

---

## Agents

No agents required — this feature is a single PATCH endpoint with a form UI. No parallel work streams that would benefit from agent decomposition.
