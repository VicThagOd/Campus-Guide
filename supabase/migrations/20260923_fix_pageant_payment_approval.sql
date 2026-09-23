-- Migration: 20260923_fix_pageant_payment_approval.sql
-- Description: Fix default values for pageant contestants to require payment confirmation before approval.

-- 1. Fix default values for contestant table so new submissions are pending and unapproved
ALTER TABLE public.pageant_contestants 
  ALTER COLUMN is_approved SET DEFAULT false,
  ALTER COLUMN payment_status SET DEFAULT 'pending';

-- 2. Revoke approval from any contestant who has not completed verified payment
UPDATE public.pageant_contestants
SET is_approved = false
WHERE payment_status != 'completed' 
   OR payment_reference IS NULL;

-- 3. Ensure approved contestants are only those with completed payment
UPDATE public.pageant_contestants
SET is_approved = true
WHERE payment_status = 'completed' 
  AND payment_reference IS NOT NULL;
