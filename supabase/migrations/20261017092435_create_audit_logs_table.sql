/*
# Create audit_logs table for admin dashboard activity tracking

1. New Tables
- `audit_logs`
  - `id` (uuid, primary key, auto-generated)
  - `admin_user_id` (uuid, nullable) - the signed-in admin who performed the action
  - `admin_email` (text, nullable) - email captured for readability even if the admin is later removed
  - `action` (text, not null) - short machine name, e.g. "booking.status_change", "admin.login"
  - `category` (text, not null, default "general") - groups entries in the UI: bookings, logistics, payments, content, auth, general
  - `entity_type` (text, not null) - what kind of thing was acted on, e.g. "delivery_booking"
  - `entity_id` (text, nullable) - the row id acted on
  - `entity_label` (text, nullable) - human-readable reference, e.g. booking ref "DB97144687"
  - `details` (jsonb, nullable) - free-form details such as old/new status, fee amount
  - `created_at` (timestamptz, not null, default now())

2. Security
- Enable RLS on `audit_logs`.
- SELECT: only admins (rows in admin_users matching auth.uid()) may read the logs.
- INSERT: any authenticated user may insert (so admin actions performed under any
  authenticated session are recordable); rows are append-only audit entries and
  contain no sensitive data beyond admin email and action descriptions.
- No UPDATE/DELETE policies: logs are immutable once written.

3. Notes
- Indexes on created_at, category, and admin_user_id for the admin log page.
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid,
  admin_email text,
  action text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  entity_type text NOT NULL,
  entity_id text,
  entity_label text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON audit_logs (admin_user_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated can insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);