# Tapestry

AI-powered meeting scheduling intelligence that helps globally distributed teams find the *best* time to meet — factoring in culture, religion, family obligations, weather, and personal context.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed 7 demo employees
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter, TanStack Query, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: OpenAI (gpt-4o via Replit AI integrations)

## Where things live

- `artifacts/tapestry/src/` — React frontend
  - `App.tsx` — root router: `/`, `/dashboard`, `/onboarding`, `/schedule`
  - `Dashboard.tsx` — team roster with rich profile cards + live local times
  - `pages/OnboardingPage.tsx` — 3-step employee onboarding form
  - `pages/SchedulePage.tsx` — meeting scheduler + AI readiness report
- `artifacts/api-server/src/routes/` — Express routes
  - `employees.ts` — GET/POST employees
  - `context-insight.ts` — POST /api/context-insight (multi-employee meeting readiness)
- `lib/db/src/schema/employees.ts` — DB schema source of truth
- `lib/api-spec/openapi.yaml` — OpenAPI spec source of truth
- `scripts/src/seed.ts` — 7 realistic demo employees

## Architecture decisions

- Context-insight route accepts `{employeeIds, meetingDatetime}` and returns per-employee Green/Yellow/Red signals + aggregate recommendation. Employees are fetched from DB server-side, not passed by client.
- All AI calls are parallel (one per attendee) to minimize latency.
- Context tags (Friday Prayer, School Pickup, etc.) are derived client-side from employee profile fields — no separate tag table needed at this scale.
- Preferred work hours stored as `HH:MM` strings + comma-separated days to keep the schema simple and flexible.

## Product

- **Landing page** (`/`) — marketing page explaining the value prop with CTAs to dashboard and schedule
- **Team Dashboard** (`/dashboard`) — all employees as cards with live local time, context tags (emoji + label), work hours, and personal notes
- **Onboarding** (`/onboarding`) — 3-step form: Basic Info → Work Schedule → Personal Context
- **Meeting Scheduler** (`/schedule`) — pick a time + attendees, AI returns per-person readiness signals + overall recommendation and alternatives

## Demo data

7 employees seeded via `pnpm --filter @workspace/scripts run seed`:
- Amara Okafor — Lagos, Nigeria — Islam, School pickup
- Priya Chandrasekaran — Mumbai, India — Hinduism, Elderly care, Migraines
- Mateus Ferreira — São Paulo, Brazil — Christianity, Cultural calendar
- Sophie Beaumont — London, UK — School pickup, compressed hours
- Kenji Watanabe — Tokyo, Japan — Buddhism, Golden Week
- Laila Al-Rashid — Nairobi, Kenya — Islam, Ramadan health context
- Daniel Goldstein — New York, USA — Judaism, Shabbat observer

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `pnpm --filter @workspace/api-spec run codegen` must be re-run any time the OpenAPI spec changes
- The `lib/api-zod/src/index.ts` file must manually export the correct types from `./generated/types` — update it when the OpenAPI schema types change
- `scripts/src/seed.ts` uses `onConflictDoNothing()` — safe to run multiple times
- Direct `drizzle-orm` imports in `scripts/src/` will fail (not a direct dep) — use `@workspace/db` exports instead, or use `pool.query()` for raw SQL

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
