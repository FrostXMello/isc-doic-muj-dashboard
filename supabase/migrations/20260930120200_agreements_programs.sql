-- Agreements (MoUs), collaboration areas, programmes, programme availability
-- (institution × programme offerings), and opportunities (application calls).
--
-- Enum labels match src/lib/internal/types.ts exactly so rows map without
-- translation.

create type public.agreement_type as enum (
  'mou', 'student-exchange', 'research-collaboration', 'dual-degree', 'other'
);
create type public.agreement_record_status as enum ('draft', 'under-review', 'signed', 'terminated');
create type public.renewal_mode as enum ('automatic', 'by-review');
create type public.program_type as enum (
  'student-exchange', 'semester-exchange', 'pathway-programs', 'academic-visits'
);
create type public.availability_state as enum ('open', 'closed', 'suspended');
create type public.opportunity_record_status as enum ('draft', 'published', 'archived');

-- ---------------------------------------------------------------------------
-- Agreements
-- ---------------------------------------------------------------------------

create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  -- Stable URL key. Keeps the portal's existing ids ('agr-001').
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  reference text not null unique,
  institution_id uuid not null references public.institutions (id) on delete restrict,
  title text not null,
  agreement_type public.agreement_type not null,
  record_status public.agreement_record_status not null default 'draft',
  start_date date,
  end_date date,
  renewal public.renewal_mode,
  notes text,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint agreements_dates_check
    check (start_date is null or end_date is null or end_date >= start_date),
  -- Target for composite foreign keys that must stay on the same institution.
  constraint agreements_id_institution_key unique (id, institution_id)
);

alter table public.agreements enable row level security;

create index agreements_institution_id_idx on public.agreements (institution_id);
create index agreements_record_status_idx on public.agreements (record_status);
create index agreements_end_date_idx on public.agreements (end_date);

create table public.collaboration_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table public.collaboration_areas enable row level security;

create table public.agreement_collaboration_areas (
  agreement_id uuid not null references public.agreements (id) on delete cascade,
  collaboration_area_id uuid not null references public.collaboration_areas (id) on delete restrict,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  created_by uuid,
  primary key (agreement_id, collaboration_area_id)
);

alter table public.agreement_collaboration_areas enable row level security;

create index agreement_collaboration_areas_area_idx
  on public.agreement_collaboration_areas (collaboration_area_id);

-- ---------------------------------------------------------------------------
-- Programmes
-- ---------------------------------------------------------------------------

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- One catalogue entry per programme type; the portal addresses programmes
  -- by type.
  program_type public.program_type not null unique,
  name text not null,
  description text not null,
  general_audience text,
  is_published boolean not null default false,
  sort_order smallint not null default 0,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table public.programs enable row level security;

-- A confirmed institution × programme pairing. Rows are recorded one by one,
-- never generated as a cross-product.
create table public.program_availability (
  id uuid primary key default gen_random_uuid(),
  -- Stable URL key. Keeps the portal's existing ids ('off-001').
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  program_id uuid not null references public.programs (id) on delete restrict,
  institution_id uuid not null references public.institutions (id) on delete restrict,
  -- Optional supporting agreement; must belong to the same institution.
  agreement_id uuid,
  -- NULL means "not recorded", never "open".
  availability public.availability_state,
  duration text,
  intake text,
  application_start date,
  application_end date,
  eligibility text,
  credit_information text,
  notes text,
  is_published boolean not null default false,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint program_availability_pair_key unique (institution_id, program_id),
  constraint program_availability_id_program_key unique (id, program_id),
  constraint program_availability_agreement_fkey
    foreign key (agreement_id, institution_id)
    references public.agreements (id, institution_id)
    on delete restrict,
  constraint program_availability_window_check
    check (application_start is null or application_end is null or application_end >= application_start)
);

alter table public.program_availability enable row level security;

create index program_availability_program_id_idx on public.program_availability (program_id);
create index program_availability_agreement_id_idx on public.program_availability (agreement_id);
create index program_availability_availability_idx on public.program_availability (availability);
create index program_availability_is_published_idx on public.program_availability (is_published);

-- ---------------------------------------------------------------------------
-- Opportunities (application calls)
-- ---------------------------------------------------------------------------

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  -- Stable URL key. Keeps the portal's existing ids ('opp-001').
  code text not null unique check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  program_id uuid not null references public.programs (id) on delete restrict,
  -- Optional offering; must be an offering of the same programme.
  availability_id uuid,
  institution_id uuid references public.institutions (id) on delete restrict,
  opens_on date,
  deadline date,
  record_status public.opportunity_record_status not null default 'draft',
  summary text not null default '',
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint opportunities_availability_fkey
    foreign key (availability_id, program_id)
    references public.program_availability (id, program_id)
    on delete restrict,
  constraint opportunities_window_check
    check (opens_on is null or deadline is null or deadline >= opens_on)
);

alter table public.opportunities enable row level security;

create index opportunities_program_id_idx on public.opportunities (program_id);
create index opportunities_availability_id_idx on public.opportunities (availability_id);
create index opportunities_institution_id_idx on public.opportunities (institution_id);
create index opportunities_record_status_idx on public.opportunities (record_status);
create index opportunities_deadline_idx on public.opportunities (deadline);

-- ---------------------------------------------------------------------------
-- Audit-column triggers
-- ---------------------------------------------------------------------------

create trigger agreements_set_audit_fields
  before insert or update on public.agreements
  for each row execute function public.set_audit_fields();

create trigger collaboration_areas_set_audit_fields
  before insert or update on public.collaboration_areas
  for each row execute function public.set_audit_fields();

create trigger programs_set_audit_fields
  before insert or update on public.programs
  for each row execute function public.set_audit_fields();

create trigger program_availability_set_audit_fields
  before insert or update on public.program_availability
  for each row execute function public.set_audit_fields();

create trigger opportunities_set_audit_fields
  before insert or update on public.opportunities
  for each row execute function public.set_audit_fields();

create or replace function public.set_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := coalesce(auth.uid(), new.created_by);
  return new;
end;
$$;

revoke execute on function public.set_created_by() from public, anon, authenticated;

create trigger agreement_collaboration_areas_set_created_by
  before insert on public.agreement_collaboration_areas
  for each row execute function public.set_created_by();
