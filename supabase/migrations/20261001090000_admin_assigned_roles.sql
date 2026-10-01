-- Portal access is assigned by a DoIC admin, never by signing up.
--
-- Public email sign-up is enabled on the hosted project, and the publishable
-- key is public, so anyone could create an account through the Auth API. The
-- signup trigger used to grant `student` to every new account, which made
-- that self-registration a student login. New accounts now get a profile only;
-- the app sends users without a role to /access-pending until an admin grants
-- one in public.user_roles.
--
-- The update policy on user_roles also let an admin rewrite their own
-- doic_admin grant to another role, bypassing the "cannot remove your own
-- admin role" rule the delete policy enforces. It now applies the same guard.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy "DoIC admins change role grants" on public.user_roles;

create policy "DoIC admins change role grants"
  on public.user_roles for update to authenticated
  using (
    (select private.is_doic_admin())
    and not (user_id = (select auth.uid()) and role = 'doic_admin')
  )
  with check ((select private.is_doic_admin()));
