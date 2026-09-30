-- RLS and privilege tests. Run with `npx supabase test db` (local stack).
-- Everything runs in one transaction and is rolled back.

begin;
create extension if not exists pgtap with schema extensions;

select plan(57);

-- ---------------------------------------------------------------------------
-- Fixtures (as the migration owner, which bypasses RLS)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-000000000001', 'student.a@test.local'),
  ('00000000-0000-4000-a000-000000000002', 'student.b@test.local'),
  ('00000000-0000-4000-a000-000000000003', 'isc@test.local'),
  ('00000000-0000-4000-a000-000000000004', 'admin@test.local'),
  ('00000000-0000-4000-a000-000000000005', 'leader@test.local');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-a000-000000000003', 'isc_team'),
  ('00000000-0000-4000-a000-000000000004', 'doic_admin'),
  ('00000000-0000-4000-a000-000000000005', 'leadership');

insert into public.regions (slug, name) values ('test-region', 'Test Region');
insert into public.countries (slug, name, region_id, is_public)
  values ('test-country', 'Testland', (select id from public.regions where slug = 'test-region'), true);
insert into public.institutions (slug, name, country_id, is_public) values
  ('test-public-uni', 'Test Public University', (select id from public.countries where slug = 'test-country'), true),
  ('test-private-uni', 'Test Private University', (select id from public.countries where slug = 'test-country'), false);
insert into public.agreements (code, reference, institution_id, title, agreement_type, record_status)
  values ('test-agr', 'TEST-AGR', (select id from public.institutions where slug = 'test-private-uni'),
          'Test agreement', 'mou', 'signed');
insert into public.documents (code, title) values ('test-doc', 'Test document');
insert into public.document_links (document_id, agreement_id) values (
  (select id from public.documents where code = 'test-doc'),
  (select id from public.agreements where code = 'test-agr'));
insert into public.activities (code, title, activity_type, start_date, country_id)
  values ('test-act', 'Test visit', 'inbound-visit', current_date,
          (select id from public.countries where slug = 'test-country'));
insert into public.programs (slug, program_type, name, description, is_published)
  values ('student-exchange', 'student-exchange', 'Student Exchange', 'Test', true)
  on conflict (program_type) do nothing;
insert into public.opportunities (code, title, program_id, record_status, opens_on, deadline) values
  ('test-open-call', 'Open call', (select id from public.programs where program_type = 'student-exchange'),
   'published', current_date - 1, current_date + 30),
  ('test-draft-call', 'Draft call', (select id from public.programs where program_type = 'student-exchange'),
   'draft', null, null);
insert into public.opportunities (code, title, program_id, record_status, data_source) values
  ('test-sample-call', 'Sample call', (select id from public.programs where program_type = 'student-exchange'),
   'published', 'sample');
insert into public.notifications (user_id, title) values
  ('00000000-0000-4000-a000-000000000001', 'For A'),
  ('00000000-0000-4000-a000-000000000002', 'For B');

-- ---------------------------------------------------------------------------
-- Anonymous visitor
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.agreements), 0::bigint, 'anon cannot read agreements');
select is((select count(*) from public.documents), 0::bigint, 'anon cannot read documents');
select is((select count(*) from public.document_links), 0::bigint, 'anon cannot read document links');
select is((select count(*) from public.activities), 0::bigint, 'anon cannot read activities');
select is((select count(*) from public.user_roles), 0::bigint, 'anon cannot read role grants');
select is((select count(*) from public.profiles), 0::bigint, 'anon cannot read profiles');
select throws_ok($$ select count(*) from public.audit_logs $$, '42501', null,
  'anon has no access to audit logs');
select ok(exists (select 1 from public.institutions where slug = 'test-public-uni'),
  'anon reads public institutions');
select ok(not exists (select 1 from public.institutions where slug = 'test-private-uni'),
  'anon cannot read non-public institutions');
select ok(exists (select 1 from public.opportunities where code = 'test-open-call'),
  'anon reads published opportunities');
