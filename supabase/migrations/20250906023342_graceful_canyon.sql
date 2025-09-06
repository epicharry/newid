/*
  # Create user data tables for MediaVault

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `media_id` (text)
      - `media_data` (jsonb)
      - `created_at` (timestamp)
    - `user_favorite_subreddits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `subreddit` (text)
      - `created_at` (timestamp)
    - `user_folders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `name` (text)
      - `color` (text)
      - `custom_thumbnail` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_folder_media`
      - `id` (uuid, primary key)
      - `folder_id` (uuid, references user_folders)
      - `media_id` (text)
      - `media_data` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  media_id text NOT NULL,
  media_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, media_id)
);

-- Create user favorite subreddits table
CREATE TABLE IF NOT EXISTS user_favorite_subreddits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  subreddit text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subreddit)
);

-- Create user folders table
CREATE TABLE IF NOT EXISTS user_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'bg-pink-500',
  custom_thumbnail text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user folder media table
CREATE TABLE IF NOT EXISTS user_folder_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES user_folders(id) ON DELETE CASCADE NOT NULL,
  media_id text NOT NULL,
  media_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(folder_id, media_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_folder_media ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for user_favorites
CREATE POLICY "Users can manage own favorites"
  ON user_favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for user_favorite_subreddits
CREATE POLICY "Users can manage own favorite subreddits"
  ON user_favorite_subreddits
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for user_folders
CREATE POLICY "Users can manage own folders"
  ON user_folders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for user_folder_media
CREATE POLICY "Users can manage own folder media"
  ON user_folder_media
  FOR ALL
  TO authenticated
  USING (
    folder_id IN (
      SELECT id FROM user_folders WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_subreddits_user_id ON user_favorite_subreddits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_folders_user_id ON user_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_folder_media_folder_id ON user_folder_media(folder_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_folders_updated_at
  BEFORE UPDATE ON user_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();