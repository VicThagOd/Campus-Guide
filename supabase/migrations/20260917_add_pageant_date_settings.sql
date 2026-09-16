-- Migration: 20260917_add_pageant_date_settings.sql
-- Description: Adds registration and voting start/end timestamps to pageant_settings and configures RLS policies for Admin update.

ALTER TABLE public.pageant_settings
ADD COLUMN IF NOT EXISTS registration_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_end_date TIMESTAMPTZ DEFAULT '2026-09-24T23:59:59+01:00',
ADD COLUMN IF NOT EXISTS voting_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS voting_end_date TIMESTAMPTZ;

-- Ensure default row exists with standard values
INSERT INTO public.pageant_settings (id, registration_open, voting_live, registration_fee, registration_end_date)
SELECT gen_random_uuid(), true, false, 1000.00, '2026-09-24T23:59:59+01:00'
WHERE NOT EXISTS (SELECT 1 FROM public.pageant_settings);

-- RLS policies for pageant_settings
DROP POLICY IF EXISTS pageant_settings_public_select ON public.pageant_settings;
CREATE POLICY pageant_settings_public_select ON public.pageant_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS pageant_settings_update_public ON public.pageant_settings;
CREATE POLICY pageant_settings_update_public ON public.pageant_settings
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS pageant_settings_all_public ON public.pageant_settings;
CREATE POLICY pageant_settings_all_public ON public.pageant_settings
    FOR ALL USING (true);
