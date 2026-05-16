# Customer List + Search — Feature Plan

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/customers` | Paginated list with sort |
| GET | `/api/customers/search` | Tokenized + fuzzy search with filters |
| GET | `/api/customers/{id}` | Single customer detail (read-only) |

### List query params
`page`, `per_page`, `sort_by` (to_user/first_name/last_name/last_order — optional, default: omitted), `sort_dir` (asc/desc — optional), `status[]`

Default sort when no `sort_by` sent: `to_user DESC` (applied server-side, never sent from client).

### Search query params
`q` (required), `status[]`, `last_order_after` (YYYY-MM-DD), `last_order_before` (YYYY-MM-DD), `page`, `per_page`

### Response envelope (both endpoints)
```json
{
  "data": [ ...customers ],
  "links": { "first", "last", "prev", "next" },
  "meta": { "current_page", "last_page", "per_page", "total", "from", "to" }
}
```

### Customer object
```json
{
  "id": 1,
  "first_name": "Per",
  "last_name": "Gustafsson",
  "full_name": "Per Gustafsson",
  "email": "per@example.com",
  "alternative_email": null,
  "tel": "0701234567",
  "alternative_tel": null,
  "status": "active",
  "adress": "Storgatan 1",
  "post_nr": "11122",
  "ort": "Stockholm",
  "date_added": "2023-06-01",
  "created_at": "2023-06-01T10:00:00.000000Z",
  "relevance_score": null,
  "matched_fields": null
}
```
`relevance_score` and `matched_fields` are non-null only on search results.

## Existing Database Table

Table: `customer_profile` in `gracewel_grace`

Full column list:

| Column | Type | Notes |
|---|---|---|
| to_user | PK | Primary key |
| organization_id | | |
| status | | |
| first_visit | | |
| first_name | | |
| last_name | | |
| pers_nr | | Personal/SSN number |
| sex | | |
| careof | | Care of (address line) |
| adress | | |
| post_nr | | Postal code |
| ort | | City |
| tel | | Primary phone |
| date_added | | |
| email | | |
| alternative_tel | | |
| alternative_email | | |
| want_newsletter | | Boolean |
| comments | | Structured JSON |
| gothia_account | | |
| ledgers | | JSON array |
| blocked_fees | | JSON array |
| reminders | | |
| do_not_call | | Boolean flag |
| difficult_customer | | Boolean flag |
| region_code | | SE, FI, NO, EE, LV, LT, PL |
| language | | |
| birthdate | | |
| credit_check | | |
| sync | | |
| updated_at | | |

### Table columns (what the list API returns and displays)

| Column | Display | Searchable | Sortable |
|---|---|---|---|
| to_user | ID | — | yes |
| first_name + last_name | Name | yes | yes |
| pers_nr | SSN | yes | — |
| adress + post_nr + ort | Address | yes | — |
| tel | Phone | yes | — |
| last_order | Last Order | — | yes |

`last_order` is a computed field — the date of the customer's most recent order, resolved via a subquery or LEFT JOIN against the orders table during backend implementation. It is `null` when the customer has no orders.

All other columns are fetched for the **detail page** only, not shown in the list table.


## Search Algorithm

Tokenization: split query on whitespace (e.g. "Per Gustafsson" → `["Per", "Gustafsson"]`)

Additive scoring per row (SQL CASE expressions):

Multi-token scoring (2+ tokens — e.g. "Per Gustafsson"):

| Score | Condition |
|---|---|
| +100 | CONCAT(first_name, ' ', last_name) prefix match |
| +90 | token[0]=first_name AND token[1]=last_name prefix |
| +85 | token[0]=last_name AND token[1]=first_name (reversed) |
| +70 | All tokens match first_name OR last_name prefix |
| +65 | SSN (pers_nr) prefix match |
| +60 | Email prefix match |
| +50 | Phone prefix match |
| +30 | Address contains match (scoring only) |

Single-token scoring (e.g. "Ronald"):

| Score | Condition |
|---|---|
| +90 | first_name prefix match |
| +80 | last_name prefix match |
| +65 | SSN (pers_nr) prefix match |
| +60 | Email prefix match |
| +50 | Phone prefix match |
| +30 | Address contains match (scoring only) |

Single-token name scoring (+90/+80) is placed before email (+60) in the CASE expression so customers whose name matches rank above customers who only match on email/phone.

Candidate retrieval uses LIKE prefix matching on `first_name`, `last_name`, `email`, `tel`, `pers_nr`. Address is excluded from candidate retrieval (substring match is too broad) but contributes +30 to scoring for candidates found by other fields. A `HAVING relevance_score > 0` guard ensures only genuinely matching records are returned.

## UI Stack

**Framework:** Tailwind CSS v4 + lucide-react icons (shadcn/ui used only for detail page primitives)

### Design — list page

| Element | Implementation |
|---|---|
| Status tabs (All / Active / Inactive / Blocked) | `<button>` pills — active = `bg-gray-900 text-white`, rest unstyled |
| Search bar | Native `<input>` + Period date range + violet Search `<button>` |
| Customer rows | `<div>` flex rows — no `<table>` element, no column headers |
| Avatar | Deterministic color (id % 8) rounded-full with initials |
| Status badge | Inline `<span>` with ring-1 variant colors (emerald/gray/red) |
| Skeleton | Plain `animate-pulse` divs — no shadcn `<Skeleton>` |
| Pagination | Plain `<button>` with ChevronLeft/Right icons |

### shadcn/ui components still in use

| Component | File | Used by |
|---|---|---|
| `Badge` | `components/ui/badge.tsx` | StatusBadge (detail page only) |
| `Button` | `components/ui/button.tsx` | CustomerDetailPage (back button) |
| `Skeleton` | `components/ui/skeleton.tsx` | CustomerDetailPage loading state |

### Design principles
- List page uses plain HTML elements + Tailwind utilities only
- Detail page retains shadcn/ui primitives
- Icons from `lucide-react` only
- No custom CSS classes; no inline styles

## Routes

All routes render inside `AdminLayout` (sidebar + header wrapper).

| Path | Component | Notes |
|---|---|---|
| `/customers` | CustomerListPage | List + search |
| `/customers/:id` | CustomerDetailPage | Read-only detail, back button to list |

## Component Map

```
App
└── BrowserRouter
    └── AdminLayout                   ← persistent shell for all pages
        ├── Sidebar                   ← fixed left nav, bg-slate-900, w-60
        │   ├── logo / app name       ← top of sidebar
        │   └── NavItem (Customers)   ← <Link> + useLocation active state
        ├── Header                    ← top bar, bg-white, border-b
        │   └── page title            ← derived from current route
        └── <main> (content area)     ← <Outlet /> renders here
            ├── CustomerListPage      ← /customers
            │   ├── tab pills         ← All / Active / Inactive / Blocked (bg-gray-900 active)
            │   ├── CustomerSearch    ← native <input> + Period date range + violet Search button
            │   └── CustomerTable     ← <div> rows (no table/headers) + pagination
            │       ├── CustomerTableRow        ← flex row: checkbox · avatar · name/addr · phone · SSN · status · last_order · →
            │       │   └── HighlightText       ← <span> + <mark> for matched tokens
            │       └── CustomerTableSkeleton   ← animate-pulse divs (8×)
            └── CustomerDetailPage    ← /customers/:id
                ├── back button       ← shadcn <Button variant="ghost"> + useNavigate(-1)
                ├── CustomerDetailHeader ← h2 + StatusBadge + date
                └── CustomerDetailCard  ← bordered div, divide-y sections
                    ├── Contact section ← dl grid-cols-2
                    ├── Address section ← dl grid-cols-2
                    └── Details section ← dl grid-cols-2
