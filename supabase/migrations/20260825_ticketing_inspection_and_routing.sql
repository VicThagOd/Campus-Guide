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
  ticket_code TEXT UNIQUE NOT NULL,
  payment_reference TEXT UNIQUE,
  whatsapp_number TEXT NOT NULL,
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

-- 5. Row Level Security
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own tickets
CREATE POLICY "Users can view own tickets" ON public.event_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own tickets
CREATE POLICY "Users can insert own tickets" ON public.event_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to update tickets (for webhook verification)
CREATE POLICY "Service role can update tickets" ON public.event_tickets
  FOR UPDATE USING (true);

-- Allow authenticated users to read their own inspection payments
CREATE POLICY "Users can view own inspection payments" ON public.inspection_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own inspection payments
CREATE POLICY "Users can insert own inspection payments" ON public.inspection_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to update inspection payments (for webhook verification)
CREATE POLICY "Service role can update inspection payments" ON public.inspection_payments
  FOR UPDATE USING (true);