select ok(not exists (select 1 from public.opportunities where code = 'test-draft-call'),
  'anon cannot read draft opportunities');
select ok(not exists (select 1 from public.opportunities where code = 'test-sample-call'),
  'anon cannot read published sample opportunities');
select throws_ok($$ insert into public.institutions (slug, name, country_id)
  values ('anon-uni', 'Anon', (select id from public.countries where slug = 'test-country')) $$,
  '42501', null, 'anon cannot insert institutions');

reset role;

-- ---------------------------------------------------------------------------
-- Student A
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);

select is(private.current_app_roles(), array['student']::public.app_role[],
  'signup trigger grants only the student role');
select is((select count(*) from public.profiles), 1::bigint,
  'student sees only their own auto-created profile');
select is((select count(*) from public.agreements), 0::bigint, 'student cannot read agreements');
select is((select count(*) from public.documents), 0::bigint, 'student cannot read documents');
select is((select count(*) from public.activities), 0::bigint, 'student cannot read activities');
select is((select count(*) from public.audit_logs), 0::bigint, 'student cannot read audit logs');
select throws_ok($$ insert into public.agreements (code, reference, institution_id, title, agreement_type)
  values ('student-agr', 'STU', (select id from public.institutions where slug = 'test-public-uni'), 'x', 'mou') $$,
  '42501', null, 'student cannot insert agreements');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-a000-000000000001', 'doic_admin') $$,
  '42501', null, 'student cannot grant themselves a role');
update public.user_roles set role = 'doic_admin' where user_id = '00000000-0000-4000-a000-000000000001';
select is(private.current_app_roles(), array['student']::public.app_role[],
  'student cannot upgrade their own role');
select lives_ok($$ insert into public.student_profiles (user_id, registration_number)
  values ('00000000-0000-4000-a000-000000000001', 'TEST-REG-A') $$,
  'student creates their own student profile');
select throws_ok($$ insert into public.student_profiles (user_id)
  values ('00000000-0000-4000-a000-000000000002') $$,
  '42501', null, 'student cannot create a profile for someone else');
select lives_ok($$ insert into public.applications (student_id, opportunity_id, statement)
  values ('00000000-0000-4000-a000-000000000001',
          (select id from public.opportunities where code = 'test-open-call'), 'Please') $$,
  'student applies to an open published call');
select throws_ok($$ insert into public.applications (student_id, opportunity_id)
  values ('00000000-0000-4000-a000-000000000001',
          (select id from public.opportunities where code = 'test-draft-call')) $$,
  '42501', null, 'student cannot apply to a draft call');
select throws_ok($$ insert into public.applications (student_id, opportunity_id)
  values ('00000000-0000-4000-a000-000000000002',
          (select id from public.opportunities where code = 'test-open-call')) $$,
  '42501', null, 'student cannot apply on behalf of another student');
update public.applications set status = 'accepted'
  where student_id = '00000000-0000-4000-a000-000000000001';
select is((select status::text from public.applications
  where student_id = '00000000-0000-4000-a000-000000000001'), 'submitted',
  'student cannot change their application status');
select is((select count(*) from public.notifications), 1::bigint,
  'student reads only their own notifications');
select lives_ok($$ update public.notifications set read_at = now() $$,
  'student marks their notification read');
select throws_ok($$ update public.notifications set title = 'changed' $$,
  '42501', null, 'student cannot rewrite notification content');
select lives_ok($$ update public.profiles set full_name = 'Student A'
  where id = '00000000-0000-4000-a000-000000000001' $$,
  'student updates their own name');
select throws_ok($$ update public.profiles set email = 'x@y.z'
  where id = '00000000-0000-4000-a000-000000000001' $$,
  '42501', null, 'student cannot change profile email directly');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('institutional-documents', 'documents/00000000-0000-4000-a000-00000000d0c1/a.pdf') $$,
  '42501', null, 'student cannot upload institutional documents');

reset role;

-- ---------------------------------------------------------------------------
-- ISC team
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-a000-000000000003","role":"authenticated"}', true);

