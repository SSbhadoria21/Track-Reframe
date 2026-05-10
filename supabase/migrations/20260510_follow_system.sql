-- ==========================================
-- Track Reframe - Follow System Triggers
-- ==========================================

-- Function to update follower and following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following_count for the follower
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    -- Increment follower_count for the user being followed
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following_count for the follower
    UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    -- Decrement follower_count for the user being unfollowed
    UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist to prevent duplicates
DROP TRIGGER IF EXISTS on_follow_insert ON follows;
DROP TRIGGER IF EXISTS on_follow_delete ON follows;

-- Create triggers
CREATE TRIGGER on_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

CREATE TRIGGER on_follow_delete
AFTER DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Recalculate all counts (in case there is existing data)
UPDATE users
SET 
  follower_count = (SELECT COUNT(*) FROM follows WHERE following_id = users.id),
  following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = users.id);
