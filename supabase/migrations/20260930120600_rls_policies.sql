-- Row level security policies.
--
-- RLS is enabled on every table in the migration that creates it. Summary:
--   public-facing  regions; countries / institutions where is_public;
--                  programs / program_availability where is_published;
--                  opportunities where published and not sample data
--   internal read  isc_team, doic_admin, leadership (public.is_internal())
--   internal write isc_team, doic_admin (public.can_edit_internal())
--   deletes        doic_admin (public.is_doic_admin())
--   own records    profiles, student_profiles, applications, notifications
--   audit_logs     read by doic_admin and leadership; nobody writes via API
--
-- Helpers are wrapped in (select …) so Postgres evaluates them once per
-- statement instead of once per row.

-- ---------------------------------------------------------------------------
-- Grant hardening. RLS decides rows; these decide which statements are even
-- possible. Anonymous visitors never write, and TRUNCATE bypasses RLS.
-- ---------------------------------------------------------------------------

revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Profiles: created by the signup trigger; users may only edit their name.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Role vocabulary is fixed by migrations.
revoke insert, update, delete on public.roles from authenticated;

-- Notifications: recipients may only mark them read.
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Audit log: read-only through the API, even for doic_admin.
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Reference and public-facing catalogue
-- ---------------------------------------------------------------------------

create policy "Regions are readable by everyone"
  on public.regions for select to anon, authenticated
  using (true);

create policy "Public countries are readable; internal roles read all"
  on public.countries for select to anon, authenticated
  using (is_public or (select public.is_internal()));

create policy "Public institutions are readable; internal roles read all"
  on public.institutions for select to anon, authenticated
  using (is_public or (select public.is_internal()));

create policy "Published programmes are readable; internal roles read all"
  on public.programs for select to anon, authenticated
  using (is_published or (select public.is_internal()));

create policy "Published offerings are readable; internal roles read all"
  on public.program_availability for select to anon, authenticated
  using (is_published or (select public.is_internal()));

-- Opportunities have no separate visibility flag, so fictional sample calls
-- are excluded explicitly.
create policy "Published opportunities are readable; internal roles read all"
  on public.opportunities for select to anon, authenticated
  using (
    (record_status = 'published' and data_source <> 'sample')
    or (select public.is_internal())
  );

-- ---------------------------------------------------------------------------
-- Internal-only reads
-- ---------------------------------------------------------------------------

create policy "Internal roles read collaboration areas"
  on public.collaboration_areas for select to authenticated
  using ((select public.is_internal()));

create policy "Internal roles read agreements"
  on public.agreements for select to authenticated
  using ((select public.is_internal()));

create policy "Internal roles read agreement areas"
  on public.agreement_collaboration_areas for select to authenticated
  using ((select public.is_internal()));

create policy "Internal roles read documents"
  on public.documents for select to authenticated
  using ((select public.is_internal()));

create policy "Internal roles read document links"
  on public.document_links for select to authenticated
  using ((select public.is_internal()));

create policy "Internal roles read activities"
  on public.activities for select to authenticated
  using ((select public.is_internal()));

-- ---------------------------------------------------------------------------
-- Internal writes: isc_team and doic_admin create/update; doic_admin deletes.
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
    'activities'
  ]
  loop
    execute format(
      'create policy %I on public.%I for insert to authenticated '
      'with check ((select public.can_edit_internal()))',
      'Internal editors insert ' || managed, managed
    );
    execute format(
      'create policy %I on public.%I for update to authenticated '
      'using ((select public.can_edit_internal())) '
      'with check ((select public.can_edit_internal()))',
      'Internal editors update ' || managed, managed
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated '
      'using ((select public.is_doic_admin()))',
      'DoIC admins delete ' || managed, managed
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create policy "Users read their own profile; internal roles read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_internal()));

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Signed-in users read the role vocabulary"
  on public.roles for select to authenticated
  using (true);

create policy "Users read their own roles; admins and leadership read all"
  on public.user_roles for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_any_role(array['doic_admin', 'leadership']::public.app_role[]))
  );

create policy "DoIC admins grant roles"
  on public.user_roles for insert to authenticated
  with check ((select public.is_doic_admin()));

create policy "DoIC admins change role grants"
  on public.user_roles for update to authenticated
  using ((select public.is_doic_admin()))
  with check ((select public.is_doic_admin()));

-- An admin cannot remove their own admin role, so the last admin cannot lock
-- everyone out by accident.
create policy "DoIC admins revoke roles"
  on public.user_roles for delete to authenticated
  using (
    (select public.is_doic_admin())
    and not (user_id = (select auth.uid()) and role = 'doic_admin')
  );

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------

create policy "Students read their own profile; internal roles read all"
  on public.student_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_internal()));

create policy "Students create their own profile"
  on public.student_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_role('student')));

create policy "Students update their own profile; editors update any"
  on public.student_profiles for update to authenticated
  using (user_id = (select auth.uid()) or (select public.can_edit_internal()))
  with check (user_id = (select auth.uid()) or (select public.can_edit_internal()));

create policy "DoIC admins delete student profiles"
  on public.student_profiles for delete to authenticated
  using ((select public.is_doic_admin()));

create policy "Students read their own applications; internal roles read all"
  on public.applications for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_internal()));

-- Students apply only to published calls whose window is open.
create policy "Students apply to open published opportunities"
  on public.applications for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and (select public.has_role('student'))
    and status = 'submitted'
    and decided_at is null
    and decision_note is null
    and exists (
      select 1
      from public.opportunities o
      where o.id = opportunity_id
        and o.record_status = 'published'
        and (o.opens_on is null or o.opens_on <= current_date)
        and (o.deadline is null or o.deadline >= current_date)
    )
  );

-- Status changes are staff-only. Students have no update policy.
create policy "Internal editors update applications"
  on public.applications for update to authenticated
  using ((select public.can_edit_internal()))
  with check ((select public.can_edit_internal()));

create policy "DoIC admins delete applications"
  on public.applications for delete to authenticated
  using ((select public.is_doic_admin()));

create policy "Users read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Internal editors send notifications"
  on public.notifications for insert to authenticated
  with check ((select public.can_edit_internal()));

create policy "Users mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users delete their own notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create policy "DoIC admins and leadership read the audit log"
  on public.audit_logs for select to authenticated
  using ((select public.has_any_role(array['doic_admin', 'leadership']::public.app_role[])));