select ok(exists (select 1 from public.agreements where code = 'test-agr'), 'isc_team reads agreements');
select ok(exists (select 1 from public.institutions where slug = 'test-private-uni'),
  'isc_team reads non-public institutions');
select ok(exists (select 1 from public.student_profiles where registration_number = 'TEST-REG-A'),
  'isc_team reads student profiles');
select lives_ok($$ insert into public.agreements (code, reference, institution_id, title, agreement_type)
  values ('isc-agr', 'ISC-AGR', (select id from public.institutions where slug = 'test-public-uni'),
          'ISC agreement', 'other') $$,
  'isc_team creates agreements');
delete from public.agreements where code = 'isc-agr';
select ok(exists (select 1 from public.agreements where code = 'isc-agr'), 'isc_team cannot delete agreements');
select throws_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-a000-000000000002', 'isc_team') $$,
  '42501', null, 'isc_team cannot grant roles');
select lives_ok($$ update public.applications set status = 'under-review'
  where student_id = '00000000-0000-4000-a000-000000000001' $$,
  'isc_team updates application status');
select is((select count(*) from public.audit_logs), 0::bigint, 'isc_team cannot read audit logs');
select lives_ok($$ insert into storage.objects (bucket_id, name)
  values ('institutional-documents', 'documents/00000000-0000-4000-a000-00000000d0c1/signed.pdf') $$,
  'isc_team uploads to the documents bucket using the path convention');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('institutional-documents', 'loose-file.pdf') $$,
  '42501', null, 'uploads outside the path convention are rejected');

reset role;

-- ---------------------------------------------------------------------------
-- Leadership
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-a000-000000000005","role":"authenticated"}', true);

select ok(exists (select 1 from public.agreements where code = 'test-agr'), 'leadership reads agreements');
select ok((select count(*) from public.audit_logs) > 0, 'leadership reads audit logs');
select throws_ok($$ insert into public.agreements (code, reference, institution_id, title, agreement_type)
  values ('lead-agr', 'LEAD', (select id from public.institutions where slug = 'test-public-uni'), 'x', 'mou') $$,
  '42501', null, 'leadership cannot insert agreements');
update public.agreements set title = 'changed by leadership' where code = 'test-agr';
select is((select title from public.agreements where code = 'test-agr'), 'Test agreement',
  'leadership cannot update agreements');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('institutional-documents', 'documents/00000000-0000-4000-a000-00000000d0c1/b.pdf') $$,
  '42501', null, 'leadership cannot upload documents');
select ok(exists (select 1 from storage.objects where bucket_id = 'institutional-documents'),
  'leadership reads institutional document objects');

reset role;

-- ---------------------------------------------------------------------------
-- DoIC admin
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-a000-000000000004","role":"authenticated"}', true);

select ok(exists (
    select 1 from public.audit_logs
    where table_name = 'agreements' and action = 'INSERT'
      and actor_id = '00000000-0000-4000-a000-000000000003'
      and new_data ->> 'code' = 'isc-agr'),
  'audit log records the isc_team insert with its actor');
select ok(exists (
    select 1 from public.agreements
    where code = 'isc-agr' and created_by = '00000000-0000-4000-a000-000000000003'),
  'created_by is set from the session, not the client');
select throws_ok($$ update public.audit_logs set action = 'DELETE' $$,
  '42501', null, 'audit logs cannot be updated');
select throws_ok($$ delete from public.audit_logs $$,
  '42501', null, 'audit logs cannot be deleted');
select lives_ok($$ insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-a000-000000000002', 'isc_team') $$,
  'doic_admin grants roles');
delete from public.agreements where code = 'isc-agr';
select ok(not exists (select 1 from public.agreements where code = 'isc-agr'), 'doic_admin deletes agreements');
delete from public.user_roles
  where user_id = '00000000-0000-4000-a000-000000000004' and role = 'doic_admin';
select ok(private.is_doic_admin(), 'doic_admin cannot revoke their own admin role');

reset role;

select * from finish();
rollback;
