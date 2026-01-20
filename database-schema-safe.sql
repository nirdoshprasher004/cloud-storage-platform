-- Cloud Storage Platform Database Schema (Safe Version)
-- PostgreSQL with Supabase - Handles existing tables gracefully

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users) - Create only if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table (hierarchical structure)
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'folders_no_self_parent') THEN
        ALTER TABLE folders ADD CONSTRAINT folders_no_self_parent CHECK (id != parent_id);
    END IF;
END $$;

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
    storage_key TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    version_id UUID, -- Will reference file_versions.id
    checksum TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File versions table (for version history)
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_key TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for file versions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'file_versions_unique_version') THEN
        ALTER TABLE file_versions ADD CONSTRAINT file_versions_unique_version UNIQUE (file_id, version_number);
    END IF;
END $$;

-- Add foreign key constraint for files.version_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'files_version_id_fkey') THEN
        ALTER TABLE files ADD CONSTRAINT files_version_id_fkey 
            FOREIGN KEY (version_id) REFERENCES file_versions(id);
    END IF;
END $$;

-- User-to-user shares table
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,
    grantee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for shares if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shares_unique_resource_user') THEN
        ALTER TABLE shares ADD CONSTRAINT shares_unique_resource_user UNIQUE (resource_type, resource_id, grantee_user_id);
    END IF;
END $$;

-- Public link shares table
CREATE TABLE IF NOT EXISTS link_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer')),
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stars/favorites table
CREATE TABLE IF NOT EXISTS stars (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, resource_type, resource_id)
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('upload', 'rename', 'delete', 'restore', 'move', 'share', 'download', 'create_folder')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_folders_owner_id ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);
CREATE INDEX IF NOT EXISTS idx_folders_is_deleted ON folders(is_deleted);

CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);
CREATE INDEX IF NOT EXISTS idx_files_is_deleted ON files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_files_name_fts ON files USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_folders_name_fts ON folders USING gin(to_tsvector('simple', name));

-- Trigram indexes for fuzzy search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_files_name_trgm ON files USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_folders_name_trgm ON folders USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_shares_resource ON shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_grantee ON shares(grantee_user_id);

CREATE INDEX IF NOT EXISTS idx_link_shares_token ON link_shares(token);
CREATE INDEX IF NOT EXISTS idx_link_shares_resource ON link_shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_link_shares_expires_at ON link_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_activities_actor_id ON activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_resource ON activities(resource_type, resource_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
DROP POLICY IF EXISTS "Users can create folders" ON folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Folders policies
CREATE POLICY "Users can view their own folders" ON folders
    FOR SELECT USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM shares 
            WHERE resource_type = 'folder' 
            AND resource_id = folders.id 
            AND grantee_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create folders" ON folders
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own folders" ON folders
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own folders" ON folders
    FOR DELETE USING (auth.uid() = owner_id);

-- Files policies
DROP POLICY IF EXISTS "Users can view their own files or shared files" ON files;
DROP POLICY IF EXISTS "Users can create files" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;

CREATE POLICY "Users can view their own files or shared files" ON files
    FOR SELECT USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM shares 
            WHERE resource_type = 'file' 
            AND resource_id = files.id 
            AND grantee_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM shares 
            WHERE resource_type = 'folder' 
            AND resource_id = files.folder_id 
            AND grantee_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create files" ON files
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own files" ON files
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own files" ON files
    FOR DELETE USING (auth.uid() = owner_id);

-- File versions policies
DROP POLICY IF EXISTS "Users can view file versions they have access to" ON file_versions;

CREATE POLICY "Users can view file versions they have access to" ON file_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM files 
            WHERE files.id = file_versions.file_id 
            AND (
                auth.uid() = files.owner_id OR
                EXISTS (
                    SELECT 1 FROM shares 
                    WHERE resource_type = 'file' 
                    AND resource_id = files.id 
                    AND grantee_user_id = auth.uid()
                )
            )
        )
    );

-- Shares policies
DROP POLICY IF EXISTS "Users can view shares for their resources or shares granted to them" ON shares;
DROP POLICY IF EXISTS "Resource owners can create shares" ON shares;
DROP POLICY IF EXISTS "Resource owners can delete shares" ON shares;

CREATE POLICY "Users can view shares for their resources or shares granted to them" ON shares
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = grantee_user_id
    );

CREATE POLICY "Resource owners can create shares" ON shares
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Resource owners can delete shares" ON shares
    FOR DELETE USING (auth.uid() = created_by);

-- Link shares policies
DROP POLICY IF EXISTS "Users can view link shares for their resources" ON link_shares;
DROP POLICY IF EXISTS "Resource owners can create link shares" ON link_shares;
DROP POLICY IF EXISTS "Resource owners can delete link shares" ON link_shares;

CREATE POLICY "Users can view link shares for their resources" ON link_shares
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Resource owners can create link shares" ON link_shares
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Resource owners can delete link shares" ON link_shares
    FOR DELETE USING (auth.uid() = created_by);

-- Stars policies
DROP POLICY IF EXISTS "Users can manage their own stars" ON stars;
CREATE POLICY "Users can manage their own stars" ON stars
    FOR ALL USING (auth.uid() = user_id);

-- Activities policies
DROP POLICY IF EXISTS "Users can view activities for their resources" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;

CREATE POLICY "Users can view activities for their resources" ON activities
    FOR SELECT USING (
        auth.uid() = actor_id OR
        EXISTS (
            SELECT 1 FROM files 
            WHERE files.id = activities.resource_id 
            AND activities.resource_type = 'file'
            AND auth.uid() = files.owner_id
        ) OR
        EXISTS (
            SELECT 1 FROM folders 
            WHERE folders.id = activities.resource_id 
            AND activities.resource_type = 'folder'
            AND auth.uid() = folders.owner_id
        )
    );

CREATE POLICY "Users can create activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_folders_updated_at ON folders;
DROP TRIGGER IF EXISTS update_files_updated_at ON files;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent folder cycles
CREATE OR REPLACE FUNCTION check_folder_cycle()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new parent would create a cycle
    IF NEW.parent_id IS NOT NULL THEN
        WITH RECURSIVE folder_path AS (
            SELECT id, parent_id, 1 as depth
            FROM folders
            WHERE id = NEW.parent_id
            
            UNION ALL
            
            SELECT f.id, f.parent_id, fp.depth + 1
            FROM folders f
            INNER JOIN folder_path fp ON f.id = fp.parent_id
            WHERE fp.depth < 100 -- Prevent infinite recursion
        )
        SELECT 1 FROM folder_path WHERE id = NEW.id;
        
        IF FOUND THEN
            RAISE EXCEPTION 'Cannot move folder: would create a cycle';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_folder_cycle_trigger ON folders;

-- Create trigger to prevent folder cycles
CREATE TRIGGER check_folder_cycle_trigger
    BEFORE INSERT OR UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION check_folder_cycle();

-- Success message
SELECT 'Database schema setup completed successfully!' as message;