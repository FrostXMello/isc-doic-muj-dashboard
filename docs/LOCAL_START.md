# Start here on your Mac

Use this when you leave the Cursor cloud agent and work only from your machine.

## 1. Get the project

```bash
mkdir -p ~/Documents/Projects
cd ~/Documents/Projects
git clone https://github.com/FrostXMello/isc-doic-muj-dashboard.git
cd isc-doic-muj-dashboard
git checkout cursor/qs-2026-rankings-mous-filters-2867
```

You should end up at:

`~/Documents/Projects/isc-doic-muj-dashboard`

## 2. Install and configure

```bash
npm ci
cp .env.example .env.local
```

Edit `.env.local` and set at least:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
INTERNAL_DATA_SOURCE=supabase
INTERNAL_SAMPLE_DATA=false
```

These are the same public values already on the Vercel project `isc-doic-muj-dashboard`.

## 3. MoU register (optional, local only)

The Excel with nodal officers and expiry dates is **not** in git.

```bash
mkdir -p data/private
# copy your file here as:
# data/private/MoU details.xlsx
```

Then, when you want the portal to use that register locally:

```bash
# after extracting the workbook to mou_details_structured.json (or ask the agent to do it)
INTERNAL_LOCAL_REGISTER=true
INTERNAL_DATA_SOURCE=static
```

`data/private/` and `supabase/private/` stay on your machine only.

## 4. Run

```bash
npm run dev -- --port 4000
```

Open http://localhost:4000 — sign-in uses Supabase Auth.

## 5. What this branch already has

- QS World University Rankings **2027** (published **18 June 2026**)
- MoUs filters: Country → MoU status → MoU type → QS 2027 → MoUs recorded → Sort
- Open PR: https://github.com/FrostXMello/isc-doic-muj-dashboard/pull/1

## 6. Production

- App: https://isc-doic-muj-dashboard.vercel.app  
- Repo: https://github.com/FrostXMello/isc-doic-muj-dashboard  
- Vercel project: `frostxmellos-projects/isc-doic-muj-dashboard`

You do not need the cloud agent chat after this. Work only from the folder above and push to GitHub as usual.