```

## File Map

```
app/
├── Models/Customer.php                        ← points to customer_profile table
├── Services/CustomerSearchService.php
├── Http/Controllers/Api/CustomerController.php
└── Http/Resources/CustomerResource.php

routes/api.php
bootstrap/app.php (api route registration)

resources/js/
├── main.tsx
├── App.tsx                                    ← BrowserRouter + routes with AdminLayout
├── types/customer.ts
├── lib/api.ts
├── hooks/
│   ├── useCustomers.ts
│   ├── useCustomerSearch.ts
│   └── useCustomer.ts
└── components/
    ├── layout/                                ← shared across all features
    │   ├── AdminLayout.tsx                    ← sidebar + header + <Outlet>
    │   ├── Sidebar.tsx                        ← left nav with NavItem links
    │   ├── Header.tsx                         ← top bar with page title
    │   └── NavItem.tsx                        ← single nav link with active state
    └── customers/
        ├── CustomerListPage.tsx
        ├── CustomerTable.tsx
        ├── CustomerTableRow.tsx
        ├── CustomerSearch.tsx
        ├── CustomerDetailPage.tsx
        ├── CustomerDetailCard.tsx
        ├── CustomerDetailHeader.tsx
        ├── HighlightText.tsx
        ├── StatusBadge.tsx
        ├── SortableHeader.tsx
        └── CustomerTableSkeleton.tsx
