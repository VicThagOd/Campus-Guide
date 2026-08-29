-- Comprehensive Migration to Fix Admin RLS Policies, Storage Buckets, and Student Submissions
-- This migration fixes:
-- 1. Admin write policies (INSERT, UPDATE, DELETE) for accommodations, events, updates, important_dates, fresher_stages.
-- 2. Student Ask Campus Guide question submission (allow public insert) and Admin moderation view/update/delete.
-- 3. Newsletter subscribers and Profiles SELECT policies for admin dashboard email export.
-- 4. Shared media storage bucket ('campus-media') creation and public/authenticated storage policies.

-- ============================================================================
-- 1. Accommodations Table Policies
-- ============================================================================
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accommodations_public_select ON public.accommodations;
CREATE POLICY accommodations_public_select ON public.accommodations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS accommodations_authenticated_insert ON public.accommodations;
CREATE POLICY accommodations_authenticated_insert ON public.accommodations
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS accommodations_authenticated_update ON public.accommodations;
CREATE POLICY accommodations_authenticated_update ON public.accommodations
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS accommodations_authenticated_delete ON public.accommodations;
CREATE POLICY accommodations_authenticated_delete ON public.accommodations
    FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 2. Events Table Policies
-- ============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_public_select ON public.events;
CREATE POLICY events_public_select ON public.events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS events_authenticated_insert ON public.events;
CREATE POLICY events_authenticated_insert ON public.events
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS events_authenticated_update ON public.events;
CREATE POLICY events_authenticated_update ON public.events
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS events_authenticated_delete ON public.events;
CREATE POLICY events_authenticated_delete ON public.events
    FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 3. Updates Table Policies
-- ============================================================================
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS updates_public_select ON public.updates;
CREATE POLICY updates_public_select ON public.updates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS updates_authenticated_insert ON public.updates;
CREATE POLICY updates_authenticated_insert ON public.updates
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS updates_authenticated_update ON public.updates;
CREATE POLICY updates_authenticated_update ON public.updates
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS updates_authenticated_delete ON public.updates;
CREATE POLICY updates_authenticated_delete ON public.updates
    FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 4. Important Dates Table Policies
-- ============================================================================
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS important_dates_public_select ON public.important_dates;
CREATE POLICY important_dates_public_select ON public.important_dates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS important_dates_authenticated_insert ON public.important_dates;
CREATE POLICY important_dates_authenticated_insert ON public.important_dates
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS important_dates_authenticated_update ON public.important_dates;
CREATE POLICY important_dates_authenticated_update ON public.important_dates
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS important_dates_authenticated_delete ON public.important_dates;
CREATE POLICY important_dates_authenticated_delete ON public.important_dates
    FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 5. Fresher Stages Table Policies
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fresher_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    steps TEXT[] NOT NULL DEFAULT '{}',
    icon TEXT DEFAULT 'checkmark',
    stage_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fresher_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fresher_stages_public_select ON public.fresher_stages;
CREATE POLICY fresher_stages_public_select ON public.fresher_stages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS fresher_stages_authenticated_insert ON public.fresher_stages;
CREATE POLICY fresher_stages_authenticated_insert ON public.fresher_stages
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS fresher_stages_authenticated_update ON public.fresher_stages;
CREATE POLICY fresher_stages_authenticated_update ON public.fresher_stages
    FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS fresher_stages_authenticated_delete ON public.fresher_stages;
CREATE POLICY fresher_stages_authenticated_delete ON public.fresher_stages
    FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 6. Ask Questions Table Policies (Fixes student submissions & admin view)
-- ============================================================================
ALTER TABLE public.ask_questions ENABLE ROW LEVEL SECURITY;

-- Allow any student (logged in or guest) to submit a question
DROP POLICY IF EXISTS ask_questions_public_insert ON public.ask_questions;
DROP POLICY IF EXISTS ask_questions_auth_insert ON public.ask_questions;
CREATE POLICY ask_questions_public_insert ON public.ask_questions
    FOR INSERT WITH CHECK (true);

-- Allow students to view their own questions
DROP POLICY IF EXISTS ask_questions_own_select ON public.ask_questions;
CREATE POLICY ask_questions_own_select ON public.ask_questions
    FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated admins to view ALL questions for moderation
DROP POLICY IF EXISTS ask_questions_authenticated_select ON public.ask_questions;
CREATE POLICY ask_questions_authenticated_select ON public.ask_questions
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated admins to update (answer) questions
DROP POLICY IF EXISTS ask_questions_authenticated_update ON public.ask_questions;
CREATE POLICY ask_questions_authenticated_update ON public.ask_questions
    FOR UPDATE TO authenticated USING (true);

-- Allow authenticated admins to delete questions
DROP POLICY IF EXISTS ask_questions_authenticated_delete ON public.ask_questions;
CREATE POLICY ask_questions_authenticated_delete ON public.ask_questions
    FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 7. Newsletter Subscribers & Profiles Policies (Email List Export)
-- ============================================================================
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletter_public_insert ON public.newsletter_subscribers;
CREATE POLICY newsletter_public_insert ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS newsletter_authenticated_select ON public.newsletter_subscribers;
CREATE POLICY newsletter_authenticated_select ON public.newsletter_subscribers
    FOR SELECT TO authenticated USING (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_authenticated_select ON public.profiles;
CREATE POLICY profiles_authenticated_select ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 8. Storage Bucket & Policies for 'campus-media'
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('campus-media', 'campus-media', true, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "campus_media_public_read" ON storage.objects;
CREATE POLICY "campus_media_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "campus_media_authenticated_insert" ON storage.objects;
CREATE POLICY "campus_media_authenticated_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "campus_media_authenticated_update" ON storage.objects;
CREATE POLICY "campus_media_authenticated_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'campus-media');

DROP POLICY IF EXISTS "campus_media_authenticated_delete" ON storage.objects;
CREATE POLICY "campus_media_authenticated_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'campus-media');
