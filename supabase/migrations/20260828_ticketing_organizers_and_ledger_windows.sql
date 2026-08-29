-- Organizer and ticketing cleanup migration.
-- Apply this if the earlier ticketing migration has already been pushed.

ALTER TABLE public.events DROP COLUMN IF EXISTS ticket_url;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_name TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_code TEXT UNIQUE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

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

ALTER TABLE public.event_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_tiers_public_select ON public.event_tiers;
CREATE POLICY event_tiers_public_select ON public.event_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS event_tiers_authenticated_all ON public.event_tiers;
CREATE POLICY event_tiers_authenticated_all ON public.event_tiers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_name TEXT DEFAULT 'Regular';
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_price NUMERIC DEFAULT 0;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS checked_in_by TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS purchaser_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS purchaser_email TEXT;
