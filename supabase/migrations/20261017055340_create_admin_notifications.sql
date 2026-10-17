/*
# Create admin notifications table

## Purpose
Store in-app notifications that appear in the admin dashboard's notification
bell whenever a new delivery booking or logistics request is created.

## Changes

### New table: `admin_notifications`
- `id` (uuid primary key, auto-generated)
- `kind` (text) — `delivery_booking`, `business_delivery_booking`,
  `logistics_request` or `business_logistics_request`
- `title` (text) — short, human-readable headline shown in the bell
- `body` (text) — optional detail line
- `link` (text) — where the admin is taken when clicking the item
- `source_id` (text) — the reference (e.g. booking/request ref) of the source row
- `created_at` (timestamptz, default now())

### Security
- Row Level Security is ENABLED.
- Only authenticated admin users (rows in `admin_users`) can read
  notifications. Unauthenticated users can never read or write them.
- Inserts are performed by SECURITY DEFINER trigger functions only.

### Triggers
Four AFTER INSERT triggers create a notification whenever a row lands in:
- `delivery_bookings`
- `business_delivery_bookings`
- `logistics_requests`
- `business_logistics_requests`

They are idempotent (DROP IF EXISTS then CREATE).
*/

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  source_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_can_read_notifications" ON admin_notifications;
CREATE POLICY "admins_can_read_notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- ── Trigger function ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_admin_new_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind  text;
  v_title text;
  v_body  text;
  v_link  text;
  v_ref   text;
BEGIN
  v_kind := TG_ARGV[0];

  IF v_kind = 'delivery_booking' THEN
    v_ref := COALESCE(NEW.booking_ref, '');
    v_title := 'New delivery booking';
    v_body := COALESCE(NULLIF(COALESCE(NEW.sender_name, '') || ' → ' || COALESCE(NEW.recipient_name, ''), ' → '), 'A new delivery was booked');
    v_link := '/admin/bookings';
  ELSIF v_kind = 'business_delivery_booking' THEN
    v_ref := COALESCE(NEW.booking_ref, '');
    v_title := 'New business delivery booking';
    v_body := COALESCE(NULLIF(COALESCE(NEW.sender_name, '') || ' → ' || COALESCE(NEW.recipient_name, ''), ' → '), 'A new business delivery was booked');
    v_link := '/admin/bookings';
  ELSIF v_kind = 'logistics_request' THEN
    v_ref := COALESCE(NEW.request_ref, '');
    v_title := 'New logistics request';
    v_body := COALESCE(NULLIF(NEW.title, ''), 'A new logistics service request was submitted');
    v_link := '/admin/agents';
  ELSIF v_kind = 'business_logistics_request' THEN
    v_ref := COALESCE(NEW.request_ref, '');
    v_title := 'New business logistics request';
    v_body := COALESCE(NULLIF(NEW.title, ''), 'A new business logistics request was submitted');
    v_link := '/admin/businesses';
  END IF;

  INSERT INTO admin_notifications (kind, title, body, link, source_id)
  VALUES (v_kind, v_title, v_body, v_link, v_ref);

  RETURN NEW;
END;
$$;

-- ── Attach triggers ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_admin_notify_delivery ON delivery_bookings;
CREATE TRIGGER trg_admin_notify_delivery
  AFTER INSERT ON delivery_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_request('delivery_booking');

DROP TRIGGER IF EXISTS trg_admin_notify_business_delivery ON business_delivery_bookings;
CREATE TRIGGER trg_admin_notify_business_delivery
  AFTER INSERT ON business_delivery_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_request('business_delivery_booking');

DROP TRIGGER IF EXISTS trg_admin_notify_logistics ON logistics_requests;
CREATE TRIGGER trg_admin_notify_logistics
  AFTER INSERT ON logistics_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_request('logistics_request');

DROP TRIGGER IF EXISTS trg_admin_notify_business_logistics ON business_logistics_requests;
CREATE TRIGGER trg_admin_notify_business_logistics
  AFTER INSERT ON business_logistics_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_request('business_logistics_request');
