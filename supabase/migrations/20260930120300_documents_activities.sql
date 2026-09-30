-- Documents, document links, and activities (visits, delegations, events).

create type public.document_type as enum (
  'agreement', 'brochure', 'programme-guide', 'policy', 'report', 'other'
);
create type public.document_status as enum ('draft', 'under-review', 'final', 'archived');
create type public.activity_type as enum (
  'inbound-visit', 'outbound-visit', 'delegation', 'event', 'virtual-meeting'
);
create type public.activity_record_status as enum ('planned', 'confirmed', 'completed', 'cancelled');

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  -- Stable URL key. Keeps the portal's existing ids ('doc-001').
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  document_type public.document_type not null default 'other',
  status public.document_status not null default 'draft',
  -- Date of the document's latest revision (shown as "Updated" in the portal).
  revised_on date,
  description text,
  -- Storage object. Both NULL when no file has been uploaded.
  -- Path convention: {entity_type}/{entity_id}/{filename}.
  storage_bucket text,
  storage_path text,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint documents_storage_check check ((storage_bucket is null) = (storage_path is null)),
  constraint documents_storage_key unique (storage_bucket, storage_path)
);

alter table public.documents enable row level security;

create index documents_status_idx on public.documents (status);
create index documents_type_idx on public.documents (document_type);

-- Attaches a document to exactly one target. A document that belongs in two
-- places gets two links.
create table public.document_links (
  id uuid primary key default gen_random_uuid(),
  code text unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  document_id uuid not null references public.documents (id) on delete cascade,
  institution_id uuid references public.institutions (id) on delete cascade,
  agreement_id uuid references public.agreements (id) on delete cascade,
  program_id uuid references public.programs (id) on delete cascade,
  availability_id uuid references public.program_availability (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint document_links_single_target_check
    check (num_nonnulls(institution_id, agreement_id, program_id, availability_id) = 1),
  constraint document_links_target_key
    unique nulls not distinct (document_id, institution_id, agreement_id, program_id, availability_id)
);

alter table public.document_links enable row level security;

create index document_links_institution_id_idx on public.document_links (institution_id);
create index document_links_agreement_id_idx on public.document_links (agreement_id);
create index document_links_program_id_idx on public.document_links (program_id);
create index document_links_availability_id_idx on public.document_links (availability_id);

-- ---------------------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------------------

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  -- Stable URL key. Keeps the portal's existing ids ('act-001').
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  activity_type public.activity_type not null,
  record_status public.activity_record_status not null default 'planned',
  start_date date not null,
  end_date date,
  country_id uuid not null references public.countries (id) on delete restrict,
  city text,
  institution_id uuid references public.institutions (id) on delete set null,
  agreement_id uuid references public.agreements (id) on delete set null,
  summary text not null default '',
  participants text,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint activities_dates_check check (end_date is null or end_date >= start_date)
);

alter table public.activities enable row level security;

create index activities_start_date_idx on public.activities (start_date);
create index activities_country_id_idx on public.activities (country_id);
create index activities_institution_id_idx on public.activities (institution_id);
create index activities_agreement_id_idx on public.activities (agreement_id);
create index activities_record_status_idx on public.activities (record_status);

create trigger documents_set_audit_fields
  before insert or update on public.documents
  for each row execute function public.set_audit_fields();

create trigger document_links_set_audit_fields
  before insert or update on public.document_links
  for each row execute function public.set_audit_fields();

create trigger activities_set_audit_fields
  before insert or update on public.activities
  for each row execute function public.set_audit_fields();
