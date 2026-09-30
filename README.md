# DoIC · Manipal University Jaipur

The Directorate of International Collaboration (DoIC) website for Manipal University Jaipur, managed by the International Student Cell (ISC). It is the ISC-facing digital platform for international partners, programmes, opportunities, and later memorandum and data management.

## Current status

The homepage is complete. Inner pages are complete: the partner directory, a dynamic partner detail route, opportunities, a student-portal orientation, and an internal portal. A Supabase backend foundation (PostgreSQL schema, Auth roles, RLS, Storage) is in `supabase/`; the deployed site still reads the static seed data until staff sign-in exists. The figures, institution names, and programme notes on the site are mock and illustrative.

**Do not read the current mock data as official MUJ or DoIC data.** It is not a published list of agreements, not official statistics, and not a contact directory.

## Internal Portal

A staff workspace at `/internal` with its own shell (sidebar and top bar) in place of the public navbar and footer.

| Route | Content |
| --- | --- |
| `/internal` | Dashboard: summary counts, upcoming activities, renewals, items needing attention |
| `/internal/universities` | Institutions (list + `[id]` detail) |
| `/internal/mous` | Agreements / MoUs (list + `[id]` detail) |
| `/internal/programs` | Programme offerings (list + `[id]` detail) |
| `/internal/opportunities` | Application calls (list + `[id]` detail) |
| `/internal/activities` | Visits, delegations, events (list + `[id]` detail) |
| `/internal/documents` | Document register (list + `[id]` detail) |
| `/internal/reports` | Aggregate breakdowns |
| `/internal/settings` | Placeholder |

Records are read through async functions in `src/lib/internal/data/`. By default they come from typed sample data in `src/lib/internal/data/seed/`; with `INTERNAL_DATA_SOURCE=supabase` they come from Supabase as the signed-in user (see Backend). Institutions combine the public illustrative directory with fictional sample institutions; everything else is sample data and **not official DoIC data**. There is no sign-in UI and no write actions yet. Create/edit buttons are placeholders.

## Backend (Supabase)

- `supabase/migrations/` — schema (institutions, agreements, programmes, programme availability, opportunities, documents, activities, profiles/roles, student records, audit log), RLS policies, and the private `institutional-documents` bucket.
- `supabase/seeds/` — local-only seeds generated from the TypeScript seeds (`npm run db:seed:generate`); sample rows are marked `data_source = 'sample'`.
- `supabase/tests/database/` — pgTAP RLS tests.
- Roles: `student`, `isc_team`, `doic_admin`, `leadership`, stored in `public.user_roles` (not user metadata).
- Hosted project: ref `oqmwrifysignwmgxiecd` (ap-south-1). Migrations are applied; no seed or sample data is loaded there. Vercel has the public URL and publishable key, with `INTERNAL_DATA_SOURCE=static`.

Details, access rules, and the first-admin step are in `docs/PROJECT_HANDOFF.md`; the table list is in `docs/data-model.md`.

Local database (requires Docker):

```bash
npx supabase start        # local stack
npx supabase db reset     # migrations + seeds
npx supabase test db      # RLS tests
```

## Run locally

No environment variables are required; the site runs on the static seed data. To point the Internal Portal at Supabase, copy `.env.example` to `.env.local` (ignored by git) and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `INTERNAL_DATA_SOURCE=supabase`. Without a signed-in staff session, RLS hides internal records in that mode.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Scripts defined in `package.json`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js development server (port 3000) |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run db:seed:generate` | Regenerate `supabase/seeds/*.sql` from the TypeScript seeds |

There is no `typecheck` script. Use `npx tsc --noEmit`, or `npm run build` as the type-aware production check.

## Project structure

```
src/app/            routes (App Router)
src/components/     homepage and inner-page UI
src/lib/data.ts     illustrative mock data (do not treat as official)
src/lib/directory.ts  partner rows and slugs derived from that mock data
src/lib/internal/   Internal Portal types, sample data, and data-access layer
src/lib/supabase/   Supabase clients (@supabase/ssr; user session, no service role)
src/proxy.ts        Supabase session refresh for /internal (supabase mode only)
src/components/internal/  Internal Portal shell and UI
supabase/           migrations, local seeds, RLS tests, CLI config
scripts/            seed SQL generator
docs/data-model.md  implemented schema + original proposal
docs/PROJECT_HANDOFF.md
public/             static files (empty at this checkpoint; icon is src/app/icon.svg)
```

## Roadmap

1. Frontend and Internal Portal (done).
2. Supabase schema, RLS, storage, and repository integration (done; static data remains the default).
3. Staff sign-in and role assignment.
4. Internal management workflows and document uploads.
5. Add verified DoIC data.

Institutions, agreements, programmes, and programme availability stay separate tables.
