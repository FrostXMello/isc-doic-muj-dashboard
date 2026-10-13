-- Role hierarchy, escalation attempts, account deactivation, the last Super
-- Admin rule, audit integrity, settings, and storage deletes
-- (20261005090100_admin_control.sql). Runs in one transaction and rolls back.
-- Locally: ./scripts/test-db.sh

begin;
create extension if not exists pgtap with schema extensions;

select plan(75);

-- ---------------------------------------------------------------------------
-- Fixtures (database owner; auth.uid() is null, which is how the first
-- super_admin is provisioned)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-4000-b000-000000000001', 'super.one@test.local'),
  ('00000000-0000-4000-b000-000000000002', 'super.two@test.local'),
  ('00000000-0000-4000-b000-000000000003', 'doic@test.local'),
  ('00000000-0000-4000-b000-000000000004', 'doic.two@test.local'),
  ('00000000-0000-4000-b000-000000000005', 'iscadmin@test.local'),
  ('00000000-0000-4000-b000-000000000006', 'team@test.local'),
  ('00000000-0000-4000-b000-000000000007', 'leader@test.local'),
  ('00000000-0000-4000-b000-000000000008', 'student@test.local'),
  ('00000000-0000-4000-b000-000000000009', 'pending.one@test.local'),
  ('00000000-0000-4000-b000-000000000010', 'pending.two@test.local'),
  ('00000000-0000-4000-b000-000000000011', 'pending.three@test.local');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-b000-000000000001', 'super_admin'),
  ('00000000-0000-4000-b000-000000000002', 'super_admin'),
  ('00000000-0000-4000-b000-000000000003', 'doic_admin'),
  ('00000000-0000-4000-b000-000000000004', 'doic_admin'),
  ('00000000-0000-4000-b000-000000000005', 'isc_admin'),
  ('00000000-0000-4000-b000-000000000006', 'isc_team'),
  ('00000000-0000-4000-b000-000000000007', 'leadership'),
  ('00000000-0000-4000-b000-000000000008', 'student');

insert into public.regions (slug, name) values ('ctl-region', 'Control Region');
insert into public.countries (slug, name, region_id)
  values ('ctl-country', 'Controlland', (select id from public.regions where slug = 'ctl-region'));
insert into public.institutions (slug, name, country_id) values
  ('ctl-throwaway-uni', 'Throwaway University', (select id from public.countries where slug = 'ctl-country')),
  ('ctl-kept-uni', 'Kept University', (select id from public.countries where slug = 'ctl-country'));
insert into public.agreements (code, reference, institution_id, title, agreement_type)
  values ('ctl-agr', 'CTL-AGR', (select id from public.institutions where slug = 'ctl-kept-uni'), 'Control MoU', 'mou');
insert into storage.objects (bucket_id, name) values
  ('institutional-documents', 'documents/11111111-1111-4111-8111-111111111111/a.pdf');

select ok(exists (select 1 from public.roles where role = 'super_admin')
    and exists (select 1 from public.roles where role = 'isc_admin'),
  'role vocabulary includes super_admin and isc_admin');
select ok(exists (select 1 from public.user_roles
    where user_id = '00000000-0000-4000-b000-000000000001' and role = 'super_admin' and granted_by is null),
  'the database owner provisions the first super_admin');

-- ---------------------------------------------------------------------------
-- DoIC admin
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000003","role":"authenticated"}', true);

select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000003', 'super_admin') $$,
  '42501', null, 'doic_admin cannot make themselves super_admin');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000009', 'super_admin') $$,
  '42501', null, 'doic_admin cannot grant super_admin');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000009', 'doic_admin') $$,
  '42501', null, 'doic_admin cannot grant doic_admin');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000009', 'isc_admin') $$,
  '42501', null, 'doic_admin cannot grant isc_admin');
select lives_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000009', 'isc_team') $$,
  'doic_admin grants isc_team');
