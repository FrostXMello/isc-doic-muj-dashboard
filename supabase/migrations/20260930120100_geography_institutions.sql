-- Geography and institutions.
--
-- Institutions hold identity and place only. Agreement status, dates, and
-- programme rules live in their own tables (docs/data-model.md).

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique,
  sort_order smallint not null default 0,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table public.regions enable row level security;

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  -- Matches the public site's country keys (e.g. 'united-kingdom').
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique,
  iso2 text unique check (iso2 ~ '^[A-Z]{2}$'),
  -- Nullable for countries that are not part of the partner directory
  -- (e.g. India, the home country, referenced by activities).
  region_id uuid references public.regions (id) on delete restrict,
  -- The single city pin the public directory uses for the whole country.
  -- It is not a campus location for any institution.
  hub_city text,
  hub_latitude double precision check (hub_latitude between -90 and 90),
  hub_longitude double precision check (hub_longitude between -180 and 180),
  -- Country-level editorial note from the public directory.
  summary text,
  is_public boolean not null default false,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint countries_hub_coordinates_check
    check ((hub_latitude is null) = (hub_longitude is null))
);

alter table public.countries enable row level security;

create index countries_region_id_idx on public.countries (region_id);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  -- Stable URL key. Keeps the portal's existing ids ('dir-…', 'smp-…').
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  country_id uuid not null references public.countries (id) on delete restrict,
  -- Campus city. NULL until checked: the public directory only carries the
  -- country hub city, which is not the campus city for most institutions.
  city text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location_verified boolean not null default false,
  website text check (website ~* '^https?://'),
  note text,
  is_public boolean not null default false,
  data_source public.data_source not null default 'official',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint institutions_coordinates_check check ((latitude is null) = (longitude is null)),
  constraint institutions_country_name_key unique (country_id, name)
);

alter table public.institutions enable row level security;

create index institutions_is_public_idx on public.institutions (is_public);
create index institutions_data_source_idx on public.institutions (data_source);

-- The portal groups institutions by region, so an institution's country must
-- have one.
create or replace function public.ensure_institution_country_has_region()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.countries c
    where c.id = new.country_id and c.region_id is not null
  ) then
    raise exception 'Institution % references a country without a region', new.slug
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger institutions_country_region_check
  before insert or update of country_id on public.institutions
  for each row execute function public.ensure_institution_country_has_region();

create trigger regions_set_audit_fields
  before insert or update on public.regions
  for each row execute function public.set_audit_fields();

create trigger countries_set_audit_fields
  before insert or update on public.countries
  for each row execute function public.set_audit_fields();

create trigger institutions_set_audit_fields
  before insert or update on public.institutions
  for each row execute function public.set_audit_fields();

revoke execute on function public.ensure_institution_country_has_region() from public, anon, authenticated;
