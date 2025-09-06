/*
  # Add access_key to user_profiles for custom authentication

  1. Changes
    - Add `access_key` column to store hashed passwords
    - Remove foreign key constraint to auth.users
    - Make id a regular UUID primary key instead of referencing auth users
    - Keep existing data structure for profiles

  2. Security
    - access_key will store hashed passwords (not plain text)
    - Enable RLS on user_profiles table
    - Add policies for user management
*/

-- Add access_key column to user_profiles
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS access_key text NOT NULL DEFAULT '';

-- Update the id column to be a regular UUID primary key
ALTER TABLE user_profiles 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Add policies for custom auth
CREATE POLICY "Allow user registration" ON user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = current_setting('app.current_user_id', true)::uuid);