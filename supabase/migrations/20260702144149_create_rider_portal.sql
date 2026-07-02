-- Rider profiles table
CREATE TABLE IF NOT EXISTS rider_profiles (
  id            uuid PRIMARY KEY,
  full_name     text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  phone         text NOT NULL DEFAULT '',
  address       text NOT NULL DEFAULT '',
  city          text NOT NULL DEFAULT '',
  vehicle_type  text NOT NULL DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'tricycle', 'car')),
  license_number text NOT NULL DEFAULT '',
  nin           text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text NOT NULL DEFAULT '',
  admin_notes   text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE rider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_rider_profile" ON rider_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR true);

CREATE POLICY "insert_own_rider_profile" ON rider_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own_rider_profile" ON rider_profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_own_rider_profile" ON rider_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Extend messaging constraints to include 'rider'
ALTER TABLE message_threads
  DROP CONSTRAINT IF EXISTS message_threads_recipient_type_check;
ALTER TABLE message_threads
  ADD CONSTRAINT message_threads_recipient_type_check
  CHECK (recipient_type IN ('agent', 'business', 'rider'));

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_sender_role_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_role_check
  CHECK (sender_role IN ('admin', 'agent', 'business', 'rider'));

-- Index for fast rider lookup
CREATE INDEX IF NOT EXISTS idx_rider_profiles_status ON rider_profiles(status);
