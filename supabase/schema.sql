-- ═══════════════════════════════════════════════════
-- TRACK REFRAME — Full Database Schema
-- ═══════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───
CREATE TYPE user_verification_status AS ENUM ('none', 'applied', 'verified');
CREATE TYPE post_type AS ENUM ('text', 'film', 'script_teaser', 'reel', 'competition_entry');
CREATE TYPE script_tool AS ENUM ('continuity_ai', 'formatter', 'manual', 'collaborative');
CREATE TYPE ai_tool_type AS ENUM ('script_continuity', 'script_formatter', 'shot_planner', 'mood_board', 'budget_estimator', 'call_sheet', 'director_analyzer');
CREATE TYPE competition_status AS ENUM ('upcoming', 'round1_open', 'round1_closed', 'round2_review', 'winner_announced');
CREATE TYPE submission_status AS ENUM ('submitted', 'under_review', 'qualified', 'not_advanced', 'winner');
CREATE TYPE round_reached AS ENUM ('round1', 'round2', 'winner');
CREATE TYPE badge_rarity AS ENUM ('common', 'rare', 'legendary');
CREATE TYPE badge_type AS ENUM ('competition', 'achievement', 'milestone', 'verified');
CREATE TYPE community_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE message_type AS ENUM ('text', 'image', 'film_link', 'script_snippet');

-- ─── USERS ───
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  city TEXT,
  country TEXT,
  portfolio_url TEXT,
  social_twitter TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  roles TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status user_verification_status DEFAULT 'none',
  coins INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  films_count INTEGER DEFAULT 0,
  avg_rating_received DECIMAL DEFAULT 0,
  total_ratings_received INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  director_preferences TEXT[] DEFAULT '{}',
  genre_preferences TEXT[] DEFAULT '{}',
  taste_profile JSONB DEFAULT '{}',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FOLLOWS ───
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ─── POSTS ───
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type post_type DEFAULT 'text',
  content TEXT,
  film_link TEXT,
  film_title TEXT,
  thumbnail_url TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  director_name TEXT,
  runtime_seconds INTEGER,
  language TEXT,
  synopsis TEXT,
  like_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  avg_rating DECIMAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_competition_entry BOOLEAN DEFAULT FALSE,
  competition_id UUID,
  cineforge_tools_used TEXT[] DEFAULT '{}',
  cast_list TEXT[] DEFAULT '{}',
  crew_list JSONB DEFAULT '[]',
  media_url TEXT,
  media_type TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ─── SCRIPTS ───
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_text TEXT,
  formatted_text TEXT,
  word_count INTEGER DEFAULT 0,
  director_name TEXT,
  production_house TEXT,
  contact_email TEXT,
  draft_number INTEGER DEFAULT 1,
  tool_used script_tool DEFAULT 'manual',
  genre_tags TEXT[] DEFAULT '{}',
  collaborators UUID[] DEFAULT '{}',
  pdf_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  version_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AI SESSIONS ───
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_type ai_tool_type NOT NULL,
  session_title TEXT,
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  director_style TEXT,
  tone_tags TEXT[] DEFAULT '{}',
  length_choice TEXT,
  tokens_used INTEGER DEFAULT 0,
  output_word_count INTEGER DEFAULT 0,
  is_saved BOOLEAN DEFAULT FALSE,
  saved_script_id UUID REFERENCES scripts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FILMS ───
CREATE TABLE films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_link TEXT,
  thumbnail_url TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  runtime_seconds INTEGER,
  language TEXT,
  synopsis TEXT,
  director_name TEXT,
  cast_list TEXT[] DEFAULT '{}',
  crew_list JSONB DEFAULT '[]',
  cineforge_tools_used TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  avg_rating DECIMAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE film_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(film_id, user_id)
);

