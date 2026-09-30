-- Provenance columns, internal-only institution contacts, and a public-safe
-- projection of agreement types.
--
-- * Every catalogue table records where a row came from (source_url,
--   source_title, source_checked_on) and how far it has been checked
--   (verification).
-- * institution_contacts holds people such as the MUJ Nodal Officer for a
--   partner. Internal roles only; anon has no privileges at all.
-- * agreements stays internal-only. The public site may show which kind of
--   agreement the official page lists for a partner, so an opted-in subset of
--   agreement columns is copied into agreement_public_summaries by a trigger.

-- ---------------------------------------------------------------------------
-- Provenance
-- ---------------------------------------------------------------------------

do $$
declare
  catalogue text;
begin
  foreach catalogue in array array[
    'institutions',
    'agreements',
    'programs',
    'program_availability',
    'opportunities',
    'documents',
    'activities'
  ]
  loop
    execute format(
      'alter table public.%I '
      'add column source_url text check (source_url ~* ''^https?://''), '
      'add column source_title text, '
      'add column source_checked_on date, '
      'add column verification public.verification_status not null default ''unverified''',
      catalogue
    );
  end loop;
end;
$$;

-- Display name stays as listed on the source; this is the spelling-normalised
-- form for search and headings.
alter table public.institutions add column normalized_name text;

alter table public.agreements
  -- Agreement wording quoted from the source (e.g. 'Student Exchange Agreement (SEA)').
  add column type_label text,
  -- Heading(s) the row sits under on the source page, e.g. 'ASIA › RUSSIA'.
  add column source_section text,
  -- Position of the row on the source page, for tracing back.
  add column source_row integer check (source_row > 0),
  -- Opt-in: copy type and listing text to agreement_public_summaries.
  add column is_public_summary boolean not null default false;

alter table public.documents
  -- Link to a file published on an official site (no upload needed).
  add column external_url text check (external_url ~* '^https?://'),
  -- The link opened without signing in when last checked.
  add column publicly_accessible boolean not null default false;

create index institutions_verification_idx on public.institutions (verification);
create index agreements_verification_idx on public.agreements (verification);

-- ---------------------------------------------------------------------------
-- Institution contacts (internal-only by default)
-- ---------------------------------------------------------------------------

create table public.institution_contacts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  -- Optional: the collaboration row the contact is listed against. Must
  -- belong to the same institution.
  agreement_id uuid,
  role_label text not null,
  full_name text,
  -- Free text as listed (may hold two numbers, e.g. '…/…' or '…, …').
  phone text check (phone is null or phone ~ '^[0-9+() ,./-]{6,60}$'),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  visibility public.contact_visibility not null default 'internal',
  data_source public.data_source not null default 'official',
  source_url text check (source_url ~* '^https?://'),
  source_title text,
  source_checked_on date,
  verification public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint institution_contacts_agreement_fkey
    foreign key (agreement_id, institution_id)
    references public.agreements (id, institution_id)
    on delete cascade,
  constraint institution_contacts_detail_check
    check (num_nonnulls(full_name, phone, email) > 0)
);

alter table public.institution_contacts enable row level security;

create index institution_contacts_institution_id_idx on public.institution_contacts (institution_id);
create index institution_contacts_agreement_id_idx on public.institution_contacts (agreement_id);

create trigger institution_contacts_set_audit_fields
  before insert or update on public.institution_contacts
  for each row execute function public.set_audit_fields();

create trigger institution_contacts_write_audit_log
  after insert or update or delete on public.institution_contacts
  for each row execute function public.write_audit_log();

-- Anonymous visitors get no privileges at all on contacts.
revoke all on public.institution_contacts from anon;
revoke truncate, references, trigger on public.institution_contacts from authenticated;

create policy "Internal roles read contacts; users read public ones"
  on public.institution_contacts for select to authenticated
  using (
    (select private.is_internal())
    or (
      visibility = 'public'
      and exists (
        select 1 from public.institutions i
        where i.id = institution_id and i.is_public
      )
    )
  );

create policy "Internal editors insert institution_contacts"
  on public.institution_contacts for insert to authenticated
  with check ((select private.can_edit_internal()));

create policy "Internal editors update institution_contacts"
  on public.institution_contacts for update to authenticated
  using ((select private.can_edit_internal()))
  with check ((select private.can_edit_internal()));

create policy "DoIC admins delete institution_contacts"
  on public.institution_contacts for delete to authenticated
  using ((select private.is_doic_admin()));

-- ---------------------------------------------------------------------------
-- Public agreement summaries (trigger-maintained projection)
-- ---------------------------------------------------------------------------

create table public.agreement_public_summaries (
  agreement_id uuid primary key references public.agreements (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  code text not null unique,
  agreement_type public.agreement_type not null,
  type_label text,
  -- Row text as listed on the official page.
  listed_as text not null,
  source_url text,
  source_checked_on date,
  updated_at timestamptz not null default now()
);

alter table public.agreement_public_summaries enable row level security;

create index agreement_public_summaries_institution_id_idx
  on public.agreement_public_summaries (institution_id);

-- Written only by the trigger below.
revoke insert, update, delete, truncate, references, trigger
  on public.agreement_public_summaries from anon, authenticated;

create policy "Public institution summaries readable; internal read all"
  on public.agreement_public_summaries for select to anon, authenticated
  using (
    (select private.is_internal())
    or exists (
      select 1 from public.institutions i
      where i.id = institution_id and i.is_public
    )
  );

create or replace function private.sync_agreement_public_summary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.agreement_public_summaries where agreement_id = old.id;
    return null;
  end if;

  if new.is_public_summary and new.data_source <> 'sample' then
    insert into public.agreement_public_summaries (
      agreement_id, institution_id, code, agreement_type, type_label, listed_as,
      source_url, source_checked_on, updated_at
    ) values (
      new.id, new.institution_id, new.code, new.agreement_type, new.type_label, new.title,
      new.source_url, new.source_checked_on, now()
    )
    on conflict (agreement_id) do update set
      institution_id = excluded.institution_id,
      code = excluded.code,
      agreement_type = excluded.agreement_type,
      type_label = excluded.type_label,
      listed_as = excluded.listed_as,
      source_url = excluded.source_url,
      source_checked_on = excluded.source_checked_on,
      updated_at = excluded.updated_at;
  else
    delete from public.agreement_public_summaries where agreement_id = new.id;
  end if;
  return null;
end;
$$;

revoke all on function private.sync_agreement_public_summary() from public, anon, authenticated;

create trigger agreements_sync_public_summary
  after insert or update or delete on public.agreements
  for each row execute function private.sync_agreement_public_summary();
