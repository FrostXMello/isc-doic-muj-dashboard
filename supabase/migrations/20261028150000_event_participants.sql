-- Summer and winter school participants, one row per participant and course,
-- taken from DoIC's participant lists, certificates, and transcripts. The
-- names and contact details are personal data, so they live only here
-- (never in the repository): internal roles read them; administrators edit.

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  email text check (char_length(email) <= 320),
  gender text check (char_length(gender) <= 40),
  -- Student or Employee, as the participant registered.
  category text check (char_length(category) <= 60),
  -- Home institution as recorded; institution_id when it is a partner university.
  institution text check (char_length(institution) <= 300),
  institution_id uuid references public.institutions (id) on delete set null,
  country text check (char_length(country) <= 100),
  course text check (char_length(course) <= 300),
  -- Online, Offline, or Hybrid.
  mode text check (char_length(mode) <= 40),
  qualification text check (char_length(qualification) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create index event_participants_activity_id_idx on public.event_participants (activity_id, sort_order);
create index event_participants_institution_id_idx on public.event_participants (institution_id);

alter table public.event_participants enable row level security;

create trigger event_participants_set_audit_fields
  before insert or update on public.event_participants
  for each row execute function public.set_audit_fields();

create trigger event_participants_write_audit_log
  after insert or update or delete on public.event_participants
  for each row execute function public.write_audit_log();

revoke all on public.event_participants from anon;
revoke truncate, references, trigger on public.event_participants from authenticated;
grant select, insert, update, delete on public.event_participants to authenticated;

create policy "Internal roles read event participants"
  on public.event_participants for select to authenticated
  using ((select private.is_internal()));

create policy "Administrators add event participants"
  on public.event_participants for insert to authenticated
  with check ((select private.is_content_admin()));

create policy "Administrators edit event participants"
  on public.event_participants for update to authenticated
  using ((select private.is_content_admin()))
  with check ((select private.is_content_admin()));

create policy "Administrators delete event participants"
  on public.event_participants for delete to authenticated
  using ((select private.is_content_admin()));
