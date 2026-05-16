# Prompt: Execute Feature Plan

Use this to implement a feature that already has a plan and task list.
Tasks are executed **one at a time** — each task is completed, verified, and checked
off before the next one starts.

Requires `.claude/features/[feature-name]/plan.md` and `tasks.md` to exist.
Run `create_feature_plan.md` first if they don't.

---

## The Prompt (copy-paste, replace [feature-name])

```
Execute the feature plan for [feature-name] one task at a time.

Before starting:
1. Read .claude/Plan.md
   → note: conventions, path aliases, API envelope shape, file locations
2. Read .claude/features/[feature-name]/plan.md
   → note: File Map, Component Map, States, Props, Validation Rules, Agents section
3. Read .claude/features/[feature-name]/tasks.md
   → find the first unchecked [ ] task — that is your only task for this turn

Task execution loop (repeat for every task):

  STEP 1 — State the task
           Print: "Starting task N/Total: [task name]"

  STEP 2 — Pre-check
           Before writing any code, state:
           - What file(s) will be created or modified
           - What the output will contain (e.g. "CustomerTable component with 5 props")
           - Any dependency on a previous task (e.g. "imports Customer type from task 1")

  STEP 3 — Implement
           Write the full implementation for this task only.
           Do not implement anything belonging to a future task.

  STEP 4 — Self-review
           After writing, check:
           - File is in the correct location (matches File Map in plan)
           - Types match the interfaces defined in plan (Props/States sections)
           - Imports use @/ alias, never relative ../../
           - No shadcn/ui ui/ files were modified
           - Backend: validation matches Validation Rules section exactly
           - Backend: response shape matches .claude/Plan.md API contract

  STEP 5 — Mark complete
           Update tasks.md: change [ ] to [x] for this task only

  STEP 6 — Report
           Print a completion block:
           ✓ Task N complete: [task name]
             Files: [list of files created/modified]
             Notes: [anything the user should know — decisions made, assumptions]
             Next: [name of the next unchecked task]

  STEP 7 — Stop
           Do NOT continue to the next task.
           Wait for the user to send "continue" before proceeding.
```

---

## Rules

### General
- **One task per turn** — if you find yourself implementing two tasks, stop
- **Read tasks.md at the start of every turn** — do not rely on memory of previous turns
- **Mark [x] immediately** — do not batch-complete multiple tasks at once
- **Stop after every task** — never auto-proceed, even if the next task looks trivial

### Code quality
- All frontend files use TypeScript (`.tsx` / `.ts`) — no `.jsx` or `.js`
- Use `@/` for all imports (`@/types/customer`, `@/lib/api`, etc.)
- Never use relative `../../` imports
- Never modify files under `resources/js/components/ui/` (shadcn/ui — read only)
- Use `cn()` from `@/lib/utils` for all conditional className merging

### API contract (from .claude/Plan.md)
- List endpoints → `{ data: T[], links: {...}, meta: {...} }`
- Single-record endpoints → `{ data: T }`
- Never return bare arrays or unwrapped objects

### Backend
- Models for pre-existing tables must declare `$table` and `$primaryKey` explicitly
- Never create a migration for a pre-existing table
- All request params must be validated — follow the Validation Rules section of plan.md
- Controllers call services; services contain business logic
- Resources transform model output; no logic inside Resource files

### Frontend
- Implement in dependency order: types → api → hooks → components → pages → router
- Each component's props must exactly match the Props section of plan.md
- Each hook's state must exactly match the States section of plan.md
- Loading states use `CustomerTableSkeleton`, not spinners or plain text
- Empty states show an icon + message, not null/blank

---

## Task execution order

Tasks run in the order listed in `tasks.md`. Do not reorder them.

### Frontend (tasks 1–14)

