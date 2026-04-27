-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) VALUES ('films', 'films', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Setup Policies for 'profiles' bucket
DROP POLICY IF EXISTS "Public Access Profiles" ON storage.objects;
CREATE POLICY "Public Access Profiles" ON storage.objects FOR SELECT USING ( bucket_id = 'profiles' );

DROP POLICY IF EXISTS "Auth Insert Profiles" ON storage.objects;
CREATE POLICY "Auth Insert Profiles" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update Profiles" ON storage.objects;
CREATE POLICY "Auth Update Profiles" ON storage.objects FOR UPDATE USING ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );

-- 3. Setup Policies for 'films' bucket
DROP POLICY IF EXISTS "Public Access Films" ON storage.objects;
CREATE POLICY "Public Access Films" ON storage.objects FOR SELECT USING ( bucket_id = 'films' );

DROP POLICY IF EXISTS "Auth Insert Films" ON storage.objects;
CREATE POLICY "Auth Insert Films" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'films' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update Films" ON storage.objects;
CREATE POLICY "Auth Update Films" ON storage.objects FOR UPDATE USING ( bucket_id = 'films' AND auth.role() = 'authenticated' );

-- 4. Create films table if it doesn't exist (from schema.sql)
CREATE TABLE IF NOT EXISTS public.films (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  release_year INTEGER
);

-- 5. Add release_year to films table if it already exists but doesn't have the column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'films' AND column_name = 'release_year') THEN 
        ALTER TABLE public.films ADD COLUMN release_year INTEGER;
    END IF; 
END $$;

-- 6. Add missing profile columns to users table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN 
        ALTER TABLE public.users ADD COLUMN city TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN 
        ALTER TABLE public.users ADD COLUMN country TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'portfolio_url') THEN 
        ALTER TABLE public.users ADD COLUMN portfolio_url TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cover_url') THEN 
        ALTER TABLE public.users ADD COLUMN cover_url TEXT;
    END IF; 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'roles') THEN 
        ALTER TABLE public.users ADD COLUMN roles TEXT[] DEFAULT '{}';
    END IF; 
END $$;
