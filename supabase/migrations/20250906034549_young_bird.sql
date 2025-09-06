/*
  # Create all MediaVault database tables

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `access_key` (text, hashed password)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `media_id` (text)
      - `media_data` (jsonb)
      - `created_at` (timestamp)
    - `user_favorite_subreddits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `subreddit` (text)
      - `created_at` (timestamp)
    - `user_folders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `color` (text)
      - `custom_thumbnail` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_folder_media`
      - `id` (uuid, primary key)
      - `folder_id` (uuid, foreign key)
      - `media_id` (text)
      - `media_data` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Functions
    - `update_updated_at_column()` trigger function for timestamps
    - `hash_access_key()` function for password hashing
*/

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to hash access keys (passwords)
CREATE OR REPLACE FUNCTION hash_access_key(access_key text)
RETURNS text AS $$
BEGIN
    RETURN encode(digest(access_key || 'mediavault_salt', 'sha256'), 'hex');
END;
$$ language 'plpgsql';

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username text UNIQUE NOT NULL,
    access_key text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    media_id text NOT NULL,
    media_data jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, media_id)
);

-- Create user_favorite_subreddits table
CREATE TABLE IF NOT EXISTS user_favorite_subreddits (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subreddit text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, subreddit)
);

-- Create user_folders table
CREATE TABLE IF NOT EXISTS user_folders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text NOT NULL DEFAULT 'bg-pink-500',
    custom_thumbnail text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create user_folder_media table
CREATE TABLE IF NOT EXISTS user_folder_media (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id uuid NOT NULL REFERENCES user_folders(id) ON DELETE CASCADE,
    media_id text NOT NULL,
    media_data jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(folder_id, media_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_subreddits_user_id ON user_favorite_subreddits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_folders_user_id ON user_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_folder_media_folder_id ON user_folder_media(folder_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_folder_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Anyone can create profile" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for user_favorites
CREATE POLICY "Users can manage own favorites" ON user_favorites
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Create RLS policies for user_favorite_subreddits
CREATE POLICY "Users can manage own favorite subreddits" ON user_favorite_subreddits
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Create RLS policies for user_folders
CREATE POLICY "Users can manage own folders" ON user_folders
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Create RLS policies for user_folder_media
CREATE POLICY "Users can manage own folder media" ON user_folder_media
    FOR ALL USING (folder_id IN (
        SELECT id FROM user_folders WHERE user_id = current_setting('app.current_user_id')::uuid
    ));

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_folders_updated_at
    BEFORE UPDATE ON user_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to hash access_key on insert/update
CREATE OR REPLACE FUNCTION hash_user_access_key()
RETURNS TRIGGER AS $$
BEGIN
    -- Only hash if access_key is being changed and is not already hashed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.access_key != OLD.access_key) THEN
        -- Check if it's already hashed (64 character hex string)
        IF length(NEW.access_key) != 64 OR NEW.access_key !~ '^[a-f0-9]+$' THEN
            NEW.access_key = hash_access_key(NEW.access_key);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER hash_access_key_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION hash_user_access_key();