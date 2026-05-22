# Customer Reminders — Tasks

## Frontend

- [x] Create `components/customers/CustomerRemindersCard.tsx` — shows Active/Inactive status; Activate button (when off); Deactivate button (when on) that reveals inline reason form; formats reason into comment line and calls `onSave` with `{ reminders, comments }`

## Backend

- [x] Add `'reminders'` to `Customer.$fillable`
- [x] Add `'reminders' => 'nullable|boolean'` to `CustomerController.update()` validation

## Verification

- [ ] Card shows "Active" (green) when `customer.reminders === true`
- [ ] Card shows "Inactive" (gray) when `customer.reminders === false`
- [ ] Activate button sends `{ reminders: 1 }` and card updates on success
- [ ] Deactivate button reveals inline reason form
- [ ] Reason field is required before confirming deactivation
- [ ] On confirm: sends `{ reminders: 0, comments: "<existing>\n<reason line>" }` with reason formatted as a standard comment entry
- [ ] Reason validates max 500 chars, no newlines
- [ ] Cancel on reason form closes it without saving
- [ ] Controls are disabled while `saving=true`
- [ ] Backend rejects non-boolean `reminders` value with 422