```

---

## States

### CustomerListPage
| State | Type | Initial | Description |
|---|---|---|---|
| `activeTab` | `'all' \| CustomerStatus` | `'all'` | Selected status tab — maps to status filter |
| `query` | `string` | `''` | Last submitted search query |
| `searchTokens` | `string[]` | `[]` | Query split on whitespace, passed to rows for token highlighting |
| `isSearchMode` | `boolean` | `false` | True when a non-empty query has been submitted |
| `page` | `number` | `1` | Current page (shared between list and search) |
| `dateFilters` | `{ last_order_after?: string; last_order_before?: string }` | `{}` | Date range from last submitted search |

### useCustomers
| State | Type | Description |
|---|---|---|
| `data` | `PaginatedResponse<Customer> \| null` | Last successful list response |
| `loading` | `boolean` | True while request is in-flight |
| `error` | `string \| null` | Error message if request failed |

### useCustomerSearch
| State | Type | Description |
|---|---|---|
| `results` | `PaginatedResponse<Customer> \| null` | Last successful search response |
| `searching` | `boolean` | True while debounce timer or request is active |
| `error` | `string \| null` | Error message if search failed |
| `params` | `CustomerSearchParams \| null` | Current active search parameters |

### useCustomer (detail)
| State | Type | Description |
|---|---|---|
| `customer` | `Customer \| null` | Fetched customer record |
| `loading` | `boolean` | True while fetching |
| `error` | `string \| null` | Error or "not found" message |

---

## Props

### `<AdminLayout>`
| Prop | Type | Required | Description |
|---|---|---|---|
| — | — | — | No props — reads children via `<Outlet />` from React Router |

### `<Sidebar>`
| Prop | Type | Required | Description |
|---|---|---|---|
| — | — | — | No props — nav items are hardcoded; active state derived from `useLocation()` |

### `<Header>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | yes | Page title shown in the top bar |

### `<NavItem>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `to` | `string` | yes | Route path (e.g. `/customers`) |
| `label` | `string` | yes | Display label |
| `icon` | `React.ReactNode` | yes | lucide-react icon element |

### `<CustomerTable>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `data` | `PaginatedResponse<Customer> \| null` | yes | Paginated customer list or search results |
| `loading` | `boolean` | yes | Shows skeleton when true |
| `searchTokens` | `string[]` | yes | Passed to rows for highlight; empty array when not in search mode |
| `onPageChange` | `(page: number) => void` | yes | Called when pagination prev/next is clicked |

### `<CustomerTableRow>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `customer` | `Customer` | yes | Row data |
| `searchTokens` | `string[]` | yes | Tokens to highlight in name/email cells |

### `<CustomerSearch>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `onSearch` | `(q: string, filters: { last_order_after?: string; last_order_before?: string }) => void` | yes | Fired on Search button click or Enter; also fires with `''` when input is cleared |
| `initialQuery` | `string` | no | Pre-fill search input |

### `<HighlightText>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `text` | `string \| null` | yes | The display string to render |
| `tokens` | `string[]` | yes | Query tokens to bold-wrap on match |
| `className` | `string` | no | Optional wrapper class |

### `<StatusBadge>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `status` | `CustomerStatus` | yes | `'active' \| 'inactive' \| 'blocked'` |

### `<SortableHeader>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | yes | Column display label |
| `column` | `CustomerListParams['sort_by']` | yes | Field key this header controls |
| `currentSort` | `{ by: string; dir: 'asc' \| 'desc' }` | yes | Active sort state |
| `onSort` | `(col) => void` | yes | Sort toggle handler |

### `<CustomerDetailCard>`
| Prop | Type | Required | Description |
|---|---|---|---|
| `customer` | `Customer` | yes | Full customer record |

---

## Validation Rules

### `GET /api/customers` (list)
| Param | Rule |
|---|---|
| `page` | integer, min:1, default 1 |
| `per_page` | integer, min:1, max:100, default 25 |
| `sort_by` | optional; in: to_user, first_name, last_name, last_order; server default: to_user |
| `sort_dir` | optional; in: asc, desc; server default: desc when sort_by=to_user, asc otherwise |
| `status[]` | array; each item in: active, inactive, blocked |

### `GET /api/customers/search`
| Param | Rule |
|---|---|
| `q` | required, string, min:1, max:200 |
| `status[]` | array; each item in: active, inactive, blocked |
| `last_order_after` | nullable, date format Y-m-d |
| `last_order_before` | nullable, date format Y-m-d |
| `page` | integer, min:1, default 1 |
| `per_page` | integer, min:1, max:100, default 25 |

### `GET /api/customers/{id}`
| Param | Rule |
|---|---|
| `id` (route) | integer; 404 if not found |

### Frontend (client-side)
| Field | Rule |
|---|---|
| Search input `q` | trim whitespace; ignore submit if empty after trim |
| `last_order_after` | must be a valid date; must be ≤ `last_order_before` if both set |
| `last_order_before` | must be a valid date; must be ≥ `last_order_after` if both set |
| `per_page` | clamped to 10–100 before sending |
