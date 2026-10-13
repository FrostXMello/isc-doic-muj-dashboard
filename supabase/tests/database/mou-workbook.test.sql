-- Access rules for the DoIC MoU register tables
-- (20261013090000_mou_workbook.sql). Runs in one transaction and rolls back.
-- Locally: ./scripts/test-db.sh

begin;
create extension if not exists pgtap with schema extensions;

select plan(34);

insert into auth.users (id, email) values
  ('00000000-0000-4000-d000-000000000001', 'wb.doic@test.local'),
  ('00000000-0000-4000-d000-000000000002', 'wb.team@test.local'),
  ('00000000-0000-4000-d000-000000000003', 'wb.leader@test.local'),
  ('00000000-0000-4000-d000-000000000004', 'wb.student@test.local'),
  ('00000000-0000-4000-d000-000000000005', 'wb.iscadmin@test.local');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-4000-d000-000000000001', 'doic_admin'),
  ('00000000-0000-4000-d000-000000000002', 'isc_team'),
  ('00000000-0000-4000-d000-000000000003', 'leadership'),
  ('00000000-0000-4000-d000-000000000004', 'student'),
  ('00000000-0000-4000-d000-000000000005', 'isc_admin');

insert into public.regions (slug, name) values ('wbt-region', 'Register Region');
insert into public.countries (slug, name, region_id)
  values ('wbt-country', 'Registerland', (select id from public.regions where slug = 'wbt-region'));
insert into public.institutions (slug, name, country_id)
  values ('wbt-uni', 'Register University', (select id from public.countries where slug = 'wbt-country'));
insert into public.agreements (code, reference, institution_id, title, agreement_type) values
  ('wbt-agr', 'WBT-AGR', (select id from public.institutions where slug = 'wbt-uni'), 'Register MoU', 'mou'),
  ('wbt-agr-two', 'WBT-AGR-2', (select id from public.institutions where slug = 'wbt-uni'), 'Second MoU', 'mou');
insert into public.agreement_details (agreement_id, doic_reference, qs_ranking)
  values ((select id from public.agreements where code = 'wbt-agr'), 'DoIC/MoU/Test/2024/01', 'NA');
insert into public.source_workbook_rows (import_key, workbook, sheet, excel_row, source_values, institution_id, match_status, import_batch)
  values ('mou-list:9999', 'test.xlsx', 'mou-list', 9999, '{"Name of University/Organization": "Register University"}',
    (select id from public.institutions where slug = 'wbt-uni'), 'matched', 'test-batch');

select ok((select relrowsecurity from pg_class where oid = 'public.agreement_details'::regclass), 'agreement_details has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.source_workbook_rows'::regclass), 'source_workbook_rows has RLS');
select ok(not has_table_privilege('anon', 'public.agreement_details', 'select'), 'anon cannot read agreement details');
select ok(not has_table_privilege('anon', 'public.source_workbook_rows', 'select'), 'anon cannot read source rows');
select ok(not has_table_privilege('authenticated', 'private.workbook_import_ledger', 'select'), 'the import ledger is not readable through the API');
select ok(not has_table_privilege('authenticated', 'public.source_workbook_rows', 'insert'), 'source rows cannot be inserted through the API');
select ok(not has_table_privilege('authenticated', 'public.source_workbook_rows', 'delete'), 'source rows cannot be deleted through the API');
select ok(not has_column_privilege('authenticated', 'public.source_workbook_rows', 'source_values', 'update'), 'source values cannot be edited through the API');
select throws_ok($$ insert into public.agreement_details (agreement_id, document_url)
  values ((select id from public.agreements where code = 'wbt-agr-two'), 'http://insecure.example/doc') $$,
  '23514', null, 'agreement document links must be https');

-- Student: nothing.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000004","role":"authenticated"}', true);
select is((select count(*)::int from public.agreement_details), 0, 'student reads no agreement details');
select is((select count(*)::int from public.source_workbook_rows), 0, 'student reads no source rows');
reset role;

-- Leadership: read-only.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000003","role":"authenticated"}', true);
select is((select count(*)::int from public.agreement_details), 1, 'leadership reads agreement details');
select is((select count(*)::int from public.source_workbook_rows), 1, 'leadership reads source rows');
select throws_ok($$ insert into public.agreement_details (agreement_id)
  values ((select id from public.agreements where code = 'wbt-agr-two')) $$,
  '42501', null, 'leadership cannot add agreement details');
