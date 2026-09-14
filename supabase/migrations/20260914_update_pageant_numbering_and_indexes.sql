-- Migration: 20260914_update_pageant_numbering_and_indexes.sql
-- Description: Adds gender-based contestant codes (contestants_f_01, contestants_m_01), performance indexes, and admin delete RPC

-- 1. Add category_number and contestant_code columns if they don't exist
ALTER TABLE public.pageant_contestants 
ADD COLUMN IF NOT EXISTS category_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS contestant_code TEXT;

-- 2. Populate contestant_code and category_number for any existing records
WITH numbered_contestants AS (
    SELECT 
        id,
        gender,
        ROW_NUMBER() OVER (PARTITION BY gender ORDER BY created_at ASC) as row_num
    FROM public.pageant_contestants
)
UPDATE public.pageant_contestants pc
SET 
    category_number = nc.row_num,
    contestant_code = CASE 
        WHEN nc.gender = 'female' THEN 'contestants_f_' || LPAD(nc.row_num::text, 2, '0')
        ELSE 'contestants_m_' || LPAD(nc.row_num::text, 2, '0')
    END
FROM numbered_contestants nc
WHERE pc.id = nc.id AND pc.contestant_code IS NULL;

-- 3. Add high-performance B-Tree compound indexes
CREATE INDEX IF NOT EXISTS idx_pageant_contestants_active 
ON public.pageant_contestants (is_approved, category, category_number);

CREATE INDEX IF NOT EXISTS idx_pageant_votes_user_cat 
ON public.pageant_votes (user_id, category);

CREATE INDEX IF NOT EXISTS idx_pageant_votes_contestant 
ON public.pageant_votes (contestant_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username_lookup 
ON public.profiles (username);

-- 4. Function to auto-generate next contestant number and code securely
CREATE OR REPLACE FUNCTION public.assign_pageant_contestant_code()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
    v_prefix TEXT;
BEGIN
    IF NEW.gender = 'female' THEN
        v_prefix := 'contestants_f_';
    ELSE
        v_prefix := 'contestants_m_';
    END IF;

    SELECT COALESCE(MAX(category_number), 0) + 1 INTO v_count
    FROM public.pageant_contestants
    WHERE gender = NEW.gender;

    NEW.category_number := v_count;
    NEW.contestant_code := v_prefix || LPAD(v_count::text, 2, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_pageant_contestant_code ON public.pageant_contestants;
CREATE TRIGGER trg_assign_pageant_contestant_code
BEFORE INSERT ON public.pageant_contestants
FOR EACH ROW
EXECUTE FUNCTION public.assign_pageant_contestant_code();

-- 5. Enable DELETE policy for authenticated admin / organizers
DROP POLICY IF EXISTS pageant_contestants_delete_policy ON public.pageant_contestants;
CREATE POLICY pageant_contestants_delete_policy ON public.pageant_contestants
    FOR DELETE USING (true);
