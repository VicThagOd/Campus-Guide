-- Migration: Ticketing, Inspection Fees, and Role Routing
-- Date: 2026-08-25

-- 1. Events table updates
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_price NUMERIC DEFAULT 0;

-- 2. Event Tickets table
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events (id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  tier_name TEXT DEFAULT 'Regular',
  tier_price NUMERIC DEFAULT 0,
  ticket_code TEXT UNIQUE NOT NULL,
  payment_reference TEXT UNIQUE,
  whatsapp_number TEXT NOT NULL,
  purchaser_name TEXT,
  purchaser_email TEXT,
  checked_in BOOLEAN DEFAULT false,
  receipt_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Accommodation Inspection Payments table
CREATE TABLE IF NOT EXISTS public.inspection_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES public.accommodations (id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 5000.00,
  payment_reference TEXT UNIQUE,
  whatsapp_number TEXT NOT NULL,
  status TEXT DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Profiles role splitting
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'aspirant';

-- 5. Trigger to copy user_type from auth metadata to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, course, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'course', 'Post UTME Candidate'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'aspirant')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    course = EXCLUDED.course,
    user_type = EXCLUDED.user_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security

-- Events: allow everyone to read, service role to manage
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view events' AND tablename = 'events') THEN
    CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage events' AND tablename = 'events') THEN
    CREATE POLICY "Service role can manage events" ON public.events FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Event tiers: allow everyone to read, service role to manage
ALTER TABLE public.event_tiers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view event tiers' AND tablename = 'event_tiers') THEN
    CREATE POLICY "Anyone can view event tiers" ON public.event_tiers FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage event tiers' AND tablename = 'event_tiers') THEN
    CREATE POLICY "Service role can manage event tiers" ON public.event_tiers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Event tickets: users can view/insert own, service role can manage all
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tickets' AND tablename = 'event_tickets') THEN
    CREATE POLICY "Users can view own tickets" ON public.event_tickets FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own tickets' AND tablename = 'event_tickets') THEN
    CREATE POLICY "Users can insert own tickets" ON public.event_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage tickets' AND tablename = 'event_tickets') THEN
    CREATE POLICY "Service role can manage tickets" ON public.event_tickets FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Inspection payments: users can view/insert own, service role to manage all
ALTER TABLE public.inspection_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own inspection payments' AND tablename = 'inspection_payments') THEN
    CREATE POLICY "Users can view own inspection payments" ON public.inspection_payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own inspection payments' AND tablename = 'inspection_payments') THEN
    CREATE POLICY "Users can insert own inspection payments" ON public.inspection_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage inspection payments' AND tablename = 'inspection_payments') THEN
    CREATE POLICY "Service role can manage inspection payments" ON public.inspection_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
