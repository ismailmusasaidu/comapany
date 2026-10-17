/*
# Private document storage for logistics requests

1. Summary
   Customers attach supporting documents (invoices, waybills, ID, etc.) to
   their logistics requests. Until now the wizards only recorded the file
   NAMES as text — the files themselves were never stored. This migration
   creates a private storage bucket and links uploaded files to requests.

2. Storage
   - New PRIVATE bucket "logistics-documents". Private means files are only
     downloadable by the customer who uploaded them or by admin staff,
     through short-lived signed links.
   - Files are stored under per-user folders: <user_id>/<request_ref>/...
     so the access rules can enforce ownership per folder.

3. Security (storage policies)
   - INSERT: signed-in users may upload only into their own folder
     (first path segment = their user id).
   - SELECT: a user may list/read only their own files; admin users may
     read everything.
   - DELETE: users may delete their own files.
   - Admin check reuses the existing public.is_admin() pattern used by the
     app's tables (fallback to admin_users lookup if the function differs).

4. Table changes (non-destructive additions)
   - logistics_requests + documents jsonb not null default '[]'
     (array of { path, name, type } entries written after upload).
   - business_logistics_requests + documents jsonb not null default '[]'

5. Notes
   - No columns are dropped or altered; defaults keep existing rows valid.
*/

-- 1. Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logistics-documents', 'logistics-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies (drop first for idempotency)
DROP POLICY IF EXISTS "users_upload_own_docs" ON storage.objects;
DROP POLICY IF EXISTS "users_read_own_docs" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_docs" ON storage.objects;
DROP POLICY IF EXISTS "admin_read_all_docs" ON storage.objects;

CREATE POLICY "users_upload_own_docs" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logistics-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "users_read_own_docs" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logistics-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "users_delete_own_docs" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logistics-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "admin_read_all_docs" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logistics-documents'
  AND EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = (select auth.uid())
  )
);

-- 3. Table columns
ALTER TABLE public.logistics_requests
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.business_logistics_requests
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]';