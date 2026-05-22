# Customer Comments — Feature Plan

## Overview

Comments are stored as a single `text` field in `customer_profile.comments`. Each comment occupies one `\n`-delimited line in the format:

```
{text} /{author}, {YYYY-MM-DD}, {HH:MM} @{scope}
```

All CRUD is handled **frontend-side** (parse → mutate → serialize) and persisted via the existing `PATCH /api/customers/{id}` endpoint. No new API endpoints are required.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| PATCH | `/api/customers/{id}` | **Existing** — persists updated `comments` string |

No new endpoints. The `comments` field is already in `$fillable`, `CustomerUpdatePayload`, and backend validation (`nullable|string`).

### Request (PATCH)

Only the `comments` key is sent when saving comments:
```json
{ "comments": "line1 /author, 2026-05-22, 14:00 @all\nline2 /author2, 2026-05-22, 14:05 @all" }
```

### Response envelope

Same as existing `GET /api/customers/{id}`:
```json
{ "data": { ...customer } }
```

---

## Comment Format

Each line follows this pattern:
```
{text} /{author}, {YYYY-MM-DD}, {HH:MM} @{scope}
```

**Parse regex (per line):**
```
/^(.*?)\s+\/([^,]+),\s*(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2})\s+@(\S+)$/
```

Lines that do not match are treated as **unparseable** — displayed as raw text, cannot be edited or deleted individually.

### Comment object (TypeScript)

```ts
interface Comment {
  index: number        // 0-based position in the lines array
  text: string         // the message body
  author: string       // username / agent name
  date: string         // YYYY-MM-DD
  time: string         // HH:MM
  scope: string        // e.g. "all", "grace"
  raw: string          // original line (preserved for serialize)
  parseable: boolean   // false = display-only, no edit/delete
}
```

### Serialize back to string

```ts
`${text} /${author}, ${date}, ${time} @${scope}`
// joined with \n, newest comment appended at the end
```

---

## Database Column

| Column | Table | Type | Notes |
|---|---|---|---|
| `comments` | `customer_profile` | text | Nullable. Newline-separated log entries |

---

## Routes

No new routes. Comments are rendered inline on `/customers/:id` inside `CustomerProfileCenter`.

---

## Component Map

```
CustomerDetailPage (/customers/:id)
└── CustomerProfileCenter    ← existing; receives onSave + saving from page
    └── CustomerCommentsList ← new; owns add/edit UI state
        ├── [Add comment button]
        │   └── CustomerCommentForm (mode="add")   ← new; shown at top when isAdding
        └── CustomerCommentRow (×N)                ← new; one per parsed line
            ├── view mode: text · author · date · scope
            └── edit mode: CustomerCommentForm (mode="edit", inline)
```

Unparseable lines are rendered by `CustomerCommentRow` as plain text with no edit/delete controls.

---

## File Map

```
Frontend
resources/js/
├── lib/comments.ts                                ← new: parseComments(), serializeComments()
└── components/customers/
    ├── CustomerProfileCenter.tsx                  ← existing: wire in CustomerCommentsList
    ├── CustomerCommentsList.tsx                   ← new
    ├── CustomerCommentRow.tsx                     ← new
    └── CustomerCommentForm.tsx                    ← new

Backend
(no new files — uses existing PATCH /api/customers/{id})
```

---

## States

### `CustomerCommentsList`

| State | Type | Initial | Description |
|---|---|---|---|
| `editingIndex` | `number \| null` | `null` | Index of the comment currently in edit mode |
| `isAdding` | `boolean` | `false` | Whether the add form is shown |

### `CustomerCommentForm`

| State | Type | Initial | Description |
|---|---|---|---|
| `text` | `string` | `''` or existing text | Comment body |
| `author` | `string` | `''` | Author name (add mode only; edit mode preserves original) |
| `scope` | `string` | `'all'` | Audience scope tag |
| `clientError` | `string \| null` | `null` | Client-side validation message |

---

## Props

### `<CustomerCommentsList>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `comments` | `Comment[]` | yes | Parsed comment array derived from `customer.comments` |
| `saving` | `boolean` | yes | Passed from page; disables controls while in-flight |
| `onAdd` | `(text: string, author: string, scope: string) => void` | yes | Called when add form is submitted |
| `onEdit` | `(index: number, text: string, scope: string) => void` | yes | Called when edit form is submitted |
| `onDelete` | `(index: number) => void` | yes | Called when delete is confirmed |

### `<CustomerCommentRow>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `comment` | `Comment` | yes | The comment to display |
| `isEditing` | `boolean` | yes | True when this row is in edit mode |
| `saving` | `boolean` | yes | Disables controls while in-flight |
| `onEditStart` | `() => void` | yes | Opens inline edit form |
| `onEditSubmit` | `(text: string, scope: string) => void` | yes | Submits the edit |
| `onEditCancel` | `() => void` | yes | Closes inline edit form |
| `onDelete` | `() => void` | yes | Triggers delete |

### `<CustomerCommentForm>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `mode` | `'add' \| 'edit'` | yes | Determines which fields are shown |
| `initialText` | `string` | no | Pre-filled text (edit mode) |
| `initialScope` | `string` | no | Pre-filled scope (edit mode) |
| `saving` | `boolean` | yes | Disables inputs and submit button |
| `onSubmit` | `(text: string, author: string, scope: string) => void` | yes | |
| `onCancel` | `() => void` | yes | |

---

## Validation Rules

### Frontend (client-side, in `CustomerCommentForm`)

| Field | Rule |
|---|---|
| `text` | Required; no `\n` characters; max 1000 chars |
| `author` | Required in add mode; max 64 chars; no `,` or `/` |
| `scope` | Optional; defaults to `'all'`; max 50 chars; no whitespace |

### Backend

No additional backend validation beyond what already exists (`comments: nullable|string`).

---

## Agents

No agents required.
