# Customer Feature Tasks

## Frontend (priority)
- [x] TypeScript interfaces (types/customer.ts)
- [x] API layer (lib/api.ts)
- [x] useCustomers hook
- [x] useCustomerSearch hook (debounced)
- [x] useCustomer hook (single record fetch by id)

### Layout (shared shell — build before customer pages)
- [x] NavItem component (link with active state via useLocation)
- [x] Sidebar component (fixed left nav, logo + NavItem list)
- [x] Header component (top bar, accepts title prop)
- [x] AdminLayout component (Sidebar + Header + Outlet, wraps all routes)

### Customer components
- [x] HighlightText component
- [x] StatusBadge component
- [x] SortableHeader component
- [x] CustomerTableSkeleton component
- [x] CustomerTable + CustomerTableRow (rows link to /customers/:id)
- [x] CustomerSearch (input + status filter + date range)
- [x] CustomerDetailHeader (full name + StatusBadge + date_added)
- [x] CustomerListPage (orchestration — list ↔ search mode)
- [x] CustomerDetailPage (/customers/:id — read-only, back button)
- [x] CustomerDetailCard (contact, address, meta sections)
- [x] App.tsx router setup (AdminLayout wraps /customers + /customers/:id)

## Backend
- [x] Register API routes (bootstrap/app.php + routes/api.php)
- [x] Customer model (table = customer_profile, primaryKey = to_user)
- [x] CustomerSearchService (tokenized + fuzzy scoring)
- [x] CustomerController (index, show, search actions)
- [x] CustomerResource

## Verification
- [x] Sidebar visible on all pages, logo shown at top
- [x] Customers nav item is active (highlighted) when on /customers or /customers/:id
- [x] Header shows correct page title per route
- [x] List loads paginated with sort
- [x] Search "Per Gustafsson" finds exact match (high relevance score)
- [x] Search "Jhon" finds "John" (soundex fuzzy)
- [x] Status filter narrows results (list mode + search mode)
- [x] Matched tokens bold in Name + Address columns
- [x] Loading skeleton shows while fetching
- [x] Empty state shows when no results
- [x] Clicking a row navigates to /customers/:id
- [x] Detail page shows all customer fields read-only
- [x] Back button returns to the list
