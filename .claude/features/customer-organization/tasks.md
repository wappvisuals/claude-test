# Customer Organization Upsert — Tasks

## Frontend

- [x] Add `Organization` interface to `types/organization.ts` — `{ id: string; name: string }`
- [x] Add `searchOrganizations(q: string)` to `lib/api.ts` — GET /api/organizations
- [x] Add `upsertOrganization(customerId: number, payload)` to `lib/api.ts` — PUT /api/customers/{id}/organization
- [x] Create `hooks/useOrganizations.ts` — debounced search; exposes `{ results, loading, error }`
- [x] Create `hooks/useOrganizationUpsert.ts` — exposes `{ upsert, saving, error, fieldErrors }`
- [x] Create `components/customers/CustomerOrganizationForm.tsx` — org id input + Search button + org name input (required when creating); Save / Cancel
- [x] Create `components/customers/CustomerOrganizationSection.tsx` — shows current org (id + name or "— none —"); [Link / Change] button opens `CustomerOrganizationForm` inline; on success calls `onSave` with updated customer

## Backend

- [x] Create `app/Models/CustomerOrganization.php` — `$table = 'customer_organizations'`, `$primaryKey = 'id'`, `$keyType = 'string'`, `$incrementing = false`
- [x] Create `app/Http/Resources/OrganizationResource.php` — returns `{ id, name }`
- [x] Create `app/Http/Controllers/Api/OrganizationController.php` — `index()`: validate `q` + `per_page`, search by id prefix or name LIKE, return paginated `OrganizationResource::collection`
- [x] Create `app/Http/Controllers/Api/CustomerOrganizationController.php` — `upsert()`: validate, `CustomerOrganization::updateOrCreate`, `$customer->update(['organization_id'])`, return `CustomerResource`
- [x] Add `organization_id` to `Customer.$fillable`
- [x] Add routes to `routes/api.php`: `GET /api/organizations`, `PUT /api/customers/{id}/organization`

## Verification

- [x] Section shows current org id + name when customer has an organization
- [x] Section shows "— none —" when `organization_id` is null
- [x] [Link / Change] opens the inline form
- [x] Typing an org id and clicking Search fetches that org; pre-fills name if found
- [x] If org not found by search, name field is required and editable
- [x] If org found, name field is pre-filled but still editable (allows updating org name)
- [x] Save creates new org + links customer when org_id did not previously exist
- [x] Save updates existing org name + links customer when org_id already exists
- [x] Cancel closes the form without saving
- [x] `organization_id` max 10 chars enforced client-side and server-side
- [x] `name` required client-side when org not found; nullable server-side (conditional)
- [x] Section reflects updated org id after successful save
- [x] Backend returns 422 for `organization_id` exceeding 10 chars
- [x] Backend returns 404 for unknown customer id
