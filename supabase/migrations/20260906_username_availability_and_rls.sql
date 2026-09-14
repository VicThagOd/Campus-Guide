-- RPC function to check username availability bypassing RLS for signups
CREATE OR REPLACE FUNCTION public.check_username_available(req_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF req_username IS NULL OR TRIM(req_username) = '' THEN
    RETURN false;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(TRIM(req_username))
  );
END;
$$;

-- Grant execution to all roles
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated, service_role;

-- Ensure profiles table allows anon SELECT for username checks if queried directly
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_public_check_username' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_public_check_username ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;
