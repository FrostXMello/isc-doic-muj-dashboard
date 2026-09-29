# Project handoff

Checkpoint of the DoIC MUJ site so another device can clone it and continue. This file describes the tree that was pushed. It does not add features.

Remote: `https://origin.cursor.com/git/gagneet-singh/tmp-1a67893322d14da5.git`  
Branch: `main`

## Current state

Implemented:

- Homepage: navigation, hero with the globe, illustrative network figures, editorial points, opportunity register, partner preview, and closing call to action.
- Partner directory at `/partners`: search by institution, filter by region then country, numbered list grouped region → country → institution.
- Partner detail at `/partners/[slug]`: one sample institution, geographic fields, illustrative coordinates, and explicit unpublished fields. An unknown slug uses the existing not-found page.
- Opportunities at `/opportunities`: Student Exchange, Semester Exchange, Pathway Programs, and Academic Visits, using the descriptions already in the mock data.
- Student portal at `/student-portal`: orientation only (explore, understand, compare, contact). No sign-in and no application.
- Internal portal at `/internal`: a staff outline of later workspace areas. Status on every row is “Not in this stage.” No live counts.
- Programs, about, privacy, and terms pages in the same visual language.
- `docs/data-model.md`: a future schema proposal. The application does not read it.

Not implemented, on purpose:

- Database, ORM, migrations, or a connection from the UI to stored records.
- Authentication, sign-in, or roles.
- Applications or any form that submits or stores interest.
- Official MOU or agreement data.
- Eligibility, fees, deadlines, availability, credit recognition, or institution–programme mapping.
- Verified contacts (names, email, phone). The campus postal lines in the mock file are an address, not an officer.

Where those facts are missing, the UI says “Not published yet.” The internal workspace says “Not in this stage.”

## Routes

Discovered from `src/app`. No other pages exist.

| Route | File | What it does |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Homepage. |
| `/opportunities` | `src/app/opportunities/page.tsx` | Four opportunity descriptions and what is unpublished. |
| `/partners` | `src/app/partners/page.tsx` | Illustrative institution directory. |
| `/partners/[slug]` | `src/app/partners/[slug]/page.tsx` | One institution. Slug is derived from the sample name. Unknown slugs 404. |
| `/programs` | `src/app/programs/page.tsx` | Programmes as ways of studying, not as places. No institution mapping. |
| `/about` | `src/app/about/page.tsx` | Role of DoIC and the International Student Cell, plus the published campus address. |
| `/student-portal` | `src/app/student-portal/page.tsx` | Student orientation. Not an application portal. |
| `/internal` | `src/app/internal/page.tsx` | Operational outline for a later staff workspace. |
| `/privacy` | `src/app/privacy/page.tsx` | What this mock site does and does not collect. |
| `/terms` | `src/app/terms/page.tsx` | What the preview is, and that terms of use are not published. |

`src/app/not-found.tsx` is the 404 page, not a URL of its own. `src/app/icon.svg` is the icon.

## Architecture

- Next.js App Router, React, TypeScript, Tailwind CSS. UI primitives are the local shadcn-style button. There is no API layer and no database client.
- `src/lib/data.ts` is the only content source. The file’s own header says the values are illustrative placeholders, not official DoIC statistics or a memorandum list.
- `src/lib/directory.ts` builds institution rows from `partners[].universities` and derives URL slugs in the page layer. Those slugs are not official identifiers.
- Homepage sections (`hero`, `globe`, `stats`, editorial, opportunity preview, partner preview, call to action) read `src/lib/data.ts` directly.
- Inner pages read the same module, or the derived directory. They do not read `docs/data-model.md`.
- `docs/data-model.md` is the proposal for a later relational model: institution, agreement, programme, programme availability, contact, and document. It is not connected.

## Design direction

Dark, institutional, editorial. Deep navy field, restrained blue and cyan, display type for titles, numbered registers rather than card grids, hairline borders, and little motion. The globe is the homepage’s main visual. Do not restyle this into a generic SaaS dashboard (gradients, glass panels, pill-heavy controls, or decorative cards).

## Constraints

- Do not invent institutional data. If a fact is not in `src/lib/data.ts`, the interface should keep saying it is not published.
- Mock institution names, country notes, and programme sentences are illustrative.
- City coordinates on partner records are city positions for the globe, not verified campus coordinates. Several sample names share one city pin.
- Homepage statistics are demo figures, not official totals.
- Do not treat `docs/data-model.md` example JSON as DoIC records. Those examples are fictional and are labeled as such.

## Next planned work

Not implemented. In order:

1. Agree the data model in `docs/data-model.md`.
2. Choose a relational database and ORM.
3. Add schema and migrations.
4. Load verified DoIC data only.
5. Connect the frontend to that data.
6. Add internal management workflows.

Do not open a database until step 1 is agreed. Availability must stay a separate link between an institution and a programme. Do not assume every institution offers every programme.

## Device handoff

No environment variables are required to run this checkpoint.

```bash
git clone https://origin.cursor.com/git/gagneet-singh/tmp-1a67893322d14da5.git
cd tmp-1a67893322d14da5
npm install
npm run dev
```

Open `http://localhost:3000`.

If environment variables become necessary later, put secret values in `.env.local`. That pattern is gitignored. Add a `.env.example` with names and placeholders only, never real secrets.
