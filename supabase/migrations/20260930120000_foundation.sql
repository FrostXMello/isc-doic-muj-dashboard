-- Foundation: shared enums, audit-column triggers, profiles, roles, and the
-- SECURITY DEFINER role helpers every RLS policy relies on.
--
-- Role assignments live in public.user_roles, which only doic_admin can write.
-- Nothing reads auth.users.raw_user_meta_data for authorisation, because users
-- can edit their own metadata.

create type public.app_role as enum ('student', 'isc_team', 'doic_admin', 'leadership');

-- Where a row comes from. 'sample' and 'directory' rows are demo data and must
-- never be presented as official DoIC records.
create type public.data_source as enum ('directory', 'programme-catalogue', 'sample', 'official');

-- ---------------------------------------------------------------------------
-- Audit-column triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- The signed-in user always wins over client-supplied actor ids, so a caller
-- cannot attribute a change to someone else. Service/migration contexts
-- (auth.uid() is null) may set the columns explicitly.
create or replace function public.set_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by, new.created_by);
    new.updated_at := coalesce(new.created_at, now());
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), new.updated_by);
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

create table public.roles (
  role public.app_role primary key,
  label text not null,
  description text not null
);

alter table public.roles enable row level security;

insert into public.roles (role, label, description) values
  ('student', 'Student', 'MUJ student. Manages their own student profile and applications.'),
  ('isc_team', 'ISC team', 'International Student Cell staff. Reads and edits internal records.'),
  ('doic_admin', 'DoIC admin', 'Directorate administrator. Full internal access, deletes, and role management.'),
  ('leadership', 'Leadership', 'University leadership. Read-only access to internal records and audit logs.');

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null references public.roles (role) on update restrict on delete restrict,
  granted_by uuid,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

create index user_roles_role_idx on public.user_roles (role);

create or replace function public.set_role_grantor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.granted_by := coalesce(auth.uid(), new.granted_by);
  new.granted_at := now();
  return new;
end;
$$;

create trigger user_roles_set_grantor
  before insert or update on public.user_roles
  for each row execute function public.set_role_grantor();

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies can consult user_roles without
-- granting read access to it; each only ever inspects the caller's own roles.
-- ---------------------------------------------------------------------------

create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = check_role
  );
$$;

create or replace function public.has_any_role(check_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = any (check_roles)
  );
$$;

create or replace function public.current_app_roles()
returns public.app_role[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(ur.role order by ur.role), '{}')
  from public.user_roles ur
  where ur.user_id = (select auth.uid());
$$;

-- Internal staff: may read internal records.
create or replace function public.is_internal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_any_role(array['isc_team', 'doic_admin', 'leadership']::public.app_role[]);
$$;

-- Internal editors: may create and update internal records.
create or replace function public.can_edit_internal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_any_role(array['isc_team', 'doic_admin']::public.app_role[]);
$$;

create or replace function public.is_doic_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('doic_admin'::public.app_role);
$$;

-- ---------------------------------------------------------------------------
-- Signup: every new auth user gets a profile and the unprivileged student
-- role. Staff roles are granted afterwards by a doic_admin.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));

  insert into public.user_roles (user_id, role)
  values (new.id, 'student');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_audit_fields() from public, anon, authenticated;
revoke execute on function public.set_role_grantor() from public, anon, authenticated;
