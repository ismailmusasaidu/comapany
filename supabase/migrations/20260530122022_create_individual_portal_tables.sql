/*
  # Individual Portal Tables

  1. New Tables
    - `individual_profiles`
      - `id` (uuid, PK, references auth.users)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `created_at` (timestamptz)

  2. Notes
    - Individuals self-register and are immediately active (no approval flow)
    - They share the same delivery_bookings and logistics_requests tables as agents
      but with individual_id column added
    - RLS ensures individuals only see their own data
    - message_threads supports recipient_type = 'individual' already via text column

  3. Security
    - RLS enabled on individual_profiles
    - Individuals can read/update own profile
    - individual_id added to delivery_bookings and logistics_requests
*/

-- Individual profiles table
CREATE TABLE IF NOT EXISTS individual_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE individual_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Individuals can read own profile"
  ON individual_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Individuals can insert own profile"
  ON individual_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Individuals can update own profile"
  ON individual_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add individual_id column to delivery_bookings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_bookings' AND column_name = 'individual_id'
  ) THEN
    ALTER TABLE delivery_bookings ADD COLUMN individual_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add individual_id column to logistics_requests if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logistics_requests' AND column_name = 'individual_id'
  ) THEN
    ALTER TABLE logistics_requests ADD COLUMN individual_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- RLS policies for individual access to delivery_bookings
CREATE POLICY "Individuals can view own delivery bookings"
  ON delivery_bookings FOR SELECT
  TO authenticated
  USING (individual_id = auth.uid());

CREATE POLICY "Individuals can insert own delivery bookings"
  ON delivery_bookings FOR INSERT
  TO authenticated
  WITH CHECK (individual_id = auth.uid());

CREATE POLICY "Individuals can update own delivery bookings"
  ON delivery_bookings FOR UPDATE
  TO authenticated
  USING (individual_id = auth.uid())
  WITH CHECK (individual_id = auth.uid());

-- RLS policies for individual access to logistics_requests
CREATE POLICY "Individuals can view own logistics requests"
  ON logistics_requests FOR SELECT
  TO authenticated
  USING (individual_id = auth.uid());

CREATE POLICY "Individuals can insert own logistics requests"
  ON logistics_requests FOR INSERT
  TO authenticated
  WITH CHECK (individual_id = auth.uid());

CREATE POLICY "Individuals can update own logistics requests"
  ON logistics_requests FOR UPDATE
  TO authenticated
  USING (individual_id = auth.uid())
  WITH CHECK (individual_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_bookings_individual_id ON delivery_bookings(individual_id);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_individual_id ON logistics_requests(individual_id);
CREATE INDEX IF NOT EXISTS idx_individual_profiles_email ON individual_profiles(email);
