-- Reverses 20261013090000_mou_workbook.sql. Run with `psql -1 -f`.
--
-- Drops the register tables and the import ledger. Roll the data import back
-- first (supabase/private/mou-workbook-rollback.sql): it restores the
-- agreement and contact values the import filled in and removes the
-- universities, agreements, and contacts it created.

alter table public.institution_contacts drop column source_note;
drop table private.workbook_import_ledger;
drop table public.source_workbook_rows;
drop table public.agreement_details;
