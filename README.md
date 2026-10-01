# DoIC · Manipal University Jaipur

A platform for the Directorate of International Collaborations (DoIC), Manipal University Jaipur, operated by the International Student Cell (ISC) for DoIC. It presents MUJ's international partners, programmes, and opportunities, and gives DoIC staff an internal workspace for collaboration records.

This is **not the official MUJ website**. DoIC's pages on [jaipur.manipal.edu](https://jaipur.manipal.edu/about-international-collaborations.php) remain the authoritative source, and every record here links back to the page it came from.

## Current status

The public site and the Internal Portal read an official dataset imported from MUJ's Internationalization pages (reviewed 30 September 2026; see `docs/muj-internationalization-source-audit.md`):

- 116 institutions and 132 collaboration rows from the official [Collaboration & Partners](https://jaipur.manipal.edu/international-collaboration-and-partners.php) page, in 39 countries under the page's 7 region headings.
- 6 programme types, 6 institution offerings named on the pathway and dual degree pages, 4 summer and winter school calls, 17 documents, and 14 documented activities.

Official records are marked **source-imported**: copied from the official page, not confirmed against signed agreements. The partner page gives no signing dates, expiry, or status, so none is shown or inferred; agreement types are kept exactly as each row states them. Unclear or conflicting entries are marked **needs review**.

Nodal officer contacts from the partner page are **internal only**. They are kept out of this public repository and the site bundle, and stored only in the access-controlled `institution_contacts` table in Supabase.

## Public site

| Route | Content |
| --- | --- |
| `/` | Hero with globe of listed countries, official counts, programme types, partner preview |
| `/student-portal` | Student portal home: orientation and links to the official exchange policy and forms |
| `/student-portal/opportunities` | Summer and winter school calls with published deadlines, and other official listings |
| `/student-portal/partners` | Official partner directory: search, region, country, and agreement-wording filters |
| `/student-portal/partners/[slug]` | Institution as listed, its collaboration rows, programmes, and the official source link |
| `/student-portal/programs` | Programme types and the institutions each official page names |
| `/student-portal/about` | DoIC's role, team, office contact, and how this platform relates to DoIC |

The student portal requires sign-in (a `student` or any internal role). Every student-portal page shows the portal's own top nav (Home, Opportunities, Partner Universities, Programs, About DoIC). The old `/opportunities`, `/partners`, `/partners/[slug]`, `/programs`, and `/about` URLs redirect permanently (308) to their `/student-portal/...` paths. Partner pages for names from the earlier illustrative directory that are not on the official page redirect (307) to `/student-portal/partners`.

## Internal Portal

A staff workspace at `/internal` with its own shell (sidebar and top bar) in place of the public navbar and footer.

| Route | Content |
| --- | --- |
| `/internal` | Dashboard: counts, records flagged for review, upcoming activities |
| `/internal/universities` | Institutions with source and verification badges (list + `[id]` detail) |
| `/internal/mous` | Collaboration rows, types as stated (list + `[id]` detail) |
| `/internal/programs` | Programme offerings (list + `[id]` detail) |
| `/internal/opportunities` | Application calls (list + `[id]` detail) |
| `/internal/activities` | Officially documented visits and events (list + `[id]` detail) |
| `/internal/documents` | Official documents with their links and public-access flag (list + `[id]` detail) |
| `/internal/reports` | Aggregate breakdowns, including verification |
| `/internal/settings` | Your account, portal access (role grants, DoIC admins only), data source, sample flag, contact access, and official source pages |

Records are read through async functions in `src/lib/internal/data/`:

- By default (`INTERNAL_DATA_SOURCE=static`) they come from the official dataset in `src/lib/official/`. Nodal contacts are never available in this mode; detail pages show "Restricted — available to signed-in DoIC staff".
- With `INTERNAL_DATA_SOURCE=supabase` they come from Supabase as the signed-in user, under RLS. Contacts are loaded only for users holding an internal role.
- Fictional sample records (&ldquo;Example &hellip;&rdquo; institutions and linked rows) are included only when `INTERNAL_SAMPLE_DATA=true`, and are badged.

The Internal Portal requires an internal role (`doic_admin`, `isc_team`, or `leadership`). Apart from role grants there are no write actions yet; create and edit buttons are placeholders.

## Sign-in

One sign-in page, `/login` (email and password), serves both portals. After sign-in, roles from `public.user_roles` decide the destination: any internal role opens `/internal`, `student` alone opens `/student-portal`, and an account without a role sees `/access-pending`. `src/proxy.ts` and the portal layouts both enforce this server-side. Password reset runs through `/forgot-password` → email link → `/auth/callback` → `/reset-password`. New accounts receive no role; a DoIC admin grants roles in `/internal/settings`. Creating the first admin is described in `docs/PROJECT_HANDOFF.md`.

## Backend (Supabase)

- `supabase/migrations/` — schema, RLS policies, the private `institutional-documents` bucket, provenance columns, `institution_contacts` (internal-only), and `agreement_public_summaries` (a safe projection of agreement type for public institutions).
- `supabase/seeds/` — generated by `npm run db:seed:generate` from the TypeScript data:
  - `01_official.sql` holds the official records as idempotent upserts, safe for hosted.
  - `02_directory.sql` holds earlier directory names kept for review; they are not public.
  - `03_sample.sql` holds fictional rows for **local development only**.
- `supabase/private/` (gitignored) — generated contacts SQL, built from the gitignored `data/private/muj-nodal-contacts.json`.
- `supabase/tests/database/` — pgTAP RLS tests.
- Roles: `student`, `isc_team`, `doic_admin`, `leadership`, stored in `public.user_roles` (not user metadata).
- Hosted project: ref `oqmwrifysignwmgxiecd` (ap-south-1).
  - All migrations are applied.
  - Loaded seeds: official records, earlier directory names, and internal contacts. No sample data is loaded.
  - Vercel has the public URL and publishable key, with `INTERNAL_DATA_SOURCE=static`.

Details, access rules, and the first-admin step are in `docs/PROJECT_HANDOFF.md`; the table list is in `docs/data-model.md`.

Local database (requires Docker):

```bash
npx supabase start        # local stack
npx supabase db reset     # migrations + seeds (including local-only samples)
npx supabase test db      # RLS tests
```

## Run locally

The public pages need no environment variables. The portals need sign-in, so copy `.env.example` to `.env.local` (ignored by git) and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; without them, portal routes redirect to `/login`, which reports that sign-in is unavailable. Add `INTERNAL_DATA_SOURCE=supabase` to read Internal Portal records from Supabase under RLS instead of the static dataset.

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
| `npm run db:seed:generate` | Regenerate `supabase/seeds/*.sql` (and private contacts SQL, when the JSON is present) |
| `npm run data:check` | Data-quality checks: duplicates, names, regions, foreign keys, provenance, redirects, contact shapes. Add `-- --links` to request every official URL |

There is no `typecheck` script. Use `npx tsc --noEmit`, or `npm run build` as the type-aware production check.

## Updating the official data

1. Re-read the official pages listed in `src/lib/official/source.ts`. Update `src/lib/official/` (partners, countries, internationalization) and `SOURCE_REVIEWED_ON`. Never infer status, dates, eligibility, fees, deadlines, or contacts.
2. `npm run data:check -- --links`.
3. `npm run db:seed:generate`, then load `01_official.sql` (and `02_directory.sql`) into hosted in a transaction. The steps are in `docs/PROJECT_HANDOFF.md`.

## Project structure

```
src/app/                  routes (App Router)
src/components/           public-site UI
src/components/internal/  Internal Portal shell and UI
src/lib/official/         official MUJ dataset (source of truth) and public projections
src/lib/data.ts           site copy and contact details derived from the official data
src/lib/internal/         Internal Portal types, data-access layer, sample seeds
src/lib/supabase/         Supabase clients (@supabase/ssr; user session, no service role)
src/lib/auth/             roles, session, safe redirects, sign-in and role-management server actions
src/components/auth/      sign-in, password reset, and account UI
src/proxy.ts              session refresh and portal access redirects
supabase/                 migrations, seeds, RLS tests, CLI config
scripts/                  seed SQL generator, data-quality checks
docs/                     source audit, data model, project handoff
```

## Roadmap

1. Frontend and Internal Portal (done).
2. Supabase schema, RLS, storage, and repository integration (done).
3. Official MUJ data import with provenance (done; source-imported, awaiting DoIC confirmation).
4. Unified sign-in and role assignment (done); next, create the first admin and switch the portal to `INTERNAL_DATA_SOURCE=supabase`.
5. Internal management workflows, document uploads, and DoIC verification of records.