select lives_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000009', 'leadership') $$,
  'doic_admin grants leadership');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000004', 'student') $$,
  '42501', null, 'doic_admin cannot change the roles of another administrator');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000003', 'isc_team') $$,
  '42501', null, 'doic_admin cannot change their own roles');

delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000003' and role = 'doic_admin';
select ok(exists (select 1 from public.user_roles
    where user_id = '00000000-0000-4000-b000-000000000003' and role = 'doic_admin'),
  'doic_admin cannot revoke their own admin role');
delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000004' and role = 'doic_admin';
select ok(exists (select 1 from public.user_roles
    where user_id = '00000000-0000-4000-b000-000000000004' and role = 'doic_admin'),
  'doic_admin cannot revoke another administrator');
delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000009' and role = 'leadership';
select ok(not exists (select 1 from public.user_roles
    where user_id = '00000000-0000-4000-b000-000000000009' and role = 'leadership'),
  'doic_admin revokes an ordinary role');
select throws_ok($$ update public.user_roles set role = 'super_admin'
  where user_id = '00000000-0000-4000-b000-000000000009' $$,
  '42501', null, 'role grants cannot be rewritten in place');

select lives_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000006', false) $$,
  'doic_admin deactivates an ordinary account');
select throws_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000004', false) $$,
  '42501', null, 'doic_admin cannot deactivate another administrator');
select throws_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000003', false) $$,
  '42501', null, 'doic_admin cannot deactivate themselves');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000006","role":"authenticated"}', true);
select is((select count(*) from public.user_roles), 0::bigint,
  'a deactivated account sees none of its role grants');
select is((select count(*) from public.agreements), 0::bigint,
  'a deactivated account reads no internal records');
select throws_ok($$ insert into public.regions (slug, name) values ('ctl-deactivated', 'X') $$,
  '42501', null, 'a deactivated account cannot write');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000003","role":"authenticated"}', true);
select lives_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000006', true) $$,
  'doic_admin reactivates the account');
select ok(exists (
    select 1 from public.audit_logs
    where table_name = 'profiles' and action = 'UPDATE'
      and actor_id = '00000000-0000-4000-b000-000000000003'
      and record_id = '00000000-0000-4000-b000-000000000006'
      and new_data ->> 'deactivated_at' is not null),
  'deactivation is audited with its actor');
select ok(exists (
    select 1 from public.audit_logs
    where table_name = 'user_roles' and action = 'INSERT'
      and actor_id = '00000000-0000-4000-b000-000000000003'
      and record_id = '00000000-0000-4000-b000-000000000009'
      and new_data ->> 'role' = 'isc_team'),
  'role grants are audited with actor and target user');
select throws_ok($$ insert into public.audit_logs (table_name, action) values ('agreements', 'DELETE') $$,
  '42501', null, 'doic_admin cannot forge audit entries');
select throws_ok($$ update public.portal_settings
  set updated_by = '00000000-0000-4000-b000-000000000001' $$,
  '42501', null, 'settings audit columns are not writable');
update public.portal_settings set access_contact_email = 'doic@example.edu';
select ok(exists (select 1 from public.portal_settings
    where access_contact_email = 'doic@example.edu'
      and updated_by = '00000000-0000-4000-b000-000000000003'),
  'doic_admin updates portal settings, stamped with the actor');
select throws_ok($$ update public.portal_settings set access_contact_email = 'not-an-email' $$,
  '23514', null, 'settings are validated');
select throws_ok($$ insert into public.portal_settings (id) values (false) $$,
  '42501', null, 'settings rows cannot be added');

-- ---------------------------------------------------------------------------
-- ISC admin
-- ---------------------------------------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000005","role":"authenticated"}', true);

select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000008', 'leadership') $$,
  '42501', null, 'isc_admin cannot grant leadership');
