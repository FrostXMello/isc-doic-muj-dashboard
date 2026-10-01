# MUJ Internationalization — source audit

Review date: **2026-09-30**. Reviewer: platform maintainers (ISC), for DoIC.

This records which official Manipal University Jaipur pages the platform's data was taken from, what was imported, what was left out, and what DoIC still needs to confirm. The TypeScript source of truth is `src/lib/official/`. Run `npm run data:check -- --links` after any change.

## Rules applied

- Names are copied exactly as displayed, typos included. A separate `normalizedName` fixes spelling for display and search only.
- Nothing is inferred:
  - The partner page gives no signing date, expiry, status, or collaboration scope, so these are recorded as `not-stated` (status) or null (dates).
  - Eligibility, fees, deadlines and contacts are recorded only where a page states them.
- Agreement types are kept as each row states them. Only 6 of the 132 rows name a type. A listing is not treated as an MoU, and a collaboration is not upgraded to an exchange.
- Visits, fairs, and external listings are not treated as partnerships.
- Official imports are `source-imported`: copied from the page, not confirmed against signed documents. Unclear, duplicated, or conflicting entries are `needs-review`. Nothing is `verified`.
- Where two official pages disagree, both URLs are recorded below; neither is silently chosen.

## Pages reviewed

All on `https://jaipur.manipal.edu/`. Keys match `officialSources` in `src/lib/official/source.ts`.

| Page | Used for |
| --- | --- |
| `about-international-collaborations.php` (Overview) | Directorate name, summary, functions, team |
| `international-collaboration-and-partners.php` (Collaboration & Partners) | **116 institutions, 132 collaboration rows**, countries, region headings, websites, agreement wording; nodal contacts (internal only) |
| `exchange-programs.php` | Student Exchange programme, inbound/outbound process |
| `img/pdf/Student-Exchange-Policy.pdf` | Semester Exchange programme; name as used on DoIC documents |
| `global-progams-offered.php` | Dual degree programmes (Deakin, Melbourne) |
| `pathway-progression.php` | Approved pathway models (Iowa State, CESI, Queensland, UMKC) |
| `international-exchange-opportunities.php`, `academic-visit.php`, `delegation-visit.php` | Faculty exchange programme; 9 visits |
| `international-summer-school-2026.php`, `international-summer-school.php`, `upcoming%20-events.php`, `international-winter-school.php` | ISSMUJ 2026 / 2025 / 2024 and IWSMUJ-23 calls, flyers, and events |
| `international-expo-fairs.php` | Australia Day 2023, Campus France 2024 |
| `explore-india-program.php` | Explore India brochure; linked as a listing |
| `credit-exchange-forms.php` | Credit mapping policy and form |
| `process-information-others.php` | Office location, telephone, visa form, refund policy, process documents |
| `newsletter.php` | Synergy newsletters, volumes 1–6 |
| `international-scholarship-opportunities.php`, `international-internship.php`, `research-opportunities.php`, `student-bodies.php`, `study-tours.php`, `international-program-offered.php` | Linked as "other official listings" only; entries not copied because they change |
| `international-student-guide.php`, `national-universities-and-research-center.php` | Reviewed; not imported. The first is admissions guidance; the second lists Indian institutions, outside international collaborations |

## What was imported

| Record | Count | Notes |
| --- | --- | --- |
| Institutions | 116 + 1 | 116 from the partner table. The University of Melbourne comes only from the Global Programs page |
| Collaboration rows (agreements) | 132 | `ic-001`…`ic-132`, reference `DOIC-IC-###`, in page order; `source_section` = region › country heading |
| Countries | 39 | Page headings normalised: "UK" → United Kingdom, "SAUDI ARAB" → Saudi Arabia, "PRAGUE" → Czechia, "MACEDONIA" → North Macedonia |
| Regions | 7 | Asia 39, Europe 50, Australia 13, North America 10, Africa 3, South America 1, Oceania 1 (institutions, incl. Melbourne) |
| Programme types | 6 | Student Exchange, Semester Exchange, Pathway/Progression, Academic and Delegation Visits, Dual Degree, Summer and Winter Schools |
| Offerings | 6 | 4 pathway models, 2 dual degrees; no availability or windows stated |
| Calls | 4 | ISSMUJ 2026 (registration deadline 31 May 2026, published), ISSMUJ 2025 (28 May 2025, archived), ISSMUJ 2024 and IWSMUJ-23 (archived, no deadline stated) |
| Documents | 17 | Policies, forms, flyers, brochure, Synergy vols 1–6, refund policy, process documents, DIC list |
| Activities | 14 | 9 visits (2023), 2 fairs, 3 summer schools. Only details the pages state |
| Nodal contacts | 132 | **Internal only**: gitignored `data/private/`, hosted `institution_contacts` (RLS) |

Agreement wording stated on the page (all other 126 rows: `not-stated`):

| Row | Stated wording | Type recorded |
| --- | --- | --- |
| ic-029 Southern Federal University | "Agreement on Mutual Corporation with Addendum 1 to 3" | other (quoted as displayed) |
| ic-040 Ajman University | "Student Exchange Agreement (SEA)" | student-exchange |
| ic-050 CESI | "Addendum" | addendum |
| ic-070 University of Leicester | "MoU" | mou |
| ic-071 University of Leicester | "Agreement of Cooperation" | agreement-of-cooperation |
| ic-119 Florida International University (College of Engineering and Computing) | "Academic Agreement" | academic-agreement |

