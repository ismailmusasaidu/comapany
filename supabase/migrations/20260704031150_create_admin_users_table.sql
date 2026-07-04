/*
# Create admin_users table

## Purpose
Restricts admin dashboard access to explicitly designated admin accounts.
Previously, ANY authenticated Supabase user could log in to the admin dashboard
because the ProtectedRoute only checked `if (user)` with no role verification.

## Changes

### New Tables
- `admin_users`
  - `user_id` (uuid, PK, FK → auth.users) — the Supabase auth user that has admin access
  - `created_at` (timestamptz) — when this admin was granted access

### Security
- RLS enabled on `admin_users`
- SELECT policy: authenticated users may only read their own row (to check their own admin status)
- INSERT/UPDATE/DELETE: no policies → only service-role can modify (prevents self-promotion)

### Seeded Data
- Inserts the original admin account (ismailmusasaidu@gmail.com, id bf73ddda-7a45-48b5-8c0c-8e3b77b351ea)

## Important Notes
1. To grant admin access to a new user, run:
   INSERT INTO admin_users (user_id) VALUES ('<uuid>');
   using the Supabase SQL editor (service role only — no frontend code can do this).
2. Removing a row from admin_users immediately revokes that user's admin access.
3. This table does NOT store passwords — it only references existing auth.users rows.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow an authenticated user to check whether they themselves are an admin.
-- No INSERT/UPDATE/DELETE policies — only service role can manage admin grants.
DROP POLICY IF EXISTS "admin_users_select_own" ON admin_users;
CREATE POLICY "admin_users_select_own" ON admin_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Seed the original admin user
INSERT INTO admin_users (user_id)
VALUES ('bf73ddda-7a45-48b5-8c0c-8e3b77b351ea')
ON CONFLICT (user_id) DO NOTHING;
