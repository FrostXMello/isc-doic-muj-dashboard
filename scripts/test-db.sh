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

exit "$failed"