## Existing data before this sync

| Earlier record | Classification | Action |
| --- | --- | --- |
| 17 names in the public illustrative directory (`src/lib/data.ts`) | 1 official (The University of Newcastle), 16 not on the official page | Newcastle kept (id preserved) as official. The 16 moved to `legacyDirectoryInstitutions`: `needs-review`, hidden from the public site, and their `/partners/[slug]` and `/student-portal/partners/[slug]` URLs redirect (307) to `/student-portal/partners` |
| Home-page figures (127+ universities, 40+ countries, 18+ programmes, 500+ students) | Illustrative, unverifiable | Removed. Replaced by counts computed from the official page (116 / 132 / 39 / 7 / 6) |
| Country "summary" notes on the directory | Illustrative | Removed |
| Four programme categories on the public site | Source-derived, incomplete | Replaced by the six official programme types |
| Sample institutions ("Example …") with 10 agreements, 8 offerings, 8 calls, 9 documents, 8 activities | Fictional | Kept only behind `INTERNAL_SAMPLE_DATA=true` (off by default and on Vercel); local-only seed `03_sample.sql`; never loaded to hosted |

## Conflicts and ambiguities

Each is flagged `needs-review` on the record.

**Between official pages**

- Directorate name appears as "Directorate of International Collaborations" (Overview, Student Exchange Policy), "Directorate of International Collaboration (DoIC)", and "Directorate of International and Collaborations (DoIC)". The site uses the first.
- The University of Melbourne dual degree: the Global Programs page lists "BSc Advanced (Hons)"; the site menu names "Bachelor of Science (Honours with Research) (Dual degree program (2+2) in collaboration with University of Melbourne, Australia)". Melbourne is not in the partner table.
- Southern Federal University (`academic-visit.php`, 22–24 June 2023) and Illinois State University (`academic-visit.php`, 16 March 2023): visits "to sign a Memorandum of Understanding". The partner page states no MoU for either, so no type is recorded.
- Strathclyde: partner page "Strathclyde, Glasgow, UK’"; `international-scholarship-opportunities.php` "University of Strathclyde Glasgow".

**Within the partner page**

- Listed more than once (one institution, several rows kept):
  - Sunway (two spellings), National Law College, and Southern Federal University (three rows).
  - Ural State Law University and its Eurasian Research Centre; University of Crete and its Institute of Theoretical and Computational Physics.
  - University of Florida and its Board of Trustees; CNR-NANOTEC (two spellings); University of Ostrava (two spellings).
- Under two region headings:
  - University of Malta: ASIA and EUROPE, recorded as Europe.
  - Antalya Academy of Tourism: ASIA and EUROPE, recorded as Asia (first listing).
  - emlyon business school: FRANCE and AUSTRALIA, recorded as Europe.
  - University for Information Science and Technology St Paul The Apostle Ohrid: MACEDONIA and USA, recorded as North Macedonia.
- Links:
  - UMKC's "Visit Website" points to ufl.edu, so the website is left empty.
  - Several rows link a placeholder "#".
  - King Mongkut's University of Technology links kmutnb.ac.th; the exact institution is not stated.
- Displayed names differ from the linked site: "Gdansk University Poland" (en.ug.edu.pl) and "Minsak State University" (bsu.by).
- On four rows (ic-003, ic-051, ic-052, ic-127), the nodal name, phone and email do not refer to the same person. The internal contact record is flagged.

**Other**

- Team: three Assistant Director entries exist only in commented-out HTML on the Overview page and are not shown. They were not imported.
- DIC list (`pdf/Dic.pdf`, linked from the partner page) returns 404. It is recorded with `publicly_accessible = false`.
- Visa Assistance Form (Microsoft Forms) needs sign-in, so it is recorded as not publicly accessible.
- Refund Policy 2024-25 and DoIC Process Documents are marked `needs-review`: they are linked from the process page, but their scope and currency are not stated.

## Not available on the official pages

These are left null or "Not stated", never filled in:

- Agreement signing dates, expiry, renewal, status, and collaboration areas.
- Institution cities and campus locations. Coordinates are country centres for the globe only.
- Offering availability, application windows, eligibility, fees, and credit rules, beyond what the exchange policy states.
- ISSMUJ 2024 and IWSMUJ-23 deadlines and dates; activity participants and outcomes.

## Excluded

- **International Student Cell student list/information**: not authoritative. It is not imported and not treated as verified.
- Scholarship, internship, research, study-tour, and admissions entries: linked, not copied.
- National (Indian) collaborations.
- Scratch downloads of the reviewed pages were kept outside the repository.

## Manual verification needed (DoIC)

1. Confirm the duplicated and multi-region entries above: is each row a separate agreement?
2. Supply signing dates, expiry, and status for the 132 rows from the signed documents; then mark confirmed records `verified`.
3. Confirm whether SFedU and Illinois State hold MoUs (visits recorded "to sign a Memorandum of Understanding").
4. Confirm the King Mongkut's institution, the UMKC website, and the four rows with mismatched nodal details.
5. Restore or replace the DIC list PDF link.
6. Decide whether any of the 16 earlier-directory names are partners. If so, add them to the official page first; the platform follows the official page.
