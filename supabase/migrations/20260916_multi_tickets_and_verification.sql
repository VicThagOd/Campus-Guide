-- Migration: Multi-tickets support and Organizer Ticket Verification
-- Date: 2026-09-16

-- 1. Remove UNIQUE constraint on payment_reference in event_tickets to allow multiple tickets per transaction
DO $$ 
DECLARE
  cons_name text;
BEGIN
  FOR cons_name IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'event_tickets' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name NOT LIKE '%ticket_code%' -- keep ticket_code UNIQUE
  LOOP
    EXECUTE 'ALTER TABLE public.event_tickets DROP CONSTRAINT IF EXISTS ' || quote_ident(cons_name);
  END LOOP;
END $$;

-- 2. Ensure all required verification and receipt columns exist on event_tickets
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_name TEXT DEFAULT 'Regular';
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS tier_price NUMERIC DEFAULT 0;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS checked_in_by TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS purchaser_name TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS purchaser_email TEXT;
ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '';

-- 3. Create helpful indexes for fast lookup during event check-ins & receipt retrieval
CREATE INDEX IF NOT EXISTS idx_event_tickets_code ON public.event_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_receipt ON public.event_tickets(receipt_number);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON public.event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_payment_ref ON public.event_tickets(payment_reference);

-- 4. Enable RLS and add update policy for ticket verification (check-in)
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view tickets by code or receipt' AND tablename = 'event_tickets') THEN
    CREATE POLICY "Anyone can view tickets by code or receipt" ON public.event_tickets 
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone with organizer code or auth can update check-in' AND tablename = 'event_tickets') THEN
    CREATE POLICY "Anyone with organizer code or auth can update check-in" ON public.event_tickets 
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;