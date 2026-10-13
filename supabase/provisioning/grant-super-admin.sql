-- Grants super_admin to one existing account. For the project owner only,
-- run as the database owner (never through the app or the API):
--
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -v user_id=<auth user uuid> \
--     -f supabase/provisioning/grant-super-admin.sql
--
-- Find the uuid in the Supabase Dashboard (Authentication > Users) for an
-- account that already exists and has signed in. The script refuses unknown
-- or deactivated accounts and prints the result. After the first super_admin
-- exists, further administrators are assigned in the portal by a super_admin.

\if :{?user_id}
\else
  \echo 'Pass the account id: -v user_id=<uuid>'
  \quit
\endif

begin;

select set_config('provision.user_id', :'user_id', true);

do $$
declare
  target uuid := current_setting('provision.user_id')::uuid;
  account record;
begin
  select id, email, deactivated_at into account from public.profiles where id = target;
  if not found then
    raise exception 'No profile for %; the account must exist first', target;
  end if;
  if account.deactivated_at is not null then
    raise exception 'Account % is deactivated', account.email;
  end if;

  insert into public.user_roles (user_id, role)
  values (target, 'super_admin')
  on conflict (user_id, role) do nothing;

  raise notice 'super_admin granted to % (%)', account.email, target;
end;
$$;

select p.email, array_agg(ur.role order by ur.role) as roles
from public.profiles p
join public.user_roles ur on ur.user_id = p.id
where p.id = current_setting('provision.user_id')::uuid
group by p.email;

commit;
