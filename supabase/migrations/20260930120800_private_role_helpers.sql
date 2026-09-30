-- Move the SECURITY DEFINER role helpers out of the API-exposed public schema
-- so they are no longer callable as /rest/v1/rpc endpoints (Supabase advisor
-- lints 0028/0029). Policies bind to function OIDs and keep working; function
-- bodies that call a helper by name are recreated against the new schema.
--
-- anon and authenticated still need USAGE and EXECUTE because policies are
-- evaluated as the calling role.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

alter function public.has_role(public.app_role) set schema private;
alter function public.has_any_role(public.app_role[]) set schema private;
alter function public.current_app_roles() set schema private;
alter function public.is_internal() set schema private;
alter function public.can_edit_internal() set schema private;
alter function public.is_doic_admin() set schema private;

create or replace function private.is_internal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(array['isc_team', 'doic_admin', 'leadership']::public.app_role[]);
$$;

create or replace function private.can_edit_internal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(array['isc_team', 'doic_admin']::public.app_role[]);
$$;

create or replace function private.is_doic_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('doic_admin'::public.app_role);
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'private.has_role(public.app_role)',
    'private.has_any_role(public.app_role[])',
    'private.current_app_roles()',
    'private.is_internal()',
    'private.can_edit_internal()',
    'private.is_doic_admin()'
  ] loop
    execute format('revoke all on function %s from public', fn);
    execute format('grant execute on function %s to anon, authenticated, service_role', fn);
  end loop;
end;
$$;

create or replace function public.guard_application_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and not private.can_edit_internal() then
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
