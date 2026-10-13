-- DoIC MoU register ("0_MoU details.xlsx").
--
-- * agreement_details: the register's per-agreement fields (DoIC reference,
--   period, recorded status, rankings, faculty, opportunities, ...), one row
--   per agreement. Values are kept as recorded; typed dates live on
--   agreements.start_date / end_date.
-- * source_workbook_rows: every worksheet row exactly as extracted, with its
--   sheet and Excel row, the agreement or university it was matched to, and
--   any problems found while importing. The register stays traceable without
--   copying formula output or placeholders into typed columns.
-- * institution_contacts.source_note: contact text that is not a valid phone
--   number or email (for example "Phone: +662-797-0999 ext. 1863").
-- * private.workbook_import_ledger: what each import batch inserted or
--   changed, so scripts can roll a batch back exactly.
--
-- Everything is internal-only: anon gets no privileges; internal roles read;
-- editors maintain agreement details; administrators fix row matches.
-- Imports run as the database owner from a reviewed SQL file
-- (scripts/import-mou-workbook.ts), never from the app.

-- ---------------------------------------------------------------------------
-- Agreement details
-- ---------------------------------------------------------------------------

create table public.agreement_details (
  agreement_id uuid primary key references public.agreements (id) on delete cascade,
  -- "DoIC/MoU/<country>/<keyword>/<year>/<n>" as recorded.
  doic_reference text check (char_length(doic_reference) <= 200),
  initiation_year smallint check (initiation_year between 1950 and 2100),
  renewal_year smallint check (renewal_year between 1950 and 2100),
  -- Free text as recorded: "5 years", "perpetual", "NA".
  period_text text check (char_length(period_text) <= 100),
  -- Set only when the recorded expiry is not a date (e.g. "Perpetual").
  expiry_text text check (char_length(expiry_text) <= 100),
  -- "Active" / "Expired" / "Closed" as recorded; the portal derives its own
  -- status from agreements.record_status and dates.
  recorded_status text check (char_length(recorded_status) <= 60),
  qs_ranking text check (char_length(qs_ranking) <= 60),
  the_ranking text check (char_length(the_ranking) <= 60),
  faculty text check (char_length(faculty) <= 200),
  department text check (char_length(department) <= 200),
  opportunities text check (char_length(opportunities) <= 4000),
  -- Summer school or similar programme: a URL or text as recorded.
  programme_reference text check (char_length(programme_reference) <= 1000),
  remarks text check (char_length(remarks) <= 4000),
  -- Agreement file on DoIC's SharePoint (MUJ sign-in required).
  document_url text check (document_url ~* '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table public.agreement_details enable row level security;

create trigger agreement_details_set_audit_fields
  before insert or update on public.agreement_details
  for each row execute function public.set_audit_fields();

create trigger agreement_details_write_audit_log
  after insert or update or delete on public.agreement_details
  for each row execute function public.write_audit_log();

revoke all on public.agreement_details from anon;
revoke truncate, references, trigger on public.agreement_details from authenticated;

create policy "Internal roles read agreement details"
  on public.agreement_details for select to authenticated
  using ((select private.is_internal()));

create policy "Internal editors insert agreement details"
  on public.agreement_details for insert to authenticated
  with check ((select private.can_edit_internal()));

create policy "Internal editors update agreement details"
  on public.agreement_details for update to authenticated
  using ((select private.can_edit_internal()))
  with check ((select private.can_edit_internal()));

create policy "Administrators delete agreement details"
  on public.agreement_details for delete to authenticated
  using ((select private.is_content_admin()));

-- ---------------------------------------------------------------------------
-- Source worksheet rows
-- ---------------------------------------------------------------------------

create table public.source_workbook_rows (
  id uuid primary key default gen_random_uuid(),
  -- "<sheet key>:<excel row>", e.g. "mou-list:94". Re-imports upsert on it.
  import_key text not null unique check (import_key ~ '^[a-z-]+:[0-9]+$'),
  workbook text not null check (char_length(workbook) <= 200),
  sheet text not null check (sheet in ('mou-status', 'mou-list', 'mou-link', 'national-mous', 'renewal')),
  excel_row integer not null check (excel_row > 0),
  -- Column header -> extracted value, as in the source. Blank cells are absent.
  source_values jsonb not null check (jsonb_typeof(source_values) = 'object'),
  -- Column header -> formula, for cells that held a formula.
  source_formulas jsonb not null default '{}' check (jsonb_typeof(source_formulas) = 'object'),
  -- Problems found on import (shifted columns, formula output, bad dates).
  issues text[] not null default '{}',
  institution_id uuid references public.institutions (id) on delete set null,
  agreement_id uuid references public.agreements (id) on delete set null,
  match_status text not null check (
    match_status in ('matched', 'created', 'duplicate', 'unresolved', 'standalone')
  ),
  match_note text check (char_length(match_note) <= 1000),
  import_batch text not null check (char_length(import_batch) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint source_workbook_rows_sheet_row_key unique (sheet, excel_row)
);

alter table public.source_workbook_rows enable row level security;

create index source_workbook_rows_institution_idx on public.source_workbook_rows (institution_id);
create index source_workbook_rows_agreement_idx on public.source_workbook_rows (agreement_id);

create trigger source_workbook_rows_set_audit_fields
  before insert or update on public.source_workbook_rows
  for each row execute function public.set_audit_fields();

create trigger source_workbook_rows_write_audit_log
  after insert or update or delete on public.source_workbook_rows
  for each row execute function public.write_audit_log();

-- Source values are never edited in the portal. Administrators may only
-- correct which university or agreement a row belongs to.
revoke all on public.source_workbook_rows from anon, authenticated;
grant select on public.source_workbook_rows to authenticated;
grant update (institution_id, agreement_id, match_status, match_note) on public.source_workbook_rows to authenticated;

create policy "Internal roles read source workbook rows"
  on public.source_workbook_rows for select to authenticated
  using ((select private.is_internal()));

create policy "Administrators correct source row matches"
  on public.source_workbook_rows for update to authenticated
  using ((select private.is_content_admin()))
  with check ((select private.is_content_admin()));

-- ---------------------------------------------------------------------------
-- Contacts: unparsed source text
-- ---------------------------------------------------------------------------

alter table public.institution_contacts
  add column source_note text check (char_length(source_note) <= 500);

-- ---------------------------------------------------------------------------
-- Import ledger (owner only; not exposed through the API)
-- ---------------------------------------------------------------------------

create table private.workbook_import_ledger (
  id bigint generated always as identity primary key,
  import_batch text not null,
  table_name text not null check (
    table_name in ('countries', 'institutions', 'agreements', 'agreement_details', 'institution_contacts', 'source_workbook_rows')
  ),
  record_id uuid not null,
  operation text not null check (operation in ('insert', 'update')),
  -- For updates: the row before the import changed it.
  previous jsonb,
  recorded_at timestamptz not null default now(),
  constraint workbook_import_ledger_entry_key unique (import_batch, table_name, record_id, operation)
);

revoke all on private.workbook_import_ledger from public, anon, authenticated;
