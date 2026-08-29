-- Updates, important dates, and ask-questions tables for the Campus Guide ecosystem.
-- Content is managed from the admin repo; the student app reads it (and inserts questions).

CREATE TABLE IF NOT EXISTS updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT,
    category TEXT DEFAULT 'general',
    audience TEXT DEFAULT 'everyone',
    source TEXT,
    deadline TIMESTAMPTZ,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS important_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    event_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ask_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    category TEXT DEFAULT 'general',
    question TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    answer TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accommodations gain media URLs (photos/videos are managed from the admin repo)
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ask_questions ENABLE ROW LEVEL SECURITY;

-- Public read access for updates and dates (the app gates routes by auth)
CREATE POLICY updates_public_select ON updates
    FOR SELECT USING (true);

CREATE POLICY important_dates_public_select ON important_dates
    FOR SELECT USING (true);

-- Logged-in users may ask questions; only their own questions are visible to them
CREATE POLICY ask_questions_auth_insert ON ask_questions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY ask_questions_own_select ON ask_questions
    FOR SELECT USING (auth.uid() = user_id);
