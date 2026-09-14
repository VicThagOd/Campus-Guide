-- Migration: 20260915_update_miss_campus_guide_naming.sql
-- Description: Update category naming to Miss Campus Guide ('miss_campus_guide') across constraints, indexes, and functions.

-- 1. Update check constraints on pageant_contestants
ALTER TABLE public.pageant_contestants DROP CONSTRAINT IF EXISTS pageant_contestants_category_check;
ALTER TABLE public.pageant_contestants ADD CONSTRAINT pageant_contestants_category_check 
  CHECK (category IN ('mr_campus_guide', 'miss_campus_guide', 'mrs_campus_guide'));

-- 2. Update check constraints on pageant_votes
ALTER TABLE public.pageant_votes DROP CONSTRAINT IF EXISTS pageant_votes_category_check;
ALTER TABLE public.pageant_votes ADD CONSTRAINT pageant_votes_category_check 
  CHECK (category IN ('mr_campus_guide', 'miss_campus_guide', 'mrs_campus_guide'));

-- 3. Update existing records if any
UPDATE public.pageant_contestants SET category = 'miss_campus_guide' WHERE category = 'mrs_campus_guide';
UPDATE public.pageant_votes SET category = 'miss_campus_guide' WHERE category = 'mrs_campus_guide';

-- 4. Update the cast_pageant_vote RPC function to handle miss_campus_guide and mr_campus_guide
CREATE OR REPLACE FUNCTION public.cast_pageant_vote(
    p_contestant_id UUID,
    p_category TEXT,
    p_voter_name TEXT DEFAULT NULL,
    p_voter_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_contestant RECORD;
    v_effective_category TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required to vote.');
    END IF;

    -- Standardize category name
    IF p_category = 'mrs_campus_guide' THEN
        v_effective_category := 'miss_campus_guide';
    ELSE
        v_effective_category := p_category;
    END IF;

    -- Verify contestant exists, is approved, and matches category
    SELECT id, category, gender, is_approved INTO v_contestant
    FROM public.pageant_contestants
    WHERE id = p_contestant_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contestant not found.');
    END IF;

    IF NOT v_contestant.is_approved THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contestant is not currently active for voting.');
    END IF;

    -- Check category match
    IF v_contestant.category != v_effective_category AND NOT (v_contestant.category = 'mrs_campus_guide' AND v_effective_category = 'miss_campus_guide') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Category mismatch.');
    END IF;

    -- Check if user has already voted in this category
    IF EXISTS (
        SELECT 1 FROM public.pageant_votes 
        WHERE user_id = v_user_id 
        AND (category = v_effective_category OR (v_effective_category = 'miss_campus_guide' AND category = 'mrs_campus_guide'))
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already cast your vote in this category.');
    END IF;

    -- Insert vote
    INSERT INTO public.pageant_votes (user_id, contestant_id, category, voter_name, voter_phone)
    VALUES (v_user_id, p_contestant_id, v_effective_category, p_voter_name, p_voter_phone);

    -- Increment contestant vote counter atomically
    UPDATE public.pageant_contestants
    SET votes_count = COALESCE(votes_count, 0) + 1
    WHERE id = p_contestant_id;

    RETURN jsonb_build_object('success', true, 'message', 'Vote cast successfully.');
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already voted in this category.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
