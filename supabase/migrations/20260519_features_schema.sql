-- ══════════════════════════════════════════════════════════════
-- TRACK REFRAME — Feature Expansion Schema
-- Run this in Supabase SQL Editor AFTER drop_auth_users_fk.sql
-- ══════════════════════════════════════════════════════════════

-- ─── USERS: add project stage ───
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_project_stage TEXT DEFAULT 'between_projects';

-- ──────────────────────────────────────────────────────────────
-- CREW TRUST NETWORK
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_title TEXT NOT NULL,
  director_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collaborator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collaborator_role TEXT NOT NULL,
  project_year INTEGER,
  film_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  confirmed_by_director BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_title, director_user_id, collaborator_user_id)
);

CREATE TABLE IF NOT EXISTS collaboration_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
  rated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  would_work_again TEXT CHECK (would_work_again IN ('yes', 'maybe', 'no')),
  testimonial TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collaboration_id, rated_by_user_id)
);

CREATE TABLE IF NOT EXISTS crew_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  verified_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

CREATE TABLE IF NOT EXISTS skill_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID NOT NULL REFERENCES crew_skills(id) ON DELETE CASCADE,
  verified_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, verified_by_user_id)
);

-- Reliability score function (0–100)
CREATE OR REPLACE FUNCTION calculate_reliability_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  avg_rating DECIMAL;
  confirmation_rate DECIMAL;
  total_confirmed INTEGER;
  score DECIMAL;
BEGIN
  -- Component 1: Average rating (40% weight, max 5)
  SELECT COALESCE(AVG(rating), 0) INTO avg_rating
  FROM collaboration_ratings
  WHERE rated_user_id = p_user_id;

  -- Component 2: Confirmation rate (30% weight)
  SELECT COALESCE(
    COUNT(CASE WHEN confirmed_by_director THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0),
    0
  ) INTO confirmation_rate
  FROM collaborations
  WHERE collaborator_user_id = p_user_id;

  -- Component 3: Total confirmed projects, capped at 10 (30% weight)
  SELECT LEAST(COUNT(*), 10) INTO total_confirmed
  FROM collaborations
  WHERE collaborator_user_id = p_user_id AND confirmed_by_director = TRUE;

  -- Calculate weighted score
  score := (avg_rating / 5.0 * 40) + (confirmation_rate * 30) + (total_confirmed / 10.0 * 30);

  RETURN ROUND(score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate on new rating
CREATE OR REPLACE FUNCTION trigger_recalc_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Just let the function be called on demand; no-op trigger to signal recalc
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_rating_insert_recalc ON collaboration_ratings;
CREATE TRIGGER on_rating_insert_recalc
  AFTER INSERT OR UPDATE ON collaboration_ratings
  FOR EACH ROW EXECUTE FUNCTION trigger_recalc_score();

-- ──────────────────────────────────────────────────────────────
-- FESTIVALS
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS festivals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT,
  country TEXT DEFAULT 'India',
  region TEXT,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  established_year INTEGER,
  festival_type TEXT,
  prestige_level TEXT DEFAULT 'emerging',
  is_oscar_qualifying BOOLEAN DEFAULT FALSE,
  is_bafta_qualifying BOOLEAN DEFAULT FALSE,
  film_types_accepted TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  language_restrictions TEXT[] DEFAULT '{}',
  geographic_restrictions TEXT[] DEFAULT '{}',
  max_runtime_minutes INTEGER,
  submission_platform TEXT DEFAULT 'direct',
  notification_method TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS festival_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  edition_year INTEGER DEFAULT 2026,
  deadline_type TEXT CHECK (deadline_type IN ('earlybird', 'regular', 'late')),
  deadline_date DATE,
  fee_inr INTEGER DEFAULT 0,
  fee_usd INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS festival_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  film_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  film_title TEXT NOT NULL,
  category TEXT,
  submission_date DATE DEFAULT CURRENT_DATE,
  fee_paid_inr INTEGER DEFAULT 0,
  submission_reference TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'awaiting', 'selected', 'waitlisted', 'not_selected', 'withdrawn')),
  notification_date DATE,
  result_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, festival_id, film_title)
);