select lives_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000008', 'isc_team') $$,
  'isc_admin grants isc_team');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000008', 'isc_admin') $$,
  '42501', null, 'isc_admin cannot grant isc_admin');
delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000005' and role = 'isc_admin';
select ok(exists (select 1 from public.user_roles
    where user_id = '00000000-0000-4000-b000-000000000005' and role = 'isc_admin'),
  'isc_admin cannot revoke their own admin role');
delete from public.institutions where slug = 'ctl-throwaway-uni';
select ok(not exists (select 1 from public.institutions where slug = 'ctl-throwaway-uni'),
  'isc_admin deletes records');
select throws_ok($$ delete from public.institutions where slug = 'ctl-kept-uni' $$,
  '23503', null, 'deleting a university with an MoU is refused (foreign key)');
delete from storage.objects
  where name = 'documents/11111111-1111-4111-8111-111111111111/a.pdf';
select ok(not exists (select 1 from storage.objects
    where name = 'documents/11111111-1111-4111-8111-111111111111/a.pdf'),
  'isc_admin deletes stored files');
select ok(exists (select 1 from public.audit_logs), 'isc_admin reads the audit log');

-- ---------------------------------------------------------------------------
-- ISC team (editor)
-- ---------------------------------------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000006","role":"authenticated"}', true);

select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000011', 'student') $$,
  '42501', null, 'isc_team cannot grant roles');
select throws_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000008', false) $$,
  '42501', null, 'isc_team cannot deactivate accounts');
select lives_ok($$ insert into public.institutions (slug, name, country_id)
  values ('ctl-team-uni', 'Team University', (select id from public.countries where slug = 'ctl-country')) $$,
  'isc_team creates records');
delete from public.institutions where slug = 'ctl-team-uni';
select ok(exists (select 1 from public.institutions where slug = 'ctl-team-uni'),
  'isc_team cannot delete records');
select lives_ok($$ insert into storage.objects (bucket_id, name)
  values ('institutional-documents', 'documents/22222222-2222-4222-8222-222222222222/b.pdf') $$,
  'isc_team uploads to a valid document path');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('institutional-documents', 'misc/b.pdf') $$,
  '42501', null, 'uploads outside the path convention are refused');
delete from storage.objects
  where name = 'documents/22222222-2222-4222-8222-222222222222/b.pdf';
select ok(exists (select 1 from storage.objects
    where name = 'documents/22222222-2222-4222-8222-222222222222/b.pdf'),
  'isc_team cannot delete stored files');
select is((select count(*) from public.audit_logs), 0::bigint, 'isc_team cannot read the audit log');
update public.portal_settings set access_contact_note = 'Team note';
select ok((select access_contact_note from public.portal_settings) is distinct from 'Team note',
  'isc_team cannot change portal settings');
select throws_ok($$ update public.profiles set deactivated_at = null
  where id = '00000000-0000-4000-b000-000000000006' $$,
  '42501', null, 'users cannot change their own account state');

-- ---------------------------------------------------------------------------
-- Leadership (read-only)
-- ---------------------------------------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000007","role":"authenticated"}', true);

select ok(exists (select 1 from public.agreements where code = 'ctl-agr'), 'leadership reads internal records');
select throws_ok($$ insert into public.institutions (slug, name, country_id)
  values ('ctl-leader-uni', 'X', (select id from public.countries where slug = 'ctl-country')) $$,
  '42501', null, 'leadership cannot create records');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000011', 'student') $$,
  '42501', null, 'leadership cannot grant roles');
select ok(exists (select 1 from public.audit_logs), 'leadership reads the audit log');

-- ---------------------------------------------------------------------------
-- Super admin
-- ---------------------------------------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000001","role":"authenticated"}', true);

select lives_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000010', 'doic_admin') $$,
  'super_admin grants doic_admin');
select lives_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000010', 'isc_admin') $$,
  'super_admin grants isc_admin');
