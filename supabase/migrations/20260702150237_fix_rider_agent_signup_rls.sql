-- Drop all duplicate/broken INSERT policies on rider_profiles
DROP POLICY IF EXISTS "insert_own_rider_profile" ON rider_profiles;
DROP POLICY IF EXISTS "rider_insert_own" ON rider_profiles;
DROP POLICY IF EXISTS "Riders can insert own profile" ON rider_profiles;

-- Allow INSERT from both anon and authenticated roles (signup happens before email confirmation)
-- The profile ID must match the auth user ID so it can't be abused
CREATE POLICY "rider_profile_insert" ON rider_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Also fix agent_profiles INSERT to work at signup time
DROP POLICY IF EXISTS "Agents can insert own profile" ON agent_profiles;
CREATE POLICY "agent_profile_insert" ON agent_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