update public.agreement_details set qs_ranking = '1' where doic_reference = 'DoIC/MoU/Test/2024/01';
update public.source_workbook_rows set match_note = 'changed' where import_key = 'mou-list:9999';
reset role;
select is((select qs_ranking from public.agreement_details where doic_reference = 'DoIC/MoU/Test/2024/01'), 'NA', 'leadership updates change nothing');
select is((select match_note from public.source_workbook_rows where import_key = 'mou-list:9999'), null, 'leadership cannot correct matches');

-- ISC team: edits details, cannot correct matches or delete.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000002","role":"authenticated"}', true);
select lives_ok($$ insert into public.agreement_details (agreement_id, faculty)
  values ((select id from public.agreements where code = 'wbt-agr-two'), 'FoSTA') $$,
  'isc_team adds agreement details');
select lives_ok($$ update public.agreement_details set qs_ranking = '701-710' where doic_reference = 'DoIC/MoU/Test/2024/01' $$,
  'isc_team edits agreement details');
update public.source_workbook_rows set match_note = 'team' where import_key = 'mou-list:9999';
delete from public.agreement_details where faculty = 'FoSTA';
reset role;
select is((select qs_ranking from public.agreement_details where doic_reference = 'DoIC/MoU/Test/2024/01'), '701-710', 'the edit is stored');
select is((select match_note from public.source_workbook_rows where import_key = 'mou-list:9999'), null, 'isc_team cannot correct matches');
select is((select count(*)::int from public.agreement_details where faculty = 'FoSTA'), 1, 'isc_team cannot delete agreement details');

-- DoIC admin: corrects matches (link columns only) and deletes details.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000001","role":"authenticated"}', true);
select lives_ok($$ update public.source_workbook_rows
  set agreement_id = (select id from public.agreements where code = 'wbt-agr'), match_note = 'Linked by DoIC'
  where import_key = 'mou-list:9999' $$, 'doic_admin corrects a source row match');
select throws_ok($$ update public.source_workbook_rows set source_values = '{}' where import_key = 'mou-list:9999' $$,
  '42501', null, 'doic_admin cannot edit source values');
select lives_ok($$ delete from public.agreement_details where faculty = 'FoSTA' $$, 'doic_admin deletes agreement details');
reset role;
select is((select count(*)::int from public.agreement_details where faculty = 'FoSTA'), 0, 'the delete is stored');

-- Contacts edited from the university page.
insert into public.institution_contacts (code, institution_id, role_label, full_name, source_note)
  values ('wbt-contact', (select id from public.institutions where slug = 'wbt-uni'), 'Partner Nodal Officer', 'Jane Partner', 'ext. 12');
select throws_ok($$ update public.institution_contacts set source_note = repeat('x', 501) where code = 'wbt-contact' $$,
  '23514', null, 'contact notes are limited to 500 characters');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000003","role":"authenticated"}', true);
select throws_ok($$ insert into public.institution_contacts (code, institution_id, role_label, full_name)
  values ('wbt-leader', (select id from public.institutions where slug = 'wbt-uni'), 'MUJ Nodal Officer', 'X') $$,
  '42501', null, 'leadership cannot add contacts');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000002","role":"authenticated"}', true);
select lives_ok($$ update public.institution_contacts set source_note = 'Phone: +1 555 0100 ext. 12' where code = 'wbt-contact' $$,
  'isc_team edits a contact note');
delete from public.institution_contacts where code = 'wbt-contact';
reset role;
select is((select count(*)::int from public.institution_contacts where code = 'wbt-contact'), 1, 'isc_team cannot delete contacts');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-d000-000000000005","role":"authenticated"}', true);
select lives_ok($$ insert into public.agreement_details (agreement_id, remarks)
  values ((select id from public.agreements where code = 'wbt-agr-two'), 'Admin note')
  on conflict (agreement_id) do update set remarks = excluded.remarks $$, 'isc_admin upserts agreement details');
select lives_ok($$ delete from public.institution_contacts where code = 'wbt-contact' $$, 'isc_admin deletes a contact');
reset role;
select is((select count(*)::int from public.institution_contacts where code = 'wbt-contact'), 0, 'the contact delete is stored');

select ok(exists (select 1 from public.audit_logs where table_name = 'source_workbook_rows' and action = 'UPDATE'),
  'match corrections are audited');
select ok(exists (select 1 from public.audit_logs where table_name = 'agreement_details' and action = 'DELETE'),
  'agreement detail deletes are audited');

select * from finish();
rollback;
