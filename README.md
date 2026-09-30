# DoIC · Manipal University Jaipur

The Directorate of International Collaboration (DoIC) website for Manipal University Jaipur, managed by the International Student Cell (ISC). It is the ISC-facing digital platform for international partners, programmes, opportunities, and later memorandum and data management.

## Current status

The homepage is complete. Inner pages are complete: the partner directory, a dynamic partner detail route, opportunities, a student-portal orientation, and an internal portal. A data-model proposal is in `docs/data-model.md`. There is no production database. The figures, institution names, and programme notes on the site are mock and illustrative.

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

Records come from typed sample data in `src/lib/internal/data/seed/`, read through async functions in `src/lib/internal/data/`. Institutions combine the public illustrative directory with fictional sample institutions; everything else is sample data and **not official DoIC data**. There is no authentication, no database, and no write actions yet. Create/edit buttons are placeholders.

## Run locally

No environment variables are required. Do not add a `.env` file for this checkpoint. If variables are introduced later, put them in `.env.local` (ignored by git) and list only the names in `.env.example`.

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

There is no `typecheck` script. `npm run build` is the type-aware production check.

## Project structure

```
src/app/            routes (App Router)
src/components/     homepage and inner-page UI
src/lib/data.ts     illustrative mock data (do not treat as official)
src/lib/directory.ts  partner rows and slugs derived from that mock data
src/lib/internal/   Internal Portal types, sample data, and data-access layer
src/components/internal/  Internal Portal shell and UI
docs/data-model.md  proposed future schema (not connected to the app)
docs/PROJECT_HANDOFF.md
public/             static files (empty at this checkpoint; icon is src/app/icon.svg)
```

## Roadmap

1. Current frontend (this checkpoint).
2. Finalize the data model in `docs/data-model.md`.
3. Choose a relational database and ORM.
4. Schema and migrations.
5. Add verified DoIC data.
6. Connect the frontend to that data.
7. Internal management workflows.

Do not start a database until the data model is agreed. The proposal keeps institutions, agreements, programmes, and programme availability as separate records.
