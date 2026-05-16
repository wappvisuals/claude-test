# Prompt: Create Project Plan

Use this to generate or update the **project-level** `.claude/Plan.md`.
This is the single source of truth for the whole project — tech stack, architecture,
conventions, and database overview. It is **not** feature-specific.

---

## When to use
- Starting a new project from scratch
- Onboarding Claude to an existing codebase
- After major architectural changes (new DB, new service layer, etc.)

---

## Step 1 — Spawn Explore agents in parallel

Before writing anything, run these agents simultaneously:

### Agent 1 — Tech Stack & Config
```
subagent_type: Explore
task: Scan config files to identify the full tech stack.
      Read: composer.json, package.json, .env, vite.config.ts,
            tsconfig.json, bootstrap/app.php, config/database.php.
      Report:
        - PHP / Laravel version
        - Frontend framework + version
        - Build tool (Vite / Webpack / Mix)
        - CSS + UI component library
        - Database driver + database name
        - Notable packages (queues, broadcasting, Scout, etc.)
```

### Agent 2 — Architecture & Folder Structure
```
subagent_type: Explore
task: Scan app/ and resources/js/ (top 2 levels only).
      Report:
        - Laravel folder structure (Controllers, Models, Services, Repositories, Modules)
        - Whether Modules pattern is used (app/Modules/*)
        - Frontend folder structure (pages, components, hooks, types, lib)
        - Routing pattern shape (api.php, web.php)
        - Base classes, shared traits, or utilities worth noting
```

### Agent 3 — Database Overview
```
subagent_type: Explore
task: List all migration files in database/migrations/.
      For each, report the table name and its primary columns.
      If migrations are absent, read Model files in app/Models/ for
      $table, $primaryKey, $fillable, $casts.
      Produce a table inventory: table name → key columns + one-line purpose.
```

---

## Step 2 — Spawn a Plan agent to synthesize

After both Explore agents finish:

```
subagent_type: Plan
task: Using the exploration findings, write .claude/Plan.md with these sections:

  1. Project Overview — one paragraph: what the system does and who uses it
  2. Tech Stack — exact versions (framework, frontend, build tool, UI lib, database)
  3. Architecture
       - Backend pattern (MVC / Service layer / Repository / Modules)
       - Frontend pattern (component structure, state management approach)
       - API style (REST / GraphQL) and standard response envelope shape
  4. Database Overview
       - Every table: name, primary key, one-line description
       - Note JSON columns or special types
  5. Conventions
       - Naming: controllers, models, components, hooks, types
       - File organization rules
       - API response envelope
       - Team-specific patterns visible in the code
  6. Development Workflow
       - Start dev server (commands)
       - Run migrations
       - Build for production
```

---

## Output

```
.claude/
└── Plan.md        ← project-level plan (generated here)
```

The project plan does NOT include:
- Feature-specific endpoints, component maps, states, props, or validation
- Feature task lists

Those belong in `.claude/features/[feature]/plan.md`.
Use `create_feature_plan.md` for those.
