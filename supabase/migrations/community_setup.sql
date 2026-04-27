-- ─── COMMUNITY POLICIES ───

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_together_sessions ENABLE ROW LEVEL SECURITY;

-- Communities: public read for public rooms, member-only for private?
-- Actually, let's allow discovery of public rooms.
CREATE POLICY "Public communities are viewable by everyone" ON communities 
  FOR SELECT USING (is_private = false);

CREATE POLICY "Members can view private communities" ON communities 
  FOR SELECT USING (
    id IN (SELECT room_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create communities" ON communities 
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can update communities" ON communities 
  FOR UPDATE USING (
    id IN (SELECT room_id FROM community_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Community Members: authenticated users can see members (needed for group info)
CREATE POLICY "Community members are viewable by authenticated users" ON community_members 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join rooms" ON community_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update community member_count when joining
CREATE POLICY "Authenticated users can update member count" ON communities 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Messages: only members can see/send messages
CREATE POLICY "Members can view messages" ON messages 
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    room_id IN (SELECT room_id FROM community_members WHERE user_id = auth.uid())
  );

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE communities;
ALTER PUBLICATION supabase_realtime ADD TABLE community_members;