| # | Task | File(s) | Key output |
|---|---|---|---|
| 1 | TypeScript interfaces | `resources/js/types/customer.ts` | `Customer`, `CustomerStatus`, `MatchedField`, `PaginatedResponse`, `CustomerListParams`, `CustomerSearchParams` types |
| 2 | API layer | `resources/js/lib/api.ts` | Axios instance with base `/api`, `fetchCustomers()`, `searchCustomers()`, `fetchCustomer()` functions; serialize status[] as `status[]` query params |
| 3 | `useCustomers` hook | `resources/js/hooks/useCustomers.ts` | Accepts `CustomerListParams`, returns `{ data, loading, error, refetch }` |
| 4 | `useCustomerSearch` hook | `resources/js/hooks/useCustomerSearch.ts` | Debounced 300ms, accepts `CustomerSearchParams`, returns `{ results, searching, error, setParams }` |
| 5 | `useCustomer` hook | `resources/js/hooks/useCustomer.ts` | Accepts `id: number`, fetches single record, returns `{ customer, loading, error }` |
| 6 | `HighlightText` | `resources/js/components/customers/HighlightText.tsx` | Splits text on query tokens, wraps matches in `<strong>`. Non-global regex to avoid lastIndex bug. |
| 7 | `StatusBadge` | `resources/js/components/customers/StatusBadge.tsx` | shadcn Badge: active=default, inactive=secondary, blocked=destructive |
| 8 | `SortableHeader` | `resources/js/components/customers/SortableHeader.tsx` | Button with ↑ ↓ ↕ indicator; calls `onSort(column)` on click |
| 9 | `CustomerTableSkeleton` | `resources/js/components/customers/CustomerTableSkeleton.tsx` | 10 rows of shadcn Skeleton cells matching the 5 table columns |
| 10 | `CustomerTable` + `CustomerTableRow` | `resources/js/components/customers/CustomerTable.tsx` + `CustomerTableRow.tsx` | Table with Name/Email/Phone/Status/Since columns; rows are `<Link to="/customers/:id">`; prev/next pagination; empty state with icon |
| 11 | `CustomerSearch` | `resources/js/components/customers/CustomerSearch.tsx` | Controlled text input; status multi-select (active/inactive/blocked); date inputs for last_order_after + last_order_before; calls `onSearch(q, filters)` on every change |
| 12 | `CustomerListPage` | `resources/js/components/customers/CustomerListPage.tsx` | Owns `query`, `filters`, `listParams`, `isSearchMode` state; switches between `useCustomers` and `useCustomerSearch` based on query; passes `searchTokens` to table |
| 13 | `CustomerDetailPage` + `CustomerDetailCard` | `resources/js/components/customers/CustomerDetailPage.tsx` + `CustomerDetailCard.tsx` | Reads `:id` from URL params; uses `useCustomer`; back button via `useNavigate(-1)`; 3 card sections: Contact, Address, Meta |
| 14 | Router | `resources/js/App.tsx` | `BrowserRouter` + `Routes`; `/customers` → `CustomerListPage`; `/customers/:id` → `CustomerDetailPage`; `/` redirects to `/customers` |

### Backend (tasks 15–19)

| # | Task | File(s) | Key output |
|---|---|---|---|
| 15 | API routes | `bootstrap/app.php` + `routes/api.php` | Add `api:` key to `withRouting()`; define `GET /customers`, `GET /customers/search`, `GET /customers/{id}` — search route before `{id}` |
| 16 | `Customer` model | `app/Models/Customer.php` | `$table = 'customer_profile'`; `$primaryKey = 'to_user'`; `$fillable`; `$casts` for date fields; `const SORTABLE`; `const STATUSES` |
| 17 | `CustomerSearchService` | `app/Services/CustomerSearchService.php` | `tokenize()`, `buildScoringExpression()`, `buildMatchedFieldsExpression()`, `buildWhereClause()`, `search()` — additive scoring (+100/+90/+85/+70/+60/+50/+30/+10), SOUNDEX fallback, FULLTEXT BOOLEAN MODE candidate retrieval |
| 18 | `CustomerController` | `app/Http/Controllers/Api/CustomerController.php` | `index()` with sort/filter/pagination; `search()` delegates to `CustomerSearchService`; `show()` returns single record or 404 |
| 19 | `CustomerResource` | `app/Http/Resources/CustomerResource.php` | Returns all customer fields; `matched_fields` split from CSV `matched_fields_raw`; `relevance_score` null-safe |

### Verification (task 20)

| # | Task | Checks |
|---|---|---|
| 20 | Run verification checklist | Work through every item in the Verification section of tasks.md. For each: state ✓ pass or ✗ fail + reason. If anything fails, fix it before marking complete. |

---

## Session commands

| You type | Claude does |
|---|---|
| `continue` | Reads tasks.md, finds next `[ ]`, starts the loop |
| `redo task: [name]` | Re-implements that task, re-marks `[x]` |
| `skip task: [name]` | Marks `[x]` with note "skipped by user", moves on |
| `status` | Prints current tasks.md state — how many done vs remaining |
| `what's next` | Names the next unchecked task without starting it |

---

## Blocker handling

If Claude cannot complete a task (missing dependency, unclear spec, DB not reachable):

1. Do NOT skip silently
2. Print: `⚠ Blocked on task N: [task name]`
3. State exactly what is missing or unclear
4. Suggest a resolution (e.g. "need DB connection to verify table columns")
5. Wait for user input before retrying
