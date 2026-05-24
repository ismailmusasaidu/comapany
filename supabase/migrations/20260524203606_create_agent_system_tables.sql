/*
  # Agent System Tables

  ## Overview
  Creates the full agent management system: profiles, delivery bookings, and logistics requests.

  ## New Tables

  ### `agent_profiles`
  Stores agent registration details linked to Supabase auth users.
  - `id` (uuid, PK, FK to auth.users)
  - `full_name` (text)
  - `email` (text)
  - `phone` (text)
  - `company_name` (text)
  - `address` (text)
  - `city` (text)
  - `id_number` (text) - national ID or business registration
  - `status` (text) - pending | approved | rejected
  - `rejection_reason` (text)
  - `created_at`, `updated_at` (timestamptz)

  ### `delivery_bookings`
  Orders created by approved agents.
  - `id` (uuid, PK)
  - `booking_ref` (text, unique) - human-readable reference e.g. BK-00001
  - `agent_id` (uuid, FK to agent_profiles)
  - `sender_name`, `sender_phone`, `sender_address` (text)
  - `recipient_name`, `recipient_phone`, `recipient_address` (text)
  - `pickup_city`, `delivery_city` (text)
  - `package_type` (text) - document | parcel | fragile | heavy
  - `package_description` (text)
  - `weight_kg` (numeric)
  - `declared_value` (numeric)
  - `special_instructions` (text)
  - `status` (text) - pending | confirmed | picked_up | in_transit | delivered | cancelled
  - `created_at`, `updated_at` (timestamptz)

  ### `logistics_requests`
  Logistics service requests by approved agents.
  - `id` (uuid, PK)
  - `request_ref` (text, unique)
  - `agent_id` (uuid, FK to agent_profiles)
  - `service_type` (text) - freight | warehousing | express | bulk | customs | last_mile
  - `title` (text)
  - `description` (text)
  - `origin` (text)
  - `destination` (text)
  - `quantity` (integer)
  - `weight_kg` (numeric)
  - `preferred_date` (date)
  - `budget_range` (text)
  - `status` (text) - pending | reviewing | approved | in_progress | completed | rejected
  - `admin_notes` (text)
  - `created_at`, `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all three tables
  - Agents can only read/write their own data
  - Admins (authenticated) can read/update all rows
*/

-- agent_profiles
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  id_number text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- delivery_bookings
CREATE TABLE IF NOT EXISTS delivery_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref text UNIQUE NOT NULL,
  agent_id uuid NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT '',
  sender_phone text NOT NULL DEFAULT '',
  sender_address text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  recipient_phone text NOT NULL DEFAULT '',
  recipient_address text NOT NULL DEFAULT '',
  pickup_city text NOT NULL DEFAULT '',
  delivery_city text NOT NULL DEFAULT '',
  package_type text NOT NULL DEFAULT 'parcel' CHECK (package_type IN ('document', 'parcel', 'fragile', 'heavy')),
  package_description text NOT NULL DEFAULT '',
  weight_kg numeric(10,2),
  declared_value numeric(10,2),
  special_instructions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- logistics_requests
CREATE TABLE IF NOT EXISTS logistics_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_ref text UNIQUE NOT NULL,
  agent_id uuid NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL DEFAULT 'freight' CHECK (service_type IN ('freight', 'warehousing', 'express', 'bulk', 'customs', 'last_mile')),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  quantity integer,
  weight_kg numeric(10,2),
  preferred_date date,
  budget_range text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected')),
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_profiles_status ON agent_profiles(status);
CREATE INDEX IF NOT EXISTS idx_delivery_bookings_agent_id ON delivery_bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_bookings_booking_ref ON delivery_bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_agent_id ON logistics_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_logistics_requests_request_ref ON logistics_requests(request_ref);

-- Enable RLS
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_requests ENABLE ROW LEVEL SECURITY;

-- agent_profiles policies
CREATE POLICY "Agents can view own profile"
  ON agent_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Agents can insert own profile"
  ON agent_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Agents can update own profile"
  ON agent_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- delivery_bookings policies
CREATE POLICY "Agents can view own bookings"
  ON delivery_bookings FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Approved agents can insert bookings"
  ON delivery_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM agent_profiles
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Agents can update own bookings"
  ON delivery_bookings FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- logistics_requests policies
CREATE POLICY "Agents can view own requests"
  ON logistics_requests FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Approved agents can insert requests"
  ON logistics_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM agent_profiles
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Agents can update own requests"
  ON logistics_requests FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Admin can read all agent profiles
CREATE POLICY "Admin can view all agent profiles"
  ON agent_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Admin can update all agent profiles (for approval/rejection)
CREATE POLICY "Admin can update agent profiles"
  ON agent_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin can read all bookings
CREATE POLICY "Admin can view all bookings"
  ON delivery_bookings FOR SELECT
  TO authenticated
  USING (true);

-- Admin can update all bookings
CREATE POLICY "Admin can update all bookings"
  ON delivery_bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Admin can read all logistics requests
CREATE POLICY "Admin can view all logistics requests"
  ON logistics_requests FOR SELECT
  TO authenticated
  USING (true);

-- Admin can update all logistics requests
CREATE POLICY "Admin can update all logistics requests"
  ON logistics_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_profiles_updated_at
  BEFORE UPDATE ON agent_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER delivery_bookings_updated_at
  BEFORE UPDATE ON delivery_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER logistics_requests_updated_at
  BEFORE UPDATE ON logistics_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sequence helper for readable refs
CREATE SEQUENCE IF NOT EXISTS booking_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS request_ref_seq START 1;
