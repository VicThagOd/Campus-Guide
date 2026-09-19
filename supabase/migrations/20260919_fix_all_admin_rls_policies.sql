-- Migration: 20260919_fix_all_admin_rls_policies.sql
-- Description: Fixes Row-Level Security (RLS) policies for all Admin-managed tables so INSERT, UPDATE, and DELETE operations succeed seamlessly under Master Key mode.

-- 1. important_dates
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS important_dates_public_select ON public.important_dates;
DROP POLICY IF EXISTS important_dates_authenticated_insert ON public.important_dates;
DROP POLICY IF EXISTS important_dates_authenticated_update ON public.important_dates;
DROP POLICY IF EXISTS important_dates_authenticated_delete ON public.important_dates;

DROP POLICY IF EXISTS important_dates_all_public ON public.important_dates;
CREATE POLICY important_dates_all_public ON public.important_dates
    FOR ALL USING (true) WITH CHECK (true);

-- 2. updates
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS updates_public_select ON public.updates;
DROP POLICY IF EXISTS updates_authenticated_insert ON public.updates;
DROP POLICY IF EXISTS updates_authenticated_update ON public.updates;
DROP POLICY IF EXISTS updates_authenticated_delete ON public.updates;

DROP POLICY IF EXISTS updates_all_public ON public.updates;
CREATE POLICY updates_all_public ON public.updates
    FOR ALL USING (true) WITH CHECK (true);

-- 3. accommodations
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accommodations_public_select ON public.accommodations;
DROP POLICY IF EXISTS accommodations_authenticated_insert ON public.accommodations;
DROP POLICY IF EXISTS accommodations_authenticated_update ON public.accommodations;
DROP POLICY IF EXISTS accommodations_authenticated_delete ON public.accommodations;

DROP POLICY IF EXISTS accommodations_all_public ON public.accommodations;
CREATE POLICY accommodations_all_public ON public.accommodations
    FOR ALL USING (true) WITH CHECK (true);

-- 4. events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_public_select ON public.events;
DROP POLICY IF EXISTS events_authenticated_insert ON public.events;
DROP POLICY IF EXISTS events_authenticated_update ON public.events;
DROP POLICY IF EXISTS events_authenticated_delete ON public.events;

DROP POLICY IF EXISTS events_all_public ON public.events;
CREATE POLICY events_all_public ON public.events
    FOR ALL USING (true) WITH CHECK (true);

-- 5. event_tiers (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_tiers') THEN
        ALTER TABLE public.event_tiers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS event_tiers_all_public ON public.event_tiers;
        CREATE POLICY event_tiers_all_public ON public.event_tiers
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 6. fresher_stages (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fresher_stages') THEN
        ALTER TABLE public.fresher_stages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS fresher_stages_all_public ON public.fresher_stages;
        CREATE POLICY fresher_stages_all_public ON public.fresher_stages
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 7. ask_campus_guide_questions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ask_campus_guide_questions') THEN
        ALTER TABLE public.ask_campus_guide_questions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS ask_campus_guide_questions_all_public ON public.ask_campus_guide_questions;
        CREATE POLICY ask_campus_guide_questions_all_public ON public.ask_campus_guide_questions
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 8. Storage bucket 'campus-media' policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('campus-media', 'campus-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public view campus-media" ON storage.objects;
CREATE POLICY "Public view campus-media" ON storage.objects
    FOR SELECT USING (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "Public insert campus-media" ON storage.objects;
CREATE POLICY "Public insert campus-media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "Public update campus-media" ON storage.objects;
CREATE POLICY "Public update campus-media" ON storage.objects
    FOR UPDATE USING (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "Public delete campus-media" ON storage.objects;
CREATE POLICY "Public delete campus-media" ON storage.objects
    FOR DELETE USING (bucket_id = 'campus-media');
