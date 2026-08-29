-- Drop the receipt verification flow: tables, storage bucket, and any leftovers.
DROP TABLE IF EXISTS public.receipts;
DROP TABLE IF EXISTS public.unlock_codes;

-- Remove the receipts storage bucket and its objects.
DELETE FROM storage.objects WHERE bucket_id = 'receipts';
DELETE FROM storage.buckets WHERE id = 'receipts';

-- Shared media bucket for admin uploads (accommodation photos/videos, etc.).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('campus-media', 'campus-media', true, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;

-- Public read so student-facing pages can display uploaded media.
DROP POLICY IF EXISTS "campus_media_public_read" ON storage.objects;
CREATE POLICY "campus_media_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'campus-media');

-- Authenticated users (admin session) may upload, update and delete media.
DROP POLICY IF EXISTS "campus_media_authenticated_insert" ON storage.objects;
CREATE POLICY "campus_media_authenticated_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "campus_media_authenticated_update" ON storage.objects;
CREATE POLICY "campus_media_authenticated_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "campus_media_authenticated_delete" ON storage.objects;
CREATE POLICY "campus_media_authenticated_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'campus-media');