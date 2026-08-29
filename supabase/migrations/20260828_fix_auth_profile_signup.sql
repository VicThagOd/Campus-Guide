-- Keep public profiles synchronized with Supabase Auth signups.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_username TEXT;
BEGIN
  requested_username := LOWER(COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  ));

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = requested_username AND id <> NEW.id) THEN
    requested_username := requested_username || '-' || LEFT(NEW.id::text, 6);
  END IF;

  INSERT INTO public.profiles (id, email, name, username, course, email_opt_in, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''), 'Campus Guide User'),
    requested_username,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'course'), ''), 'Post UTME Candidate'),
    COALESCE((NEW.raw_user_meta_data ->> 'email_opt_in')::boolean, false),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'user_type', ''), 'aspirant')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    course = EXCLUDED.course,
    email_opt_in = EXCLUDED.email_opt_in,
    user_type = EXCLUDED.user_type;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Repair auth users that were created before the trigger existed.
INSERT INTO public.profiles (id, email, name, username, course, email_opt_in, user_type)
SELECT
  user_row.id,
  user_row.email,
  COALESCE(NULLIF(TRIM(user_row.raw_user_meta_data ->> 'name'), ''), 'Campus Guide User'),
  LOWER(COALESCE(NULLIF(TRIM(user_row.raw_user_meta_data ->> 'username'), ''), SPLIT_PART(user_row.email, '@', 1) || '-' || LEFT(user_row.id::text, 6))),
  COALESCE(NULLIF(TRIM(user_row.raw_user_meta_data ->> 'course'), ''), 'Post UTME Candidate'),
  COALESCE((user_row.raw_user_meta_data ->> 'email_opt_in')::boolean, false),
  COALESCE(NULLIF(user_row.raw_user_meta_data ->> 'user_type', ''), 'aspirant')
FROM auth.users AS user_row
WHERE NOT EXISTS (SELECT 1 FROM public.profiles profile WHERE profile.id = user_row.id)
ON CONFLICT DO NOTHING;