select lives_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000010', 'super_admin') $$,
  'super_admin grants super_admin');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000001', 'student') $$,
  '42501', null, 'super_admin cannot change their own roles');
delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000001' and role = 'super_admin';
select ok(exists (select 1 from public.user_roles
    where user_id = '00000000-0000-4000-b000-000000000001' and role = 'super_admin'),
  'super_admin cannot revoke their own super_admin role');
delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000010' and role = 'super_admin';
select ok(not exists (select 1 from public.user_roles
    where user_id = '00000000-0000-4000-b000-000000000010' and role = 'super_admin'),
  'super_admin revokes another super_admin');
select lives_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000002', false) $$,
  'super_admin deactivates another super_admin');
select throws_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000001', false) $$,
  '42501', null, 'super_admin cannot deactivate themselves');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000002","role":"authenticated"}', true);
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-b000-000000000011', 'student') $$,
  '42501', null, 'a deactivated super_admin cannot grant roles');
select throws_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000001', false) $$,
  '42501', null, 'a deactivated super_admin cannot deactivate others');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000001","role":"authenticated"}', true);
select lives_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000002', true) $$,
  'super_admin reactivates another super_admin');

-- ---------------------------------------------------------------------------
-- Last Super Admin and append-only audit log (owner context)
-- ---------------------------------------------------------------------------

reset role;
select set_config('request.jwt.claims', '', true);

select lives_ok($$ delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000002' and role = 'super_admin' $$,
  'a super_admin can be removed while another remains');
select throws_ok($$ delete from public.user_roles
  where user_id = '00000000-0000-4000-b000-000000000001' and role = 'super_admin' $$,
  '23514', null, 'the last super_admin grant cannot be removed');
select throws_ok($$ delete from auth.users where id = '00000000-0000-4000-b000-000000000001' $$,
  '23514', null, 'the last super_admin account cannot be deleted');
select throws_ok($$ update public.user_roles set role = 'student'
  where user_id = '00000000-0000-4000-b000-000000000001' $$,
  '42501', null, 'grants cannot be rewritten even by the owner');
select throws_ok($$ update public.audit_logs set actor_id = null $$,
  '42501', null, 'audit entries cannot be changed, even by the owner');
select throws_ok($$ delete from public.audit_logs $$,
  '42501', null, 'audit entries cannot be deleted, even by the owner');
select throws_ok($$ truncate public.audit_logs $$,
  '42501', null, 'the audit log cannot be truncated');

-- ---------------------------------------------------------------------------
-- Service role (server-side account events)
-- ---------------------------------------------------------------------------

set local role service_role;
select lives_ok($$ insert into public.audit_logs (actor_id, table_name, record_id, action, new_data)
  values ('00000000-0000-4000-b000-000000000003', 'auth.users',
          '00000000-0000-4000-b000-000000000011', 'UPDATE', '{"event":"account-deactivated"}') $$,
  'the server records account events with their actor');
select throws_ok($$ insert into public.audit_logs (table_name, action, new_data)
  values ('auth.users', 'DELETE', '{"event":"account-deleted"}') $$,
  '23514', null, 'account events must name an actor');
select throws_ok($$ update public.audit_logs set new_data = '{}' $$,
  '42501', null, 'the service role cannot change audit entries');
reset role;

-- ---------------------------------------------------------------------------
-- Accounts without access, and anonymous visitors
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-b000-000000000011","role":"authenticated"}', true);
select is((select count(*) from public.portal_settings), 1::bigint,
  'signed-in users read portal settings (the access contact)');
select is((select count(*) from public.agreements), 0::bigint,
  'accounts without a role read no internal records');
reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$ select count(*) from public.portal_settings $$,
  '42501', null, 'anon cannot read portal settings');
select throws_ok($$ select public.set_account_active('00000000-0000-4000-b000-000000000008', false) $$,
  '42501', null, 'anon cannot call account management');
reset role;

select * from finish();
rollback;
