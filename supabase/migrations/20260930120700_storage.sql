-- Private bucket for institutional documents (signed agreements, brochures,
-- programme guides, reports).
--
-- Object path convention: {entity_type}/{entity_id}/{filename}
--   entity_type  institutions | agreements | programs | program-availability |
--                opportunities | activities | documents
--   entity_id    the row's uuid
-- The matching public.documents row stores storage_bucket + storage_path.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'institutional-documents',
  'institutional-documents',
  false,
  26214400, -- 25 MiB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_valid_document_object_path(object_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    object_name ~ '^(institutions|agreements|programs|program-availability|opportunities|activities|documents)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$',
    false
  );
$$;

create policy "Internal roles read institutional documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'institutional-documents'
    and (select public.is_internal())
  );

create policy "Internal editors upload institutional documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'institutional-documents'
    and (select public.can_edit_internal())
    and public.is_valid_document_object_path(name)
  );

create policy "Internal editors replace institutional documents"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'institutional-documents'
    and (select public.can_edit_internal())
  )
  with check (
    bucket_id = 'institutional-documents'
    and (select public.can_edit_internal())
    and public.is_valid_document_object_path(name)
  );

create policy "DoIC admins delete institutional documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'institutional-documents'
    and (select public.is_doic_admin())
  );
