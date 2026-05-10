-- Add audience to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'public';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS script_content TEXT;

-- Create interaction tables
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post ON post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_post ON post_ratings(post_id);

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on re-run
DROP POLICY IF EXISTS "Likes viewable by everyone" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

DROP POLICY IF EXISTS "Reposts viewable by everyone" ON post_reposts;
DROP POLICY IF EXISTS "Users can repost" ON post_reposts;
DROP POLICY IF EXISTS "Users can delete own reposts" ON post_reposts;

DROP POLICY IF EXISTS "Comments viewable by everyone" ON post_comments;
DROP POLICY IF EXISTS "Users can comment" ON post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;

DROP POLICY IF EXISTS "Bookmarks viewable only by owner" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can bookmark posts" ON post_bookmarks;
DROP POLICY IF EXISTS "Users can remove own bookmarks" ON post_bookmarks;

DROP POLICY IF EXISTS "Ratings viewable by everyone" ON post_ratings;
DROP POLICY IF EXISTS "Users can rate posts" ON post_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON post_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON post_ratings;

-- Create Policies
-- post_likes
CREATE POLICY "Likes viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- post_reposts
CREATE POLICY "Reposts viewable by everyone" ON post_reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost" ON post_reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reposts" ON post_reposts FOR DELETE USING (auth.uid() = user_id);

-- post_comments
CREATE POLICY "Comments viewable by everyone" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- post_bookmarks
CREATE POLICY "Bookmarks viewable only by owner" ON post_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts" ON post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own bookmarks" ON post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- post_ratings
CREATE POLICY "Ratings viewable by everyone" ON post_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate posts" ON post_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON post_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON post_ratings FOR DELETE USING (auth.uid() = user_id);

-- Trigger functions to update counts on posts table
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_reposts' THEN
      UPDATE posts SET repost_count = repost_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_ratings' THEN
      UPDATE posts SET 
        rating_count = rating_count + 1,
        avg_rating = (SELECT AVG(rating) FROM post_ratings WHERE post_id = NEW.post_id)
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_likes' THEN
      UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_reposts' THEN
      UPDATE posts SET repost_count = GREATEST(repost_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_ratings' THEN
      UPDATE posts SET 
        rating_count = GREATEST(rating_count - 1, 0),
        avg_rating = COALESCE((SELECT AVG(rating) FROM post_ratings WHERE post_id = OLD.post_id), 0)
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'post_ratings' THEN
      UPDATE posts SET 
        avg_rating = (SELECT AVG(rating) FROM post_ratings WHERE post_id = NEW.post_id)
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS on_like_insert ON post_likes;
DROP TRIGGER IF EXISTS on_like_delete ON post_likes;
DROP TRIGGER IF EXISTS on_comment_insert ON post_comments;
DROP TRIGGER IF EXISTS on_comment_delete ON post_comments;
DROP TRIGGER IF EXISTS on_repost_insert ON post_reposts;
DROP TRIGGER IF EXISTS on_repost_delete ON post_reposts;
DROP TRIGGER IF EXISTS on_rating_insert ON post_ratings;
DROP TRIGGER IF EXISTS on_rating_update ON post_ratings;
DROP TRIGGER IF EXISTS on_rating_delete ON post_ratings;

-- Create triggers
CREATE TRIGGER on_like_insert AFTER INSERT ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER on_like_delete AFTER DELETE ON post_likes FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER on_comment_insert AFTER INSERT ON post_comments FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER on_comment_delete AFTER DELETE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER on_repost_insert AFTER INSERT ON post_reposts FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER on_repost_delete AFTER DELETE ON post_reposts FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER on_rating_insert AFTER INSERT ON post_ratings FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER on_rating_update AFTER UPDATE ON post_ratings FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE TRIGGER on_rating_delete AFTER DELETE ON post_ratings FOR EACH ROW EXECUTE FUNCTION update_post_counts();
