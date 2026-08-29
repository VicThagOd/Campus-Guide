-- Accommodations, events and newsletter tables for the student-facing app.
-- The separate admin repo writes to accommodations and events; this repo only reads.

CREATE TABLE IF NOT EXISTS accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    location TEXT,
    distance_from_school TEXT,
    room_type TEXT,
    amenities TEXT[],
    contact_info TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ,
    location TEXT,
    ticket_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for listings (admin repo manages writes with its own access)
CREATE POLICY accommodations_public_select ON accommodations
    FOR SELECT USING (true);

CREATE POLICY events_public_select ON events
    FOR SELECT USING (true);

-- Public signups may subscribe to the newsletter
CREATE POLICY newsletter_public_insert ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);