-- ─── COMMUNITIES ───
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT FALSE,
  invite_code TEXT UNIQUE,
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role community_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type message_type DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  og_data JSONB,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMPETITIONS ───
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  rarity badge_rarity DEFAULT 'common',
  type badge_type DEFAULT 'achievement',
  competition_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  rules TEXT,
  round1_start TIMESTAMPTZ,
  round1_end TIMESTAMPTZ,
  round2_start TIMESTAMPTZ,
  round2_end TIMESTAMPTZ,
  winner_announced_at TIMESTAMPTZ,
  status competition_status DEFAULT 'upcoming',
  prize_description TEXT,
  prize_badge_id UUID REFERENCES badges(id),
  prize_coins INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  winner_user_id UUID REFERENCES users(id),
  winner_submission_id UUID,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competition_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  film_id UUID REFERENCES films(id),
  post_id UUID REFERENCES posts(id),
  title TEXT NOT NULL,
  video_link TEXT,
  thumbnail_url TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  runtime_seconds INTEGER,
  language TEXT,
  synopsis TEXT,
  director_name TEXT,
  cast_list TEXT[] DEFAULT '{}',
  crew_list JSONB DEFAULT '[]',
  inspiration TEXT,
  cineforge_tools_used TEXT[] DEFAULT '{}',
  declaration_accepted BOOLEAN DEFAULT FALSE,
  avg_rating DECIMAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  round1_qualified BOOLEAN DEFAULT FALSE,
  round_reached round_reached DEFAULT 'round1',
  admin_score JSONB,
  admin_feedback TEXT,
  submission_status submission_status DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submission_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES competition_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id)
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  awarded_reason TEXT
);

-- ─── COINS ───
CREATE TABLE coins_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  related_user_id UUID REFERENCES users(id),
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CREW LISTINGS ───
CREATE TABLE crew_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  project_type TEXT,
  roles_needed TEXT[] DEFAULT '{}',
  description TEXT,
  experience_level TEXT,
  city TEXT,
  country TEXT,
  shoot_start_date DATE,
  shoot_end_date DATE,
  compensation_type TEXT,
  compensation_details TEXT,
  contact_method TEXT,
  contact_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  interest_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crew_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES crew_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

-- ─── MISC TABLES ───
CREATE TABLE mood_board_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  style_tags TEXT[] DEFAULT '{}',
  generated_images TEXT[] DEFAULT '{}',
  color_palette TEXT[] DEFAULT '{}',
  saved_to_project BOOLEAN DEFAULT FALSE,
  session_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bucket_list_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_slug TEXT NOT NULL,
  completed_items JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, list_slug)
);

CREATE TABLE director_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  nationality TEXT,
  flag_emoji TEXT,
  bio TEXT,
  signature_techniques TEXT[] DEFAULT '{}',
  preferred_shots TEXT[] DEFAULT '{}',
  color_palette_description TEXT,
  narrative_structure TEXT,
  known_films TEXT[] DEFAULT '{}',
  influenced_by TEXT[] DEFAULT '{}',
  influenced TEXT[] DEFAULT '{}',
  genre_tags TEXT[] DEFAULT '{}',
  system_prompt_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watch_together_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  video_url TEXT,
  video_title TEXT,
  started_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE TABLE film_dna_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  realism DECIMAL DEFAULT 5,
  visual_style DECIMAL DEFAULT 5,
  pacing DECIMAL DEFAULT 5,
  tonal_complexity DECIMAL DEFAULT 5,
  narrative_structure DECIMAL DEFAULT 5,
  emotional_intensity DECIMAL DEFAULT 5,
  last_recalibrated_at TIMESTAMPTZ,
  films_rated_count INTEGER DEFAULT 0
);

-- ─── INDEXES ───
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_films_user ON films(user_id);
CREATE INDEX idx_ai_sessions_user ON ai_sessions(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_messages_room ON messages(room_id, created_at DESC);
CREATE INDEX idx_competition_subs ON competition_submissions(competition_id);

-- ─── RLS POLICIES ───
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: public read, self write
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts: public read, owner write
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Follows: public read, self manage
CREATE POLICY "Follows are viewable" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Likes/Bookmarks: public read, self manage
CREATE POLICY "Likes viewable" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Bookmarks viewable by owner" ON post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark" ON post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unbookmark" ON post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, self write
CREATE POLICY "Comments viewable" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Scripts: owner read/write, public if is_public
CREATE POLICY "Public scripts viewable" ON scripts FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create scripts" ON scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scripts" ON scripts FOR UPDATE USING (auth.uid() = user_id);

-- AI Sessions: owner only
CREATE POLICY "Users see own sessions" ON ai_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create sessions" ON ai_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: owner only
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
