-- Migration to fix PostgREST relationships, create event_tickets and inspection_payments tables, and enable writes.

-- 1. Ensure columns exist on events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_price NUMERIC DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_name TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_code TEXT UNIQUE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- 2. Create event_tickets table referencing public.profiles (id)
CREATE TABLE IF NOT EXISTS public.event_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events (id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
    tier_name TEXT DEFAULT 'Regular',
    tier_price NUMERIC DEFAULT 0,
    ticket_code TEXT UNIQUE NOT NULL,
    payment_reference TEXT UNIQUE,
    whatsapp_number TEXT NOT NULL,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    checked_in_by TEXT,
    receipt_number TEXT,
    purchaser_name TEXT,
    purchaser_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Event ticket tiers for transparent sales and tiered pricing
CREATE TABLE IF NOT EXISTS public.event_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events (id) ON DELETE CASCADE,
    tier_name TEXT NOT NULL,
    tier_price NUMERIC NOT NULL DEFAULT 0,
    capacity INTEGER,
    perks TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create inspection_payments table referencing public.profiles (id)
CREATE TABLE IF NOT EXISTS public.inspection_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
    accommodation_id UUID REFERENCES public.accommodations (id) ON DELETE CASCADE,
    amount NUMERIC DEFAULT 5000.00,
    payment_reference TEXT UNIQUE,
    whatsapp_number TEXT NOT NULL,
    status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Recreate handle_new_user trigger function to copy user_type metadata directly from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, course, email, email_opt_in, user_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'name', new.email),
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'course', 'Post UTME Candidate'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'email_opt_in')::boolean, false),
    COALESCE(new.raw_user_meta_data->>'user_type', 'aspirant')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable Row Level Security and configure access
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_tickets_public_select ON public.event_tickets;
CREATE POLICY event_tickets_public_select ON public.event_tickets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS event_tickets_authenticated_all ON public.event_tickets;
CREATE POLICY event_tickets_authenticated_all ON public.event_tickets
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS event_tickets_public_insert ON public.event_tickets;
CREATE POLICY event_tickets_public_insert ON public.event_tickets
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS event_tiers_public_select ON public.event_tiers;
CREATE POLICY event_tiers_public_select ON public.event_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS event_tiers_authenticated_all ON public.event_tiers;
CREATE POLICY event_tiers_authenticated_all ON public.event_tiers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS inspection_payments_public_select ON public.inspection_payments;
CREATE POLICY inspection_payments_public_select ON public.inspection_payments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS inspection_payments_authenticated_all ON public.inspection_payments;
CREATE POLICY inspection_payments_authenticated_all ON public.inspection_payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS inspection_payments_public_insert ON public.inspection_payments;
CREATE POLICY inspection_payments_public_insert ON public.inspection_payments
    FOR INSERT WITH CHECK (true);

-- 7. Enable RLS and read access for processed_webhooks for ledger view
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS processed_webhooks_authenticated_select ON public.processed_webhooks;
CREATE POLICY processed_webhooks_authenticated_select ON public.processed_webhooks
    FOR SELECT TO authenticated USING (true);

-- 8. Add JSONB metadata column to pending_payments if not exists
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
