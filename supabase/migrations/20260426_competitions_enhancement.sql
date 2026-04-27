-- ─── COMPETITION ENHANCEMENTS ───

-- Add creator_id to competitions
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create OTPs table for verification
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    purpose TEXT NOT NULL, -- e.g., 'create_competition'
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add certificate tracking
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES competition_submissions(id) ON DELETE CASCADE,
    certificate_url TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add 'unseen' win flag to submissions for animation
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS win_animation_seen BOOLEAN DEFAULT FALSE;

-- Ensure RLS policies for new tables
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own OTPs" ON otps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can only see their own certificates" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Creators can see certificates they issued" ON certificates FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM competitions c 
        WHERE c.id = certificates.competition_id AND c.creator_id = auth.uid()
    )
);

-- Update RLS for competitions to allow users to create them
CREATE POLICY "Users can create competitions" ON competitions FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their own competitions" ON competitions FOR UPDATE USING (auth.uid() = creator_id);

-- ─── RPC FUNCTIONS ───

-- Increment submission count
CREATE OR REPLACE FUNCTION increment_competition_submissions(comp_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE competitions
    SET submission_count = submission_count + 1
    WHERE id = comp_id;
END;
$$ LANGUAGE plpgsql;

-- Update average rating for a submission
CREATE OR REPLACE FUNCTION update_submission_avg_rating(sub_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE competition_submissions
    SET 
        avg_rating = (SELECT AVG(rating) FROM submission_ratings WHERE submission_id = sub_id),
        rating_count = (SELECT COUNT(*) FROM submission_ratings WHERE submission_id = sub_id)
    WHERE id = sub_id;
END;
$$ LANGUAGE plpgsql;

