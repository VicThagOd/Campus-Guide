-- Fix updates RLS + add event_tiers perks column + drop ticket_price from events
-- Idempotent migration

-- 1. Fix updates table RLS (ensure policies exist)
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'updates_public_select' AND tablename = 'updates') THEN
    CREATE POLICY updates_public_select ON public.updates FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'updates_authenticated_insert' AND tablename = 'updates') THEN
    CREATE POLICY updates_authenticated_insert ON public.updates FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'updates_authenticated_update' AND tablename = 'updates') THEN
    CREATE POLICY updates_authenticated_update ON public.updates FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'updates_authenticated_delete' AND tablename = 'updates') THEN
    CREATE POLICY updates_authenticated_delete ON public.updates FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 2. Add perks/description column to event_tiers for custom tier benefits
ALTER TABLE public.event_tiers ADD COLUMN IF NOT EXISTS perks TEXT;

-- 3. Ensure checked_in column exists on event_tickets
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;

-- 4. Ensure campus-media storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('campus-media', 'campus-media', true, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for campus-media
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campus_media_public_read') THEN
    CREATE POLICY "campus_media_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'campus-media');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campus_media_authenticated_insert') THEN
    CREATE POLICY "campus_media_authenticated_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campus-media');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campus_media_authenticated_delete') THEN
    CREATE POLICY "campus_media_authenticated_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'campus-media');
  END IF;
END $$;
