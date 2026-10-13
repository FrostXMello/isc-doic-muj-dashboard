-- Reverts 20261005090100_admin_control.sql to the policies and helpers of
-- 20261004090000. Run as the database owner in one transaction, e.g.
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -1 -f supabase/rollbacks/20261005090100_admin_control.down.sql
-- then remove the migration from the history:
--   npx supabase migration repair --status reverted 20261005090100
--
-- super_admin and isc_admin grants are removed (the old policies do not know
-- them). The enum values from 20261005090000 stay: Postgres cannot drop enum
-- values in place, and unused values grant nothing. Audit rows are kept.

-- Role grants ---------------------------------------------------------------

drop trigger user_roles_guard_change on public.user_roles;
drop function private.guard_user_role_change();

delete from public.user_roles where role in ('super_admin', 'isc_admin');
delete from public.roles where role in ('super_admin', 'isc_admin');
update public.roles
  set description = 'Directorate administrator. Full internal access, deletes, and role management.'
  where role = 'doic_admin';
update public.roles
  set description = 'International Student Cell staff. Reads and edits internal records.'
  where role = 'isc_team';

drop policy "Active users read own roles; admins and leadership read all" on public.user_roles;
drop policy "Administrators grant roles within their authority" on public.user_roles;
drop policy "Administrators revoke roles within their authority" on public.user_roles;

grant update on public.user_roles to authenticated;

create policy "Users read their own roles; admins and leadership read all"
  on public.user_roles for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.has_any_role(array['doic_admin', 'leadership']::public.app_role[]))
  );

create policy "DoIC admins grant roles"
  on public.user_roles for insert to authenticated
  with check ((select private.is_doic_admin()));

create policy "DoIC admins change role grants"
  on public.user_roles for update to authenticated
  using (
    (select private.is_doic_admin())
    and not (user_id = (select auth.uid()) and role = 'doic_admin')
  )
  with check ((select private.is_doic_admin()));

create policy "DoIC admins revoke roles"
  on public.user_roles for delete to authenticated
  using (
    (select private.is_doic_admin())
    and not (user_id = (select auth.uid()) and role = 'doic_admin')
  );

-- Deletes -------------------------------------------------------------------

do $$
declare
  managed text;
begin
  foreach managed in array array[
    'regions', 'countries', 'institutions', 'agreements', 'collaboration_areas',
    'agreement_collaboration_areas', 'programs', 'program_availability', 'opportunities',
    'documents', 'document_links', 'activities', 'institution_contacts'
  ]
  loop
    execute format('drop policy %I on public.%I', 'Administrators delete ' || managed, managed);
    execute format(
      'create policy %I on public.%I for delete to authenticated '
      'using ((select private.is_doic_admin()))',
      'DoIC admins delete ' || managed, managed
    );
  end loop;
end;
$$;

drop policy "Administrators delete student profiles" on public.student_profiles;
create policy "DoIC admins delete student profiles"
  on public.student_profiles for delete to authenticated
  using ((select private.is_doic_admin()));

drop policy "Administrators delete applications" on public.applications;
create policy "DoIC admins delete applications"
  on public.applications for delete to authenticated
  using ((select private.is_doic_admin()));

drop policy "Administrators delete institutional documents" on storage.objects;
create policy "DoIC admins delete institutional documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'institutional-documents'
    and (select private.is_doic_admin())
  );

-- Audit log -----------------------------------------------------------------

drop policy "Administrators and leadership read the audit log" on public.audit_logs;
create policy "DoIC admins and leadership read the audit log"
  on public.audit_logs for select to authenticated
  using ((select private.has_any_role(array['doic_admin', 'leadership']::public.app_role[])));

drop trigger audit_logs_append_only on public.audit_logs;
drop trigger audit_logs_no_truncate on public.audit_logs;
drop function private.reject_audit_change();
grant update, delete, truncate on public.audit_logs to service_role;
alter table public.audit_logs drop constraint audit_logs_account_actor_check;

drop trigger profiles_write_audit_log on public.profiles;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    old_row := to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    new_row := to_jsonb(new);
  end if;

  insert into public.audit_logs (actor_id, table_name, record_id, action, old_data, new_data)
  values (
    auth.uid(),
    tg_table_name,
    (coalesce(new_row, old_row) ->> 'id')::uuid,
    tg_op,
    old_row,
    new_row
  );
  return null;
end;
$$;

-- Settings ------------------------------------------------------------------

drop table public.portal_settings;
drop function private.stamp_portal_settings();

-- Accounts and helpers ------------------------------------------------------

drop function public.set_account_active(uuid, boolean);

create or replace function private.has_role(check_role public.app_role)
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

create or replace function private.has_any_role(check_roles public.app_role[])
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

create or replace function private.current_app_roles()
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

drop function private.can_manage_account(uuid);
drop function private.can_assign_role(uuid, public.app_role);
drop function private.holds_admin_role(uuid);
drop function private.is_admin_role(public.app_role);
drop function private.is_content_admin();
drop function private.is_super_admin();
drop function private.is_active_account();

alter table public.profiles
  drop column deactivated_at,
  drop column deactivated_by;