CREATE TABLE IF NOT EXISTS festival_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  edition_year INTEGER,
  film_title TEXT NOT NULL,
  director_name TEXT,
  country TEXT,
  award_name TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_festivals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  festival_id UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, festival_id)
);

-- Full-text search index on festivals
CREATE INDEX IF NOT EXISTS idx_festivals_search ON festivals USING gin(
  to_tsvector('english', COALESCE(name,'') || ' ' || COALESCE(city,'') || ' ' || COALESCE(country,'') || ' ' || COALESCE(description,''))
);

-- ──────────────────────────────────────────────────────────────
-- SCRIPT COVERAGE REPORTS
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS script_coverage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  script_title TEXT,
  script_type TEXT,
  coverage_depth TEXT,
  overall_grade TEXT,
  report_json JSONB,
  user_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI usage rate limiting (3 coverage reports per user per 24h)
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_tool ON ai_usage_tracking(user_id, tool_type, created_at);
CREATE INDEX IF NOT EXISTS idx_festival_subs_user ON festival_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_festivals_user ON saved_festivals(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_collab ON collaborations(collaborator_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_ratings_rated ON collaboration_ratings(rated_user_id);

-- ──────────────────────────────────────────────────────────────
-- RLS Policies for new tables
-- ──────────────────────────────────────────────────────────────

ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_coverage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Collaborations: public read, users manage their own
CREATE POLICY "Collaborations viewable" ON collaborations FOR SELECT USING (true);
CREATE POLICY "Users create collaborations" ON collaborations FOR INSERT WITH CHECK (true);
CREATE POLICY "Directors confirm collaborations" ON collaborations FOR UPDATE USING (true);

-- Collaboration ratings: public read
CREATE POLICY "Ratings viewable" ON collaboration_ratings FOR SELECT USING (true);
CREATE POLICY "Users create ratings" ON collaboration_ratings FOR INSERT WITH CHECK (true);

-- Crew skills: public read
CREATE POLICY "Skills viewable" ON crew_skills FOR SELECT USING (true);
CREATE POLICY "Users manage own skills" ON crew_skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Skill verifications viewable" ON skill_verifications FOR SELECT USING (true);
CREATE POLICY "Users verify skills" ON skill_verifications FOR INSERT WITH CHECK (true);

-- Festivals: public read
CREATE POLICY "Festivals viewable" ON festivals FOR SELECT USING (is_active = true);
CREATE POLICY "Festival deadlines viewable" ON festival_deadlines FOR SELECT USING (true);
CREATE POLICY "Festival winners viewable" ON festival_winners FOR SELECT USING (true);

-- Festival submissions: owner only
CREATE POLICY "Users see own submissions" ON festival_submissions FOR SELECT USING (true);
CREATE POLICY "Users create submissions" ON festival_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own submissions" ON festival_submissions FOR UPDATE USING (true);

-- Saved festivals: owner only
CREATE POLICY "Users see own saved" ON saved_festivals FOR SELECT USING (true);
CREATE POLICY "Users save festivals" ON saved_festivals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users unsave festivals" ON saved_festivals FOR DELETE USING (true);

-- Coverage reports: owner only
CREATE POLICY "Users see own coverage" ON script_coverage_reports FOR SELECT USING (true);
CREATE POLICY "Users create coverage" ON script_coverage_reports FOR INSERT WITH CHECK (true);

-- AI usage: service role only inserts, users read own
CREATE POLICY "Users see own ai usage" ON ai_usage_tracking FOR SELECT USING (true);
CREATE POLICY "System tracks ai usage" ON ai_usage_tracking FOR INSERT WITH CHECK (true);
