# Customer Organization Upsert — Feature Plan

## Overview

`customer_profile.organization_id` is a `varchar(10)` FK pointing to `customer_organizations.id`. The upsert feature allows linking a customer to an existing organization or creating a new one inline.

> **Schema assumption:** `customer_organizations` has at minimum `id varchar(10)` (PK) and `name varchar(255)`. The full schema is not in `test.sql`. Update `.claude/database.md` once confirmed.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/organizations` | Search organizations by id prefix or name |
| PUT | `/api/customers/{id}/organization` | Upsert org and link to customer |

### GET /api/organizations

#### Query params

| Param | Rule | Description |
|---|---|---|
| `q` | required, string, min:1, max:50 | Search term — matches `id` prefix or `name` LIKE |
| `per_page` | optional, integer, min:1, max:50, default 15 | Results per page |

#### Response envelope

```json
{
  "data": [
    { "id": "5569910127", "name": "Acme AB" }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": null },
  "meta": { "current_page": 1, "last_page": 1, "per_page": 15, "total": 1, "from": 1, "to": 1 }
}
```

### PUT /api/customers/{id}/organization

#### Request body

```json
{
  "organization_id": "5569910127",
  "name": "Acme AB"
}
```

`name` is required only when creating a new organization (i.e. the given `organization_id` does not already exist in `customer_organizations`). If the org already exists, `name` is optional and used to update the existing record.

#### Upsert logic (backend)

1. `updateOrCreate(['id' => $data['organization_id']], ['name' => $data['name'] ?? existing])` on `CustomerOrganization`
2. `$customer->update(['organization_id' => $data['organization_id']])`
3. Return updated customer via `CustomerResource`

#### Response envelope

```json
{ "data": { ...customer } }
```

`customer.organization_id` will be the linked org id.

---

## Database Columns

| Column | Table | Type | Notes |
|---|---|---|---|
| `organization_id` | `customer_profile` | varchar(10) | FK → `customer_organizations.id` |
| `id` | `customer_organizations` | varchar(10) | PK (org number, e.g. "5569910127") |
| `name` | `customer_organizations` | varchar(255) | **Assumed** — confirm against real schema |

---

## Routes

No new frontend routes. Rendered inline on `/customers/:id`.

---

## Component Map

```
CustomerDetailPage (/customers/:id)
└── CustomerProfileCenter (or CustomerProfileHeader)
    └── CustomerOrganizationSection    ← new
        ├── view mode
        │   ├── current org: id + name (or "— none —")
        │   └── [Link / Change] button → opens form
        └── CustomerOrganizationForm   ← new (inline)
            ├── org id input           ← type org number, triggers search
            ├── [Search] button        ← fetches org by id; shows name if found
            ├── org name input         ← pre-filled if found; required if not found
            └── [Save] / [Cancel] buttons
```

---

## File Map

```
Backend
app/
├── Models/CustomerOrganization.php                        ← new
├── Http/Controllers/Api/OrganizationController.php        ← new (index/search)
├── Http/Controllers/Api/CustomerOrganizationController.php ← new (upsert)
├── Http/Resources/OrganizationResource.php                ← new
└── Http/Controllers/Api/CustomerController.php            ← add 'organization_id' to $fillable
                                                             (already in resource; add to fillable)

routes/api.php                                             ← add GET /organizations, PUT /customers/{id}/organization

Frontend
resources/js/
├── types/organization.ts                                  ← new: Organization interface
├── lib/api.ts                                             ← add searchOrganizations(), upsertOrganization()
├── hooks/useOrganizations.ts                              ← new: search hook (debounced)
├── hooks/useOrganizationUpsert.ts                         ← new: mutation hook
└── components/customers/
    ├── CustomerOrganizationSection.tsx                    ← new
    └── CustomerOrganizationForm.tsx                       ← new
```

---

## States

### `useOrganizations`

| State | Type | Initial | Description |
|---|---|---|---|
| `results` | `Organization[]` | `[]` | Search results |
| `loading` | `boolean` | `false` | True while request in-flight |
| `error` | `string \| null` | `null` | Error message |

### `useOrganizationUpsert`

| State | Type | Initial | Description |
|---|---|---|---|
| `saving` | `boolean` | `false` | True while PUT in-flight |
| `error` | `string \| null` | `null` | Top-level error |
| `fieldErrors` | `Record<string, string>` | `{}` | Per-field 422 errors |

### `CustomerOrganizationForm`

| State | Type | Initial | Description |
|---|---|---|---|
| `orgId` | `string` | existing `customer.organization_id \|\| ''` | Typed org number |
| `orgName` | `string` | `''` | Org name (pre-filled on search hit, required on create) |
| `searched` | `boolean` | `false` | Whether a search has been triggered |
| `foundOrg` | `Organization \| null` | `null` | Org returned by search (null = not found) |

---

## Props

### `<CustomerOrganizationSection>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `customer` | `Customer` | yes | Source of `organization_id` for current org display |
| `saving` | `boolean` | yes | Passed down to form |
| `onSave` | `(customer: Customer) => void` | yes | Called with updated customer after successful upsert |

### `<CustomerOrganizationForm>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `customerId` | `number` | yes | Customer `to_user` id |
| `initialOrgId` | `string` | no | Pre-fills org id field |
| `saving` | `boolean` | yes | Disables inputs and submit |
| `error` | `string \| null` | yes | Top-level error banner |
| `fieldErrors` | `Record<string, string>` | yes | Per-field errors |
| `onSuccess` | `(customer: Customer) => void` | yes | Called after successful PUT |
| `onCancel` | `() => void` | yes | Closes the form |

---

## Validation Rules

### Backend — GET /api/organizations

| Param | Rule |
|---|---|
| `q` | required, string, min:1, max:50 |
| `per_page` | optional, integer, min:1, max:50 |

### Backend — PUT /api/customers/{id}/organization

| Field | Rule |
|---|---|
| `id` (route) | integer; 404 if customer not found |
| `organization_id` | required, string, max:10 |
| `name` | nullable, string, max:255 |

> `name` is required server-side only when `organization_id` does not exist in `customer_organizations`. Use custom validation rule or conditional logic in the controller.

### Frontend

| Field | Rule |
|---|---|
| `orgId` | Required; max 10 chars; alphanumeric only |
| `orgName` | Required if `foundOrg === null` (creating new org); max 255 chars |

---

## Agents

No agents required.
