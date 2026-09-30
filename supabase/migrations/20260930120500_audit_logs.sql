-- Append-only audit log. Rows are written only by the SECURITY DEFINER
-- trigger below; no role can insert, update, or delete them through the API.

create table public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb
);

alter table public.audit_logs enable row level security;

create index audit_logs_record_idx on public.audit_logs (table_name, record_id);
create index audit_logs_occurred_at_idx on public.audit_logs (occurred_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);

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

revoke execute on function public.write_audit_log() from public, anon, authenticated;

do $$
declare
  audited text;
begin
  foreach audited in array array[
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
    'user_roles',
    'applications'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I '
      'for each row execute function public.write_audit_log()',
      audited || '_write_audit_log',
      audited
    );
  end loop;
end;
$$;
