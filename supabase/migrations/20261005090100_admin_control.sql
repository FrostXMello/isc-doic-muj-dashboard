-- Administrative control: an explicit role hierarchy, tamper-proof role
-- grants, account deactivation, an append-only audit log, and validated
-- portal settings.
--
-- Permissions (enforced below; the app mirrors them in
-- src/lib/internal/permissions.ts):
--
--   action                         super  doic   isc    isc    leader- student
--                                  admin  admin  admin  team   ship
--   read internal records          yes    yes    yes    yes    yes     -
--   create / edit / archive        yes    yes    yes    yes    -       -
--   delete records and files       yes    yes    yes    -      -       -
--   portal settings                yes    yes    yes    -      -       -
--   read the audit log             yes    yes    yes    -      yes     -
--   grant/revoke isc_team, student yes    yes    yes    -      -       -
--   grant/revoke leadership        yes    yes    -      -      -       -
--   grant/revoke any admin role    yes    -      -      -      -       -
--   (de)activate ordinary accounts yes    yes    yes    -      -       -
--   (de)activate admin accounts    yes    -      -      -      -       -
--
-- Nobody changes their own grants or account state. The last active
-- super_admin cannot be revoked, deactivated, or deleted. The first
-- super_admin is provisioned by the project owner with SQL; a signed-in API
-- caller can never grant super_admin without already being one.
--
-- Rollback: supabase/rollbacks/20261005090100_admin_control.down.sql.

-- ---------------------------------------------------------------------------
-- Role vocabulary
-- ---------------------------------------------------------------------------

insert into public.roles (role, label, description) values
  ('super_admin', 'Super admin',
   'Assigns and revokes administrator roles. Provisioned by the project owner only.'),
  ('isc_admin', 'ISC admin',
   'International Student Cell administrator. Manages records, deletes, settings, and ordinary accounts.')
on conflict (role) do update set label = excluded.label, description = excluded.description;

update public.roles
  set description = 'Directorate administrator. Manages records, deletes, settings, and ordinary accounts.'
  where role = 'doic_admin';
update public.roles
  set description = 'International Student Cell staff. Reads, creates, and edits internal records.'
  where role = 'isc_team';

-- ---------------------------------------------------------------------------
-- Account deactivation
-- ---------------------------------------------------------------------------

-- Users may still only update full_name (column grant), so they cannot
-- reactivate themselves.
alter table public.profiles
  add column deactivated_at timestamptz,
  add column deactivated_by uuid;

-- ---------------------------------------------------------------------------
-- Role helpers. CREATE OR REPLACE keeps each function's OID, so every policy
-- already bound to it (including storage policies) picks up the new body.
-- A deactivated account holds no effective role.
-- ---------------------------------------------------------------------------

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
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid())
      and ur.role = check_role
      and p.deactivated_at is null
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
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid())
      and ur.role = any (check_roles)
      and p.deactivated_at is null
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
  join public.profiles p on p.id = ur.user_id
  where ur.user_id = (select auth.uid())
    and p.deactivated_at is null;
$$;

create or replace function private.is_internal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(
    array['super_admin', 'doic_admin', 'isc_admin', 'isc_team', 'leadership']::public.app_role[]
  );
$$;

create or replace function private.can_edit_internal()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(
    array['super_admin', 'doic_admin', 'isc_admin', 'isc_team']::public.app_role[]
  );
$$;

create or replace function private.is_active_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.deactivated_at is null
  );
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('super_admin'::public.app_role);
$$;

-- Deletes, settings, and ordinary account management.
create or replace function private.is_content_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(array['super_admin', 'doic_admin', 'isc_admin']::public.app_role[]);
$$;

create or replace function private.is_admin_role(check_role public.app_role)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select check_role in ('super_admin', 'doic_admin', 'isc_admin');
$$;

create or replace function private.holds_admin_role(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = target_user
      and ur.role in ('super_admin', 'doic_admin', 'isc_admin')
  );
$$;

