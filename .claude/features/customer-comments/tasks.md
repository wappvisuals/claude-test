# Customer Comments — Tasks

## Frontend

- [x] Create `lib/comments.ts` — `parseComments(raw: string): Comment[]` and `serializeComments(comments: Comment[]): string`
- [x] Add `Comment` interface to `lib/comments.ts`
- [x] Create `components/customers/CustomerCommentForm.tsx` — controlled form (text, author for add mode, scope); client-side validation
- [x] Create `components/customers/CustomerCommentRow.tsx` — displays one comment; edit/delete buttons for parseable entries; inline `CustomerCommentForm` in edit mode; inline delete confirmation
- [x] Create `components/customers/CustomerCommentsList.tsx` — owns `editingIndex` + `isAdding` state; renders add form + comment rows (newest first); calls `onAdd`/`onEdit`/`onDelete`
- [x] Wire `CustomerCommentsList` into `CustomerProfileCenter` — replaced old notes section; parse `customer.comments` on render; reconstruct + call `onSave` on mutations

## Backend

No new files. `comments` is already in `Customer.$fillable` and `update()` validation. ✓

## Verification

- [ ] `parseComments` correctly parses the `{text} /{author}, {date}, {time} @{scope}` format
- [ ] Lines that don't match the pattern render as plain text with no edit/delete controls
- [ ] `serializeComments` reconstructs lines joined by `\n` with correct format
- [ ] Comments display newest first (reversed order)
- [ ] "Add comment" section expands/collapses on click
- [ ] Submitting add form appends new comment and saves via `onSave`; form closes on success
- [ ] Edit button appears on hover; opens inline form pre-filled with existing text and scope
- [ ] Submitting edit updates that line's text/scope; author and date/time preserved
- [ ] Delete shows inline "Confirm delete / Cancel" before deleting
- [ ] Confirming delete removes the line and saves immediately
- [ ] `saving=true` disables all comment controls while PATCH is in-flight
- [ ] Author field is required in add mode; validated max 64 chars, no commas or slashes
- [ ] Text field rejects newlines and enforces max 1000 chars client-side
- [ ] Scope defaults to "all" if left blank
- [ ] Empty state shows "No comments yet" with icon when `customer.comments` is null/empty
