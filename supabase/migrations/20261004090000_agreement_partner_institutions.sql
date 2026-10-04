-- Additional partner universities on a multi-party agreement.
--
-- agreements.institution_id stays the lead partner: composite foreign keys
-- (programme offerings, contacts) and the public summaries depend on it.
-- Every further university that is a party to the same agreement gets one row
-- here, so universities keep institutional data and agreements stay separate
-- records. No rows are backfilled: none of the imported agreements names more
-- than one university, and relationships are never inferred.

create table public.agreement_partner_institutions (
  agreement_id uuid not null references public.agreements (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid,
  primary key (agreement_id, institution_id)
);

alter table public.agreement_partner_institutions enable row level security;

create index agreement_partner_institutions_institution_idx
  on public.agreement_partner_institutions (institution_id);

-- The lead partner is already on the agreement row; listing it here again
-- would count the same university twice.
create or replace function private.ensure_partner_is_not_lead()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.agreements a
    where a.id = new.agreement_id and a.institution_id = new.institution_id
  ) then
    raise exception 'Institution is already the lead partner of this agreement'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function private.ensure_partner_is_not_lead() from public, anon, authenticated;

create trigger agreement_partner_institutions_not_lead
  before insert or update on public.agreement_partner_institutions
  for each row execute function private.ensure_partner_is_not_lead();

-- Moving an agreement's lead to one of its additional partners drops that
-- partner row instead of keeping a duplicate.
create or replace function private.drop_partner_row_for_new_lead()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.agreement_partner_institutions p
  where p.agreement_id = new.id and p.institution_id = new.institution_id;
  return new;
end;
$$;

revoke all on function private.drop_partner_row_for_new_lead() from public, anon, authenticated;

create trigger agreements_drop_partner_row_for_new_lead
  after update of institution_id on public.agreements
  for each row
  when (old.institution_id is distinct from new.institution_id)
  execute function private.drop_partner_row_for_new_lead();

create trigger agreement_partner_institutions_set_created_by
  before insert on public.agreement_partner_institutions
  for each row execute function public.set_created_by();

create trigger agreement_partner_institutions_write_audit_log
  after insert or update or delete on public.agreement_partner_institutions
  for each row execute function public.write_audit_log();

-- Internal-only, like agreements. Editors maintain the party list as part of
-- editing an agreement; anon gets no privileges at all.
revoke all on public.agreement_partner_institutions from anon;
revoke truncate, references, trigger on public.agreement_partner_institutions from authenticated;

create policy "Internal roles read agreement partners"
  on public.agreement_partner_institutions for select to authenticated
  using ((select private.is_internal()));

create policy "Internal editors insert agreement partners"
  on public.agreement_partner_institutions for insert to authenticated
  with check ((select private.can_edit_internal()));

create policy "Internal editors update agreement partners"
  on public.agreement_partner_institutions for update to authenticated
  using ((select private.can_edit_internal()))
  with check ((select private.can_edit_internal()));

create policy "Internal editors remove agreement partners"
  on public.agreement_partner_institutions for delete to authenticated
  using ((select private.can_edit_internal()));
