-- ONE-TIME DESTRUCTIVE SCRIPT. Run manually, never as a migration.
-- This clears application users while preserving events and admin-managed content.
BEGIN;

-- Older installations may have a reviews table without a user_id column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'DELETE FROM public.reviews WHERE user_id IN (SELECT id FROM auth.users)';
  END IF;
END
$$;

DELETE FROM auth.users;

-- Normally removed through the auth.users foreign-key cascade; this also clears
-- legacy profile rows that were created without that constraint.
DELETE FROM public.profiles;

COMMIT;
