/*
# Rider Assignment System

## Summary
Adds full rider assignment infrastructure: columns on booking tables,
GPS location tracking, rider ratings, and in-app push notifications.

## Modified Tables
- `delivery_bookings`: assigned_rider_id, assignment_status, assignment_note, assigned_at
- `business_delivery_bookings`: same four columns

## New Tables
1. `rider_locations` – stores each rider's last GPS fix (lat/lng + city + accuracy)
2. `rider_ratings` – admin ratings (1–5 stars) per completed delivery
3. `rider_notifications` – in-app notifications sent to riders when assigned

## RLS Changes
- delivery_bookings: UPDATE allowed for authenticated users (admin assigns);
  riders may UPDATE rows where assigned_rider_id = auth.uid()
- business_delivery_bookings: same
- rider_locations: any authenticated user may read; rider may upsert own row
- rider_ratings: authenticated may read/insert
- rider_notifications: rider reads/updates own rows; authenticated may insert
*/

-- ── delivery_bookings assignment columns ─────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='delivery_bookings' AND column_name='assigned_rider_id'
  ) THEN
    ALTER TABLE delivery_bookings
      ADD COLUMN assigned_rider_id uuid REFERENCES rider_profiles(id) ON DELETE SET NULL,
      ADD COLUMN assignment_status text NOT NULL DEFAULT 'unassigned',
      ADD COLUMN assignment_note text,
      ADD COLUMN assigned_at timestamptz;
  END IF;
END $$;

-- ── business_delivery_bookings assignment columns ─────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='business_delivery_bookings' AND column_name='assigned_rider_id'
  ) THEN
    ALTER TABLE business_delivery_bookings
      ADD COLUMN assigned_rider_id uuid REFERENCES rider_profiles(id) ON DELETE SET NULL,
      ADD COLUMN assignment_status text NOT NULL DEFAULT 'unassigned',
      ADD COLUMN assignment_note text,
      ADD COLUMN assigned_at timestamptz;
  END IF;
END $$;

-- ── UPDATE policies for admin assignment ──────────────────────────────────────
DROP POLICY IF EXISTS "admin_update_delivery_bookings" ON delivery_bookings;
CREATE POLICY "admin_update_delivery_bookings" ON delivery_bookings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_business_delivery_bookings" ON business_delivery_bookings;
CREATE POLICY "admin_update_business_delivery_bookings" ON business_delivery_bookings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── rider_locations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rider_locations (
  rider_id  uuid PRIMARY KEY REFERENCES rider_profiles(id) ON DELETE CASCADE,
  latitude  decimal(10,7) NOT NULL,
  longitude decimal(10,7) NOT NULL,
  city      text,
  accuracy  decimal,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE rider_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_rider_locations" ON rider_locations;
CREATE POLICY "auth_read_rider_locations" ON rider_locations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rider_insert_own_location" ON rider_locations;
CREATE POLICY "rider_insert_own_location" ON rider_locations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = rider_id);

DROP POLICY IF EXISTS "rider_update_own_location" ON rider_locations;
CREATE POLICY "rider_update_own_location" ON rider_locations
  FOR UPDATE TO authenticated
  USING (auth.uid() = rider_id) WITH CHECK (auth.uid() = rider_id);

-- ── rider_ratings ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rider_ratings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id     uuid NOT NULL REFERENCES rider_profiles(id) ON DELETE CASCADE,
  booking_id   uuid NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('delivery', 'business')),
  rating       integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (booking_id, booking_type)
);
ALTER TABLE rider_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_rider_ratings" ON rider_ratings;
CREATE POLICY "auth_read_rider_ratings" ON rider_ratings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_rider_ratings" ON rider_ratings;
CREATE POLICY "auth_insert_rider_ratings" ON rider_ratings
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── rider_notifications ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rider_notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id     uuid NOT NULL REFERENCES rider_profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  message      text NOT NULL,
  type         text NOT NULL DEFAULT 'assignment',
  booking_id   uuid,
  booking_type text,
  is_read      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE rider_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rider_read_own_notifications" ON rider_notifications;
CREATE POLICY "rider_read_own_notifications" ON rider_notifications
  FOR SELECT TO authenticated USING (auth.uid() = rider_id);

DROP POLICY IF EXISTS "rider_update_own_notifications" ON rider_notifications;
CREATE POLICY "rider_update_own_notifications" ON rider_notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = rider_id) WITH CHECK (auth.uid() = rider_id);

DROP POLICY IF EXISTS "admin_insert_notifications" ON rider_notifications;
CREATE POLICY "admin_insert_notifications" ON rider_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_delivery_bookings_assigned_rider   ON delivery_bookings(assigned_rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_bookings_assign_status    ON delivery_bookings(assignment_status);
CREATE INDEX IF NOT EXISTS idx_biz_bookings_assigned_rider        ON business_delivery_bookings(assigned_rider_id);
CREATE INDEX IF NOT EXISTS idx_biz_bookings_assign_status         ON business_delivery_bookings(assignment_status);
CREATE INDEX IF NOT EXISTS idx_rider_notifications_unread         ON rider_notifications(rider_id, is_read);
CREATE INDEX IF NOT EXISTS idx_rider_ratings_rider_id             ON rider_ratings(rider_id);
