-- Admins need to read individual profiles (invoice generator, admin individuals page).
-- Matches the existing admin SELECT policy pattern on agent_profiles / business_profiles.

DROP POLICY IF EXISTS "Admin can view all individual profiles" ON individual_profiles;

CREATE POLICY "Admin can view all individual profiles" ON individual_profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid())
  );