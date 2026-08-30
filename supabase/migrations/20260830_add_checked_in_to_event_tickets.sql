-- Migration to ensure checked_in column exists in event_tickets table.
-- If the table was created previously without this column, this ensures it is added.

ALTER TABLE public.event_tickets ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
