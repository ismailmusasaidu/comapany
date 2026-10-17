/*
# Add admin notification read state

## Purpose
Track, per admin, when they last read notifications so the bell can show an
accurate unread count.

## Changes

### New table: `admin_notification_state`
- `user_id` (uuid primary key) — the admin's auth user id
- `last_read_at` (timestamptz) — when the admin last opened the bell

### Security
- Row Level Security is ENABLED.
- An admin can only read or update their own row.
*/

CREATE TABLE IF NOT EXISTS admin_notification_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_notification_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_own_notification_state" ON admin_notification_state;
CREATE POLICY "admins_read_own_notification_state"
  ON admin_notification_state FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_insert_own_notification_state" ON admin_notification_state;
CREATE POLICY "admins_insert_own_notification_state"
  ON admin_notification_state FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_update_own_notification_state" ON admin_notification_state;
CREATE POLICY "admins_update_own_notification_state"
  ON admin_notification_state FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
