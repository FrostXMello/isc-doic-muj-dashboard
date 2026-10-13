-- Two administrator roles above the existing ones. New enum values cannot be
-- used in the transaction that adds them, so this migration only adds the
-- values; 20261005090100_admin_control.sql defines what they may do.
--
--   super_admin  Assigns and revokes administrator roles. Provisioned only
--                by the project owner with SQL (supabase/provisioning), never
--                by sign-up, email address, or first login.
--   isc_admin    International Student Cell administrator: content
--                administration and ordinary account management.
--
-- Rollback: enum values cannot be dropped in place. Unused values are inert;
-- see supabase/rollbacks/20261005090100_admin_control.down.sql.

alter type public.app_role add value if not exists 'super_admin';
alter type public.app_role add value if not exists 'isc_admin';
