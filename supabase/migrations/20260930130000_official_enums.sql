-- Enum values for records imported from the official MUJ Internationalization
-- pages. New enum values cannot be used in the transaction that adds them, so
-- this migration only adds values; 20260930130100 uses them.

-- How far a record has been checked. Official imports are 'source-imported'
-- (copied from the linked page), never 'verified' until DoIC confirms them.
create type public.verification_status as enum (
  'unverified', 'source-imported', 'needs-review', 'verified'
);

-- Contacts are internal unless DoIC explicitly marks one public.
create type public.contact_visibility as enum ('internal', 'public');

-- Agreement wording used on the official partner page. 'not-stated': the page
-- names the partner without an agreement type.
alter type public.agreement_type add value if not exists 'agreement-of-cooperation';
alter type public.agreement_type add value if not exists 'addendum';
alter type public.agreement_type add value if not exists 'academic-agreement';
alter type public.agreement_type add value if not exists 'not-stated';

-- The official page gives no status or dates for any agreement.
alter type public.agreement_record_status add value if not exists 'not-stated';

alter type public.program_type add value if not exists 'dual-degree';
alter type public.program_type add value if not exists 'summer-winter-school';

alter type public.document_type add value if not exists 'form';
alter type public.document_type add value if not exists 'newsletter';
