# Edit Customer Details — Tasks

## Frontend

- [ ] Add `CustomerUpdatePayload` interface to `types/customer.ts`
- [ ] Add `updateCustomer(id, payload)` to `lib/api.ts` (PATCH, returns `Customer`)
- [ ] Create `hooks/useUpdateCustomer.ts` — exposes `{ update, saving, error, fieldErrors }`
- [ ] Create `components/customers/CustomerEditForm.tsx` — controlled form with Name / Emails / Phones / Address / Identity sections and FormActions (Cancel + Save)
- [ ] Update `components/customers/CustomerDetailPage.tsx` — add `isEditing` state, Edit button (top-right, hidden when editing), swap `CustomerDetailCard` ↔ `CustomerEditForm` based on `isEditing`

## Backend

- [ ] Add `update()` method to `CustomerController` — validate PATCH body, call `$customer->update()`, return `new CustomerResource($customer)`
- [ ] Add `PATCH /api/customers/{id}` route in `routes/api.php`

## Verification

- [ ] Edit button appears on detail page (top-right) and hides when edit mode is active
- [ ] Clicking Edit replaces `CustomerDetailCard` with `CustomerEditForm` in-place
- [ ] `CustomerDetailHeader` (name + status) remains visible in both view and edit modes
- [ ] All editable fields pre-fill from existing customer data
- [ ] Name section: first_name and last_name inputs save correctly
- [ ] Emails section: email and alternative_email validate format client-side before submit
- [ ] Phones section: tel and alternative_tel inputs save correctly
- [ ] Address section: careof, adress, post_nr, ort inputs and region_code Select save correctly
- [ ] Identity section: sex Select (M / F / blank) and pers_nr input save correctly
- [ ] Save button is disabled when form is not dirty (no changes made)
- [ ] Save button shows loading state (spinner / disabled) while request is in-flight
- [ ] Cancel button exits edit mode and reverts form — customer detail card reappears
- [ ] On success: edit mode closes, detail card shows updated values
- [ ] On 422: field-level error messages render inline beneath the relevant inputs
- [ ] On server error (500 / network): top-level error banner shown above FormActions
- [ ] Back button navigates to list in both view mode and edit mode
- [ ] Backend returns 422 for invalid email format
- [ ] Backend returns 422 for invalid region_code value
- [ ] Backend returns 422 for invalid sex value
- [ ] Backend returns 404 for unknown customer id
