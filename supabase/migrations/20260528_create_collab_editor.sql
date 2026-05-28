-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    project_type TEXT NOT NULL,
    format TEXT DEFAULT 'Screenplay',
    language TEXT DEFAULT 'English',
    status TEXT DEFAULT 'Draft',
    page_count INTEGER DEFAULT 1,
    word_count INTEGER DEFAULT 0,
    scene_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,
    writing_time_seconds INTEGER DEFAULT 0,
    thinking_time_seconds INTEGER DEFAULT 0,
    current_revision_color TEXT DEFAULT 'Blue',
    is_locked BOOLEAN DEFAULT FALSE,
    share_token TEXT UNIQUE,
    share_permission TEXT DEFAULT 'view',
    share_token_expiry TIMESTAMP WITH TIME ZONE,
    folder_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script Content (Separate to avoid fetching massive bytea on lists)
CREATE TABLE IF NOT EXISTS script_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE UNIQUE,
    yjs_document BYTEA,
    plain_text TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script Folders
CREATE TABLE IF NOT EXISTS script_folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    parent_folder_id UUID REFERENCES script_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE scripts ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE scripts DROP CONSTRAINT IF EXISTS fk_folder;
ALTER TABLE scripts ADD CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES script_folders(id) ON DELETE SET NULL;

-- Script Collaborators
CREATE TABLE IF NOT EXISTS script_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT DEFAULT 'view', -- edit, comment, view
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    cursor_color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(script_id, user_id)
);

-- Script Invitations
CREATE TABLE IF NOT EXISTS script_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT DEFAULT 'view',
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Script Versions
CREATE TABLE IF NOT EXISTS script_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    version_name TEXT,
    version_number INTEGER,
    snapshot_text TEXT,
    snapshot_yjs BYTEA,
    page_count INTEGER,
    word_count INTEGER,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script Comments
CREATE TABLE IF NOT EXISTS script_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    anchor_from INTEGER,
    anchor_to INTEGER,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    parent_comment_id UUID REFERENCES script_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script Notes
CREATE TABLE IF NOT EXISTS script_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scene_number TEXT,
    content TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script Chat Messages
CREATE TABLE IF NOT EXISTS script_chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Writing Sessions
CREATE TABLE IF NOT EXISTS writing_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    words_written INTEGER DEFAULT 0,
    writing_seconds INTEGER DEFAULT 0,
    thinking_seconds INTEGER DEFAULT 0
);

-- Disable RLS for development
ALTER TABLE scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE script_content DISABLE ROW LEVEL SECURITY;
