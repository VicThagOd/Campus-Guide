-- Migration: 20260913_create_pageant_tables.sql
-- Description: Creates tables and functions for Campus Guide Pageantry (Mr & Mrs Campus Guide)

-- 1. Create pageant_contestants table
CREATE TABLE IF NOT EXISTS public.pageant_contestants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contestant_number SERIAL,
    user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    matric_number TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    category TEXT NOT NULL CHECK (category IN ('mr_campus_guide', 'miss_campus_guide', 'mrs_campus_guide')),
    department TEXT NOT NULL,
    level TEXT NOT NULL,
    state_of_origin TEXT,
    bio TEXT,
    why_face_of_cg TEXT,
    social_handles JSONB DEFAULT '{}'::jsonb,
    cover_photo_url TEXT NOT NULL,
    seated_photo_url TEXT NOT NULL,
    standing_photo_url TEXT NOT NULL,
    payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed')),
    payment_reference TEXT,
    is_approved BOOLEAN DEFAULT true,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create pageant_votes table
CREATE TABLE IF NOT EXISTS public.pageant_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    contestant_id UUID REFERENCES public.pageant_contestants (id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('mr_campus_guide', 'miss_campus_guide', 'mrs_campus_guide')),
    voter_name TEXT,
    voter_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_category_vote UNIQUE (user_id, category)
);

-- 3. Create pageant_settings table
CREATE TABLE IF NOT EXISTS public.pageant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_open BOOLEAN DEFAULT true,
    voting_live BOOLEAN DEFAULT false,
    registration_fee NUMERIC DEFAULT 1000.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings if empty
INSERT INTO public.pageant_settings (registration_open, voting_live, registration_fee)
SELECT true, true, 1000.00
WHERE NOT EXISTS (SELECT 1 FROM public.pageant_settings);

-- 4. Enable Row Level Security
ALTER TABLE public.pageant_contestants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pageant_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pageant_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policies for pageant_contestants
DROP POLICY IF EXISTS pageant_contestants_public_select ON public.pageant_contestants;
CREATE POLICY pageant_contestants_public_select ON public.pageant_contestants
    FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS pageant_contestants_insert_public ON public.pageant_contestants;
CREATE POLICY pageant_contestants_insert_public ON public.pageant_contestants
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS pageant_contestants_admin_all ON public.pageant_contestants;
CREATE POLICY pageant_contestants_admin_all ON public.pageant_contestants
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Policies for pageant_votes
DROP POLICY IF EXISTS pageant_votes_select_own ON public.pageant_votes;
CREATE POLICY pageant_votes_select_own ON public.pageant_votes
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS pageant_votes_insert_own ON public.pageant_votes;
CREATE POLICY pageant_votes_insert_own ON public.pageant_votes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 7. Policies for pageant_settings
DROP POLICY IF EXISTS pageant_settings_public_select ON public.pageant_settings;
CREATE POLICY pageant_settings_public_select ON public.pageant_settings
    FOR SELECT USING (true);

-- 8. Safe Atomic Vote RPC Function
CREATE OR REPLACE FUNCTION public.cast_pageant_vote(
    p_contestant_id UUID,
    p_category TEXT,
    p_voter_name TEXT DEFAULT '',
    p_voter_phone TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_contestant_category TEXT;
    v_already_voted BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You must be logged in to vote.');
    END IF;

    -- Verify contestant exists and category matches
    SELECT category INTO v_contestant_category
    FROM public.pageant_contestants
    WHERE id = p_contestant_id AND is_approved = true;

    IF v_contestant_category IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contestant not found or not approved.');
    END IF;

    IF v_contestant_category != p_category THEN
        RETURN jsonb_build_object('success', false, 'error', 'Category mismatch for this contestant.');
    END IF;

    -- Check if user already voted in this category
    SELECT EXISTS (
        SELECT 1 FROM public.pageant_votes
        WHERE user_id = v_user_id AND category = p_category
    ) INTO v_already_voted;

    IF v_already_voted THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already cast your vote in this category.');
    END IF;

    -- Record the vote
    INSERT INTO public.pageant_votes (user_id, contestant_id, category, voter_name, voter_phone)
    VALUES (v_user_id, p_contestant_id, p_category, p_voter_name, p_voter_phone);

    -- Increment contestant vote tally
    UPDATE public.pageant_contestants
    SET votes_count = COALESCE(votes_count, 0) + 1
    WHERE id = p_contestant_id;

    RETURN jsonb_build_object('success', true, 'message', 'Vote cast successfully!');
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already voted in this category.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 9. Storage bucket for pageant photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pageant_photos', 'pageant_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket read/write policies
DROP POLICY IF EXISTS "Public can view pageant photos" ON storage.objects;
CREATE POLICY "Public can view pageant photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'pageant_photos');

DROP POLICY IF EXISTS "Public can upload pageant photos" ON storage.objects;
CREATE POLICY "Public can upload pageant photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pageant_photos');
