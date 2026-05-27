-- Migration: Create Call Sheet Generator Tables

-- 1. call_sheets
CREATE TABLE IF NOT EXISTS public.call_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  director_name TEXT,
  producer_name TEXT,
  production_company TEXT,
  logo_url TEXT,
  shoot_date DATE NOT NULL,
  shoot_day_number INTEGER,
  total_shoot_days INTEGER,
  call_sheet_number INTEGER,
  revision_number INTEGER DEFAULT 1,
  general_call_time TEXT,
  shoot_start_time TEXT,
  estimated_wrap_time TEXT,
  status TEXT DEFAULT 'draft',
  share_token TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. call_sheet_locations
CREATE TABLE IF NOT EXISTS public.call_sheet_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  address TEXT,
  location_type TEXT,
  maps_link TEXT,
  landmark TEXT,
  parking_notes TEXT
);

-- 3. call_sheet_scenes
CREATE TABLE IF NOT EXISTS public.call_sheet_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  scene_number TEXT,
  description TEXT,
  location TEXT,
  int_ext TEXT,
  day_night TEXT,
  start_time TEXT,
  end_time TEXT,
  pages TEXT,
  special_requirements TEXT,
  scene_order INTEGER
);

-- 4. call_sheet_actors
CREATE TABLE IF NOT EXISTS public.call_sheet_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  actor_name TEXT,
  character_name TEXT,
  actor_type TEXT,
  reporting_time TEXT,
  makeup_call_time TEXT,
  on_set_time TEXT,
  scenes_in TEXT[], -- Array of strings (scene numbers)
  contact_number TEXT,
  notes TEXT
);

-- 5. call_sheet_crew
CREATE TABLE IF NOT EXISTS public.call_sheet_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  department TEXT,
  name TEXT,
  role_title TEXT,
  contact_number TEXT,
  reporting_time TEXT,
  notes TEXT
);

-- 6. call_sheet_sections (JSONB for miscellaneous flexible sections)
CREATE TABLE IF NOT EXISTS public.call_sheet_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id UUID REFERENCES public.call_sheets(id) ON DELETE CASCADE,
  section_type TEXT,
  content JSONB,
  section_order INTEGER,
  UNIQUE(call_sheet_id, section_type)
);

-- Enable RLS
ALTER TABLE public.call_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sheet_sections ENABLE ROW LEVEL SECURITY;

-- Note: In Track Reframe, API routes use supabaseAdmin (service role key) 
-- which bypasses RLS, so complex RLS policies are optional but good practice.

CREATE POLICY "Users can manage their own call sheets"
    ON public.call_sheets FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage locations of their call sheets"
    ON public.call_sheet_locations FOR ALL
    USING (EXISTS (SELECT 1 FROM public.call_sheets WHERE id = call_sheet_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage scenes of their call sheets"
    ON public.call_sheet_scenes FOR ALL
    USING (EXISTS (SELECT 1 FROM public.call_sheets WHERE id = call_sheet_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage actors of their call sheets"
    ON public.call_sheet_actors FOR ALL
    USING (EXISTS (SELECT 1 FROM public.call_sheets WHERE id = call_sheet_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage crew of their call sheets"
    ON public.call_sheet_crew FOR ALL
    USING (EXISTS (SELECT 1 FROM public.call_sheets WHERE id = call_sheet_id AND user_id = auth.uid()));

CREATE POLICY "Users can manage sections of their call sheets"
    ON public.call_sheet_sections FOR ALL
    USING (EXISTS (SELECT 1 FROM public.call_sheets WHERE id = call_sheet_id AND user_id = auth.uid()));
