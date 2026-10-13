#!/usr/bin/env bash
# Runs the SQL test suites against a throwaway local Postgres: a fresh
# cluster in a temp directory, listening only on a private Unix socket,
# deleted on exit. Nothing touches a hosted database.
#
# Applies supabase/tests/support/supabase-stub.sql, every migration, then
# each supabase/tests/database/*.test.sql. Then rolls the latest admin
# migration back, re-applies it, and runs the suites again.
#
# Needs Postgres 16 binaries (PG_BIN, default: Homebrew postgresql@16).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
PORT="${PGTEST_PORT:-54329}"
WORK="$(mktemp -d)"

cleanup() {
  "$PG_BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"$PG_BIN/initdb" -D "$WORK/data" -U postgres -A trust --no-sync >/dev/null
"$PG_BIN/pg_ctl" -D "$WORK/data" -l "$WORK/postgres.log" -w \
  -o "-p $PORT -k $WORK -c listen_addresses=''" start >/dev/null

psql_db() {
  "$PG_BIN/psql" -h "$WORK" -p "$PORT" -U postgres -X -q -v ON_ERROR_STOP=1 "$@"
}

psql_db -d postgres -c "create database doic_test"
psql_db -d postgres -c "alter database doic_test set search_path = public, extensions"
psql_db -d doic_test -f "$ROOT/supabase/tests/support/supabase-stub.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  psql_db -d doic_test -1 -f "$migration" >/dev/null
done
echo "Applied $(ls "$ROOT"/supabase/migrations/*.sql | wc -l | tr -d ' ') migrations."

failed=0
run_suites() {
  for suite in "$ROOT"/supabase/tests/database/*.test.sql; do
    local output
    if ! output="$(sed '/create extension if not exists pgtap/d' "$suite" \
        | psql_db -d doic_test -t -A 2>&1)"; then
      echo "FAIL $(basename "$suite") (error)"
      echo "$output" | tail -20
      failed=1
      continue
    fi
    if echo "$output" | grep -qE '^(not ok|# Looks like)'; then
      echo "FAIL $(basename "$suite")"
      echo "$output" | grep -E -A3 '^(not ok|# Looks like)'
      failed=1
    else
      echo "ok   $(basename "$suite") ($(echo "$output" | grep -c '^ok ') tests)"
    fi
  done
}

run_suites

latest="$(ls "$ROOT"/supabase/rollbacks/*.down.sql | sort | tail -1)"
migration="$ROOT/supabase/migrations/$(basename "$latest" .down.sql).sql"
psql_db -d doic_test -1 -f "$latest" >/dev/null
psql_db -d doic_test -1 -f "$migration" >/dev/null
echo "Rolled back and re-applied $(basename "$migration")."
run_suites

# Super Admin provisioning: refuses unknown accounts, grants an existing one.
provision="$ROOT/supabase/provisioning/grant-super-admin.sql"
if psql_db -d doic_test -v user_id=00000000-0000-4000-c000-000000000001 -f "$provision" >/dev/null 2>&1; then
  echo "FAIL provisioning accepted an unknown account"; failed=1
fi
psql_db -d doic_test -c "insert into auth.users (id, email) values ('00000000-0000-4000-c000-000000000001', 'owner@test.local')"
psql_db -d doic_test -v user_id=00000000-0000-4000-c000-000000000001 -f "$provision" >/dev/null 2>&1
if [ "$(psql_db -d doic_test -t -A -c "select count(*) from public.user_roles where user_id = '00000000-0000-4000-c000-000000000001' and role = 'super_admin'")" = "1" ]; then
  echo "ok   grant-super-admin.sql"
else
  echo "FAIL grant-super-admin.sql"; failed=1
fi

# MoU register import (only when the gitignored import SQL exists): loads the
# official seeds and contacts, imports, re-imports, rolls back, and checks
# that the rollback restores the pre-import data exactly.
import_sql="$ROOT/supabase/private/mou-workbook-import.sql"
rollback_sql="$ROOT/supabase/private/mou-workbook-rollback.sql"
if [ -f "$import_sql" ] && [ -f "$rollback_sql" ]; then
  psql_db -d postgres -c "create database doic_import template doic_test"
  for seed in "$ROOT/supabase/seeds/01_official.sql" "$ROOT/supabase/seeds/02_directory.sql" "$ROOT/supabase/private/muj-nodal-contacts.sql"; do
    if [ -f "$seed" ]; then psql_db -d doic_import -1 -f "$seed" >/dev/null; fi
  done
  # updated_at/updated_by are excluded: the audit trigger stamps the rollback.
  snapshot_rows="
    select 'c:' || (to_jsonb(c) - 'updated_at' - 'updated_by')::text as x from public.countries c
    union all select 'i:' || (to_jsonb(i) - 'updated_at' - 'updated_by')::text from public.institutions i
    union all select 'a:' || (to_jsonb(a) - 'updated_at' - 'updated_by')::text from public.agreements a
    union all select 'n:' || (to_jsonb(n) - 'updated_at' - 'updated_by')::text from public.institution_contacts n"
  psql_db -d doic_import -c "create table private.pre_import_snapshot as $snapshot_rows"
  counts() {
    psql_db -d doic_import -t -A -c "
      select (select count(*) from public.institutions) || ' institutions, '
        || (select count(*) from public.agreements) || ' agreements, '
        || (select count(*) from public.agreement_details) || ' details, '
        || (select count(*) from public.institution_contacts) || ' contacts, '
        || (select count(*) from public.source_workbook_rows) || ' source rows'"
  }
  echo "Before import: $(counts)"
  psql_db -d doic_import -f "$import_sql" >/dev/null
  first="$(counts)"
  echo "After import:  $first"
  psql_db -d doic_import -f "$import_sql" >/dev/null
  if [ "$(counts)" = "$first" ]; then echo "ok   re-running the import changes nothing"; else
    echo "FAIL re-import changed counts: $(counts)"; failed=1; fi
  unlinked="$(psql_db -d doic_import -t -A -c "
    select count(*) from public.source_workbook_rows
    where match_status in ('matched', 'created') and institution_id is null")"
  expected_details="$(grep -c "insert into public.agreement_details" "$import_sql" || true)"
  details_now="$(psql_db -d doic_import -t -A -c "select count(*) from public.agreement_details")"
  if [ "$details_now" = "$expected_details" ]; then echo "ok   every planned agreement detail row was imported ($details_now)"; else
    echo "FAIL $details_now agreement detail rows imported, $expected_details planned"; failed=1; fi
  if [ "$unlinked" = "0" ]; then echo "ok   every matched source row is linked to its university"; else
    echo "FAIL $unlinked matched source rows lost their university"; failed=1; fi
  psql_db -d doic_import -f "$rollback_sql" >/dev/null
  differences="$(psql_db -d doic_import -t -A -c "
    (select '- ' || x from private.pre_import_snapshot except select '- ' || x from ($snapshot_rows) now)
    union all
    (select '+ ' || x from ($snapshot_rows) now except select '+ ' || x from private.pre_import_snapshot)")"
  if [ -z "$differences" ]; then echo "ok   rollback restores the pre-import data exactly"; else
    echo "FAIL rollback left differences:"; echo "$differences" | cut -c1-300 | sed -n '1,10p'; failed=1; fi
  echo "After rollback: $(counts)"
else
  echo "skip MoU register import test (run npm run db:mou:plan first)"
fi

exit "$failed"
