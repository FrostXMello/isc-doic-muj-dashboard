-- Student-facing records: student profiles, applications, notifications.
-- No UI writes to these yet; the tables and policies are the foundation.

create type public.application_status as enum (
  'submitted', 'under-review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'
);

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  registration_number text unique,
  programme_of_study text,
  department text,
  year_of_study smallint check (year_of_study between 1 and 8),
  cgpa numeric(4, 2) check (cgpa between 0 and 10),
  nationality text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

alter table public.student_profiles enable row level security;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete restrict,
  status public.application_status not null default 'submitted',
  statement text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  -- Visible to the student. Internal review notes do not belong here.
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint applications_student_opportunity_key unique (student_id, opportunity_id)
);

alter table public.applications enable row level security;

create index applications_opportunity_id_idx on public.applications (opportunity_id);
create index applications_status_idx on public.applications (status);

-- Students cannot choose their own status or decision fields, whatever the
-- client sends. RLS already blocks student updates; this also normalises
-- inserts.
create or replace function public.guard_application_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and not public.can_edit_internal() then
    new.status := 'submitted';
    new.submitted_at := now();
    new.decided_at := null;
    new.decision_note := null;
  elsif tg_op = 'UPDATE' then
    new.student_id := old.student_id;
    new.opportunity_id := old.opportunity_id;
    new.submitted_at := old.submitted_at;
    if new.status is distinct from old.status and new.status in ('accepted', 'rejected') then
      new.decided_at := coalesce(new.decided_at, now());
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_application_write() from public, anon, authenticated;

create trigger applications_guard_write
  before insert or update on public.applications
  for each row execute function public.guard_application_write();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  -- In-app relative path only.
  link text check (link ~ '^/[^/]'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid
);

alter table public.notifications enable row level security;

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

create trigger student_profiles_set_audit_fields
  before insert or update on public.student_profiles
  for each row execute function public.set_audit_fields();

create trigger applications_set_audit_fields
  before insert or update on public.applications
  for each row execute function public.set_audit_fields();

create trigger notifications_set_created_by
  before insert on public.notifications
  for each row execute function public.set_created_by();
