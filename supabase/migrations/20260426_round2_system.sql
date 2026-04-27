-- ─── ROUND 2 & PRIVATE JUDGING SYSTEM ───

-- Add status 'round2' to competitions
DO $$ BEGIN
    ALTER TYPE competition_status ADD VALUE 'round2';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update submissions table for Round 2
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS round2_status TEXT DEFAULT 'pending'; -- 'qualified', 'held', 'eliminated', 'winner'
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS marks_cinematography INTEGER DEFAULT 0;
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS marks_editing INTEGER DEFAULT 0;
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS marks_direction INTEGER DEFAULT 0;
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS marks_casting INTEGER DEFAULT 0;
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS marks_storytelling INTEGER DEFAULT 0;
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS marks_screenplay INTEGER DEFAULT 0;
ALTER TABLE competition_submissions ADD COLUMN IF NOT EXISTS jury_feedback TEXT;

-- Certificates Table Enhancement
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES competition_submissions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    metadata JSONB DEFAULT '{}'
);

-- RLS for Round 2 (Private)
ALTER TABLE competition_submissions ENABLE ROW LEVEL SECURITY;

-- Only creator can see marks/feedback until competition is finished
CREATE POLICY "Creators can manage round 2 data" ON competition_submissions 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM competitions c 
        WHERE c.id = competition_submissions.competition_id AND c.creator_id = auth.uid()
    )
);
