```
Generate a feature plan for [Feature Name].

Project reference: see .claude/Plan.md for tech stack and conventions.

### Database
Table: `[table_name]`   Primary key: [pk_column]
Do NOT create a migration — table already exists.

Columns:
[paste full column list]

List view shows only: [col1], [col2], [col3], [col4], [col5]
All columns available on the detail page.

### Features

#### 1. [Name] — List
- Paginated table: columns [col1], [col2], [col3], [col4], [col5]
- Sortable headers, loading skeleton, empty state

#### 2. [Name] — Search
- Tokenized: split query by spaces ("A B" → first_name=A AND last_name=B)
- Fuzzy: "Jhon" finds "John" (SOUNDEX)
- Field priority ranking (name > email > phone > address)
- Filters: [filter1 (type)], [filter2 (type)]
- Highlight matched tokens in results table

#### 3. [Name] — Detail Page
- Read-only, route: /[resource]/:id
- Clickable rows in list navigate here
- Back button returns to list

### Output
Generate .claude/features/[feature-name]/plan.md — include:
  - API endpoints table (method, path, description)
  - Query params per endpoint
  - Response envelope + example JSON object
  - Full DB column list
  - Table: list display columns vs detail-only columns
  - Search algorithm (scoring table: +score per condition)
  - Routes table (path → component)
  - Component map (ASCII tree with annotations)
  - File map (backend + frontend)
  - States — per component/hook: name, type, initial value, description
  - Props — per component: name, type, required, description
  - Validation rules — backend per endpoint + frontend client-side
  - Agents section (see below)

Generate .claude/features/[feature-name]/tasks.md — include:
  - Frontend section (listed BEFORE backend)
  - Backend section
  - Verification checklist
```