-- Flagship event files: each event's folder of working documents (notesheets,
-- brochures, certificates, reports, photos, videos), kept in sub-folders.
--
-- * activity_files: one row per file as people see it: its event, folder
--   path ("Certificates/Scanned certificates"), and file name. Rows with no
--   event are shared files and templates for all flagship events.
-- * event-files bucket: the bytes, stored once per content hash at
--   blobs/{sha256}. Rows with identical content point at the same object, so
--   a file copied into several folders takes its space once.
--
-- Internal-only: anon gets nothing; internal roles read and download;
-- editors upload, rename, and move; administrators delete.

create table public.activity_files (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references public.activities (id) on delete cascade,
  -- "" for the event's top level; otherwise "A/B" with no leading, trailing,
  -- or doubled slashes.
  folder text not null default ''
    check (char_length(folder) <= 400 and folder !~ '(^/|/$|//|\.\.|\\)'),
  name text not null
    check (char_length(name) between 1 and 255 and name !~ '[/\\]' and name not in ('.', '..')),
  storage_path text not null check (storage_path ~ '^blobs/[0-9a-f]{64}$'),
  mime_type text check (char_length(mime_type) <= 200),
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create unique index activity_files_location_key
  on public.activity_files (coalesce(activity_id, '00000000-0000-0000-0000-000000000000'::uuid), folder, name);
create index activity_files_activity_id_idx on public.activity_files (activity_id);
create index activity_files_storage_path_idx on public.activity_files (storage_path);

alter table public.activity_files enable row level security;

create trigger activity_files_set_audit_fields
  before insert or update on public.activity_files
  for each row execute function public.set_audit_fields();

create trigger activity_files_write_audit_log
  after insert or update or delete on public.activity_files
  for each row execute function public.write_audit_log();

revoke all on public.activity_files from anon;
revoke truncate, references, trigger on public.activity_files from authenticated;
grant select, insert, delete on public.activity_files to authenticated;
grant update (folder, name) on public.activity_files to authenticated;

create policy "Internal roles read event files"
  on public.activity_files for select to authenticated
  using ((select private.is_internal()));

create policy "Internal editors add event files"
  on public.activity_files for insert to authenticated
  with check ((select private.can_edit_internal()));

create policy "Internal editors rename and move event files"
  on public.activity_files for update to authenticated
  using ((select private.can_edit_internal()))
  with check ((select private.can_edit_internal()));

create policy "Administrators delete event files"
  on public.activity_files for delete to authenticated
  using ((select private.is_content_admin()));

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

-- 50 MiB is the largest single file the Supabase free plan accepts. Any file
-- type: the bucket is private and only internal editors can write to it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-files', 'event-files', false, 52428800, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Internal roles read event files"
  on storage.objects for select to authenticated
  using (bucket_id = 'event-files' and (select private.is_internal()));

create policy "Internal editors upload event files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-files'
    and (select private.can_edit_internal())
    and name ~ '^blobs/[0-9a-f]{64}$'
  );

create policy "Administrators delete event files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'event-files' and (select private.is_content_admin()));
