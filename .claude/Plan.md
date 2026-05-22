# Project Plan

## Project Overview

This project is a Laravel 12 + React 19 single-page application sandbox/starter, built to serve as a foundation for feature development against an existing MySQL database (`gracewel_grace`). The backend exposes a REST API through Laravel MVC, while the frontend is a React SPA mounted on a single Blade view. Pre-existing application tables (not managed by Laravel migrations) are accessed via Eloquent models with explicit table bindings, allowing clean integration without disrupting the legacy schema.

---

## Tech Stack

| Layer | Package | Version |
|---|---|---|
| Runtime | PHP | ^8.2 |
| Framework | Laravel | ^12.0 |
| Frontend | React | ^19.2.5 |
| Frontend | React Router DOM | ^7.15.1 |
| Language | TypeScript | ^6.0.3 |
| Build | Vite | ^7.0.7 |
| Build | laravel-vite-plugin | ^2.0.0 |
| Build | @vitejs/plugin-react | ^5.2.0 |
| Styling | Tailwind CSS | ^4.0.0 (via @tailwindcss/vite) |
| Styling | tailwind-merge | ^3.6.0 |
| Styling | clsx | ^2.1.1 |
| UI | Radix UI Select | ^2.2.6 |
| UI | Radix UI Slot | ^1.2.4 |
| UI Pattern | shadcn/ui | component pattern |
| Database | MySQL | gracewel_grace |
| Queue | Database driver | — |
| Cache | Database driver | — |
| Session | Database driver | — |
| Dev Tools | Laravel Sail | Docker |
| Dev Tools | Laravel Pail | log viewer |
| Dev Tools | Laravel Pint | code formatter |

---

## Architecture

### Backend

Standard Laravel MVC. No modules pattern is used. REST API endpoints are defined in `routes/api.php` (created per feature). All API controllers live under `app/Http/Controllers/Api/`. Services encapsulating business logic live in `app/Services/`. Eloquent models live in `app/Models/`. API response transformation is handled by Laravel API Resources in `app/Http/Resources/`.

### Frontend

A React SPA mounted on a single Blade view. No global state manager is used. The component tree is organised by feature. Routing is handled client-side via React Router DOM. UI primitives follow the shadcn/ui component pattern using Radix UI, CVA variants, and `forwardRef`. The path alias `@/` resolves to `resources/js/`.

### API Contract

All endpoints follow standard Laravel paginator envelope shapes:

- **List responses**: `{ data, links, meta }`
- **Single-resource responses**: `{ data }`

---

## Database

**Connection**: `mysql` → database `gracewel_grace`

### Laravel System Tables

| Table | Primary Key | Purpose |
|---|---|---|
| users | id | Authentication |
| password_reset_tokens | email | Password resets |
| sessions | id | Session storage |
| cache | key | Application cache |
| cache_locks | key | Cache locking |
| jobs | id | Queue jobs |
| job_batches | id | Queue job batches |
| failed_jobs | id | Failed queue jobs |

### Application Tables

Pre-existing tables (e.g. `customer_profile`) exist in `gracewel_grace` and are not managed by Laravel migrations. They are accessed via Eloquent models with explicit `$table` and `$primaryKey` properties. No migration files are created for these tables.

**Full schema reference:** `.claude/database.md` — read this before planning or implementing any feature that touches the database.

---

## Conventions

### PHP / Backend

| Concern | Location |
|---|---|
| API Controllers | `app/Http/Controllers/Api/` |
| Services | `app/Services/` |
| Models | `app/Models/` |
| API Resources | `app/Http/Resources/` |

### Frontend

| Concern | Location |
|---|---|
| Feature components | `resources/js/components/[feature]/` |
| Shared UI primitives | `resources/js/components/ui/` (shadcn/ui — do not modify) |
| Custom hooks | `resources/js/hooks/` |
| TypeScript types | `resources/js/types/` |
| API call functions | `resources/js/lib/api.ts` |
| Path alias root | `@/` → `resources/js/` |

### API Response Shape

All list endpoints return `{ data, links, meta }`. All single-resource endpoints return `{ data }`. No bare arrays or bare objects.

### shadcn/ui Components

Components under `resources/js/components/ui/` must not be modified directly. Customise by composing them in feature-level components.

---

## Development Workflow

| Task | Command |
|---|---|
| Start dev server (Laravel + queue + Pail + Vite) | `composer run dev` |
| Build frontend assets | `npm run build` |
| Run database migrations | `php artisan migrate` |
| Format PHP code | `./vendor/bin/pint` |
