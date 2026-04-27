-- Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'text',
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies (drop first if they exist to avoid errors)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
