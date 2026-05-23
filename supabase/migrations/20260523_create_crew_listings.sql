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

-- Note: Ensure these RLS policies exist if you want to restrict access, 
-- but since this is just adding missing schema tables, the below will match schema.sql:
-- (Uncomment if needed)
-- ALTER TABLE crew_listings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE crew_interests ENABLE ROW LEVEL SECURITY;
