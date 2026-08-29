-- Create fresher_stages table for freshers hub content management.
-- Content is managed from the admin repo; the student app reads it.

CREATE TABLE IF NOT EXISTS fresher_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    steps TEXT[] NOT NULL DEFAULT '{}',
    icon TEXT DEFAULT 'checkmark',
    stage_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fresher_stages ENABLE ROW LEVEL SECURITY;

-- Public read access for freshers hub stages
CREATE POLICY fresher_stages_public_select ON fresher_stages
    FOR SELECT USING (true);
