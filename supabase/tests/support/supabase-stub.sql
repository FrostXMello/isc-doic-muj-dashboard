-- Minimal stand-ins for the parts of a Supabase database the migrations and
-- SQL tests rely on, so they can run on a plain, throwaway Postgres
-- (scripts/test-db.sh). Never apply this to a real Supabase project.

-- API roles ------------------------------------------------------------------

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- auth -----------------------------------------------------------------------

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;

create function auth.role() returns text
language sql stable
as $$
  select auth.jwt() ->> 'role';
$$;

grant execute on all functions in schema auth to anon, authenticated, service_role;

-- storage --------------------------------------------------------------------

create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, name)
);

alter table storage.objects enable row level security;
grant all on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;

-- A pgTAP subset (plan, ok, is, throws_ok, lives_ok, finish) ------------------
-- Counters live in session settings so any role can record results.

create function extensions._tap(pass boolean, description text) returns text
language plpgsql
as $$
declare
  n integer := coalesce(nullif(current_setting('tap.n', true), ''), '0')::integer + 1;
begin
  perform set_config('tap.n', n::text, false);
  if not coalesce(pass, false) then
    perform set_config('tap.failed',
      (coalesce(nullif(current_setting('tap.failed', true), ''), '0')::integer + 1)::text, false);
  end if;
  return case when coalesce(pass, false) then 'ok ' else 'not ok ' end
    || n || coalesce(' - ' || description, '');
end;
$$;

create function extensions.plan(planned integer) returns text
language plpgsql
as $$
begin
  perform set_config('tap.plan', planned::text, false);
  perform set_config('tap.n', '0', false);
  perform set_config('tap.failed', '0', false);
  return '1..' || planned;
end;
$$;

create function extensions.ok(pass boolean, description text default null) returns text
language sql
as $$ select extensions._tap(pass, description); $$;

create function extensions."is"(have anyelement, want anyelement, description text default null)
returns text
language sql
as $$
  select extensions._tap(have is not distinct from want, description)
    || case when have is distinct from want
         then E'\n# have: ' || coalesce(have::text, 'NULL') || E'\n# want: ' || coalesce(want::text, 'NULL')
         else '' end;
$$;

create function extensions.throws_ok(
  statement text, errcode text, errmsg text default null, description text default null
) returns text
language plpgsql
as $$
begin
  execute statement;
  return extensions._tap(false, description) || E'\n# no error raised';
exception when others then
  if (errcode is null or sqlstate = errcode) and (errmsg is null or sqlerrm = errmsg) then
    return extensions._tap(true, description);
  end if;
  return extensions._tap(false, description)
    || E'\n# got: ' || sqlstate || ' ' || sqlerrm
    || E'\n# want: ' || coalesce(errcode, '*') || ' ' || coalesce(errmsg, '*');
end;
$$;

create function extensions.lives_ok(statement text, description text default null) returns text
language plpgsql
as $$
begin
  execute statement;
  return extensions._tap(true, description);
exception when others then
  return extensions._tap(false, description) || E'\n# died: ' || sqlstate || ' ' || sqlerrm;
end;
$$;

create function extensions.finish() returns setof text
language plpgsql
as $$
declare
  planned integer := nullif(current_setting('tap.plan', true), '')::integer;
  ran integer := coalesce(nullif(current_setting('tap.n', true), ''), '0')::integer;
  failed integer := coalesce(nullif(current_setting('tap.failed', true), ''), '0')::integer;
begin
  if planned is distinct from ran then
    return next '# Looks like you planned ' || coalesce(planned::text, '?') || ' tests but ran ' || ran;
  end if;
  if failed > 0 then
    return next '# Looks like you failed ' || failed || ' test(s) of ' || ran;
  end if;
end;
$$;

grant execute on all functions in schema extensions to anon, authenticated, service_role;