-- Whether the signed-in caller may grant or revoke `check_role` for
-- `target_user`. Never for oneself; admin roles only by a super_admin; other
-- administrators only manage accounts that hold no admin role.
create or replace function private.can_assign_role(target_user uuid, check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and target_user is distinct from (select auth.uid())
    and (
      private.is_super_admin()
      or (
        not private.is_admin_role(check_role)
        and not private.holds_admin_role(target_user)
        and (
          (private.has_role('doic_admin'::public.app_role)
            and check_role in ('isc_team', 'leadership', 'student'))
          or (private.has_role('isc_admin'::public.app_role)
            and check_role in ('isc_team', 'student'))
        )
      )
    );
$$;

-- Whether the caller may (de)activate, reset, or delete `target_user`.
create or replace function private.can_manage_account(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and target_user is distinct from (select auth.uid())
    and (
      private.is_super_admin()
      or (private.is_content_admin() and not private.holds_admin_role(target_user))
    );
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'private.is_active_account()',
    'private.is_super_admin()',
    'private.is_content_admin()',
    'private.is_admin_role(public.app_role)',
    'private.holds_admin_role(uuid)',
    'private.can_assign_role(uuid, public.app_role)',
    'private.can_manage_account(uuid)'
  ] loop
    execute format('revoke all on function %s from public', fn);
    execute format('grant execute on function %s to anon, authenticated, service_role', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Deletes: every administrator, not only doic_admin.
-- ---------------------------------------------------------------------------

do $$
declare
  managed text;
begin
  foreach managed in array array[
    'regions',
    'countries',
    'institutions',
    'agreements',
    'collaboration_areas',
    'agreement_collaboration_areas',
    'programs',
    'program_availability',
    'opportunities',
    'documents',
    'document_links',
    'activities',
    'institution_contacts'
  ]
  loop
    execute format('drop policy %I on public.%I', 'DoIC admins delete ' || managed, managed);
    execute format(
      'create policy %I on public.%I for delete to authenticated '
      'using ((select private.is_content_admin()))',
      'Administrators delete ' || managed, managed
    );
  end loop;
end;
$$;

drop policy "DoIC admins delete student profiles" on public.student_profiles;
create policy "Administrators delete student profiles"
  on public.student_profiles for delete to authenticated
  using ((select private.is_content_admin()));

drop policy "DoIC admins delete applications" on public.applications;
create policy "Administrators delete applications"
  on public.applications for delete to authenticated
  using ((select private.is_content_admin()));

drop policy "DoIC admins delete institutional documents" on storage.objects;
create policy "Administrators delete institutional documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'institutional-documents'
    and (select private.is_content_admin())
  );

-- ---------------------------------------------------------------------------
-- Role grants
-- ---------------------------------------------------------------------------

drop policy "Users read their own roles; admins and leadership read all" on public.user_roles;
drop policy "DoIC admins grant roles" on public.user_roles;
drop policy "DoIC admins change role grants" on public.user_roles;
drop policy "DoIC admins revoke roles" on public.user_roles;

-- A deactivated account sees no grants of its own, so the app treats it as
-- having no access.
create policy "Active users read own roles; admins and leadership read all"
  on public.user_roles for select to authenticated
  using (
    (user_id = (select auth.uid()) and (select private.is_active_account()))
    or (select private.has_any_role(
      array['super_admin', 'doic_admin', 'isc_admin', 'leadership']::public.app_role[]
    ))
  );

create policy "Administrators grant roles within their authority"
  on public.user_roles for insert to authenticated
  with check (private.can_assign_role(user_id, role));

create policy "Administrators revoke roles within their authority"
  on public.user_roles for delete to authenticated
  using (private.can_assign_role(user_id, role));

-- Grants are never rewritten in place: revoke one role and grant another.
revoke update on public.user_roles from authenticated;

-- Defence in depth for every context. API callers stay within their
-- authority even if a policy is later loosened; owner and service contexts
-- (auth.uid() is null) are how the first super_admin is provisioned. The
-- last active super_admin can never be removed, including by cascading
-- account deletion.
create or replace function private.guard_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'Role grants cannot be rewritten; revoke the role and grant the new one'
      using errcode = 'insufficient_privilege';
  end if;

  if (select auth.uid()) is not null then
    if tg_op = 'INSERT' and not private.can_assign_role(new.user_id, new.role) then
      raise exception 'Not permitted to grant this role' using errcode = 'insufficient_privilege';
    end if;
    if tg_op = 'DELETE' and not private.can_assign_role(old.user_id, old.role) then
      raise exception 'Not permitted to revoke this role' using errcode = 'insufficient_privilege';
    end if;
  end if;

  if tg_op = 'DELETE' and old.role = 'super_admin' and not exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.role = 'super_admin'
      and ur.user_id <> old.user_id
      and p.deactivated_at is null
  ) then
    raise exception 'The last active Super Admin cannot be removed'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.guard_user_role_change() from public, anon, authenticated;

create trigger user_roles_guard_change
  before insert or update or delete on public.user_roles
  for each row execute function private.guard_user_role_change();

-- ---------------------------------------------------------------------------
-- Account activation (called by the server through the admin's own session)
-- ---------------------------------------------------------------------------

create or replace function public.set_account_active(target_user uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.can_manage_account(target_user) then
    raise exception 'Not permitted to change this account' using errcode = 'insufficient_privilege';
  end if;

  if not active
    and exists (
      select 1 from public.user_roles
      where user_id = target_user and role = 'super_admin'
    )
    and not exists (
      select 1
      from public.user_roles ur
      join public.profiles p on p.id = ur.user_id
      where ur.role = 'super_admin'
        and ur.user_id <> target_user
        and p.deactivated_at is null
    )
  then
    raise exception 'The last active Super Admin cannot be deactivated'
      using errcode = 'check_violation';
  end if;

  update public.profiles
  set deactivated_at = case when active then null else coalesce(deactivated_at, now()) end,
      deactivated_by = case when active then null else (select auth.uid()) end
  where id = target_user;

  if not found then
    raise exception 'Unknown account' using errcode = 'no_data_found';
  end if;
end;
$$;

revoke all on function public.set_account_active(uuid, boolean) from public, anon;
grant execute on function public.set_account_active(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

-- Tables keyed by user_id or agreement_id get a record_id too.
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb;
  new_row jsonb;
  record_key text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    old_row := to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    new_row := to_jsonb(new);
  end if;

  record_key := coalesce(
    coalesce(new_row, old_row) ->> 'id',
    coalesce(new_row, old_row) ->> 'user_id',
    coalesce(new_row, old_row) ->> 'agreement_id'
  );

  insert into public.audit_logs (actor_id, table_name, record_id, action, old_data, new_data)
  values (
    auth.uid(),
    tg_table_name,
    case
      when record_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then record_key::uuid
    end,
    tg_op,
    old_row,
    new_row
  );
  return null;
end;
$$;

revoke execute on function public.write_audit_log() from public, anon, authenticated;

create trigger profiles_write_audit_log
  after update on public.profiles
  for each row execute function public.write_audit_log();

-- Account events (creation, deletion, sign-in bans, password resets) happen
-- in Supabase Auth; the server records them with the service role, always
-- naming the verified actor.
alter table public.audit_logs
  add constraint audit_logs_account_actor_check
  check (table_name <> 'auth.users' or actor_id is not null);

create or replace function private.reject_audit_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only' using errcode = 'insufficient_privilege';
end;
$$;

revoke all on function private.reject_audit_change() from public, anon, authenticated;

create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function private.reject_audit_change();

create trigger audit_logs_no_truncate
  before truncate on public.audit_logs
  for each statement execute function private.reject_audit_change();

revoke update, delete, truncate on public.audit_logs from service_role;

drop policy "DoIC admins and leadership read the audit log" on public.audit_logs;
create policy "Administrators and leadership read the audit log"
  on public.audit_logs for select to authenticated
  using ((select private.has_any_role(
    array['super_admin', 'doic_admin', 'isc_admin', 'leadership']::public.app_role[]
  )));

-- ---------------------------------------------------------------------------
-- Portal settings: one row of typed, validated operational values. Security
-- controls (roles, policies, auth) are deliberately not settings.
-- ---------------------------------------------------------------------------

create table public.portal_settings (
  id boolean primary key default true check (id),
  -- Shown to signed-in users who have no access yet.
  access_contact_email text check (
    access_contact_email is null
    or (char_length(access_contact_email) <= 254
        and access_contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  ),
  access_contact_note text check (
    access_contact_note is null or char_length(access_contact_note) between 1 and 300
  ),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.portal_settings enable row level security;

insert into public.portal_settings (id) values (true);

revoke all on public.portal_settings from anon;
revoke insert, update, delete, truncate, references, trigger on public.portal_settings from authenticated;
grant update (access_contact_email, access_contact_note) on public.portal_settings to authenticated;

create policy "Signed-in users read portal settings"
  on public.portal_settings for select to authenticated
  using (true);

create policy "Administrators update portal settings"
  on public.portal_settings for update to authenticated
  using ((select private.is_content_admin()))
  with check ((select private.is_content_admin()));

create or replace function private.stamp_portal_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

revoke all on function private.stamp_portal_settings() from public, anon, authenticated;

create trigger portal_settings_stamp
  before update on public.portal_settings
  for each row execute function private.stamp_portal_settings();

create trigger portal_settings_write_audit_log
  after update on public.portal_settings
  for each row execute function public.write_audit_log();
