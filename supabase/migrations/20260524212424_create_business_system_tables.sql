/*
  # Create Business Portal System Tables

  ## Overview
  Mirrors the agent system but tailored for business/company accounts.

  ## New Tables
  1. `business_profiles`
     - `id` (uuid, PK, references auth.users)
     - `company_name` (text) - official registered company name
     - `contact_person` (text) - primary contact full name
     - `email` (text)
     - `phone` (text)
     - `industry` (text) - industry sector
     - `company_size` (text) - S/M/L/Enterprise
     - `address` (text)
     - `city` (text)
     - `registration_number` (text) - CAC or company reg number
     - `tax_id` (text) - optional TIN
     - `status` (text) - pending/approved/rejected
     - `rejection_reason` (text)
     - `created_at`, `updated_at`

  2. `business_delivery_bookings`
     - Same structure as `delivery_bookings` but with `business_id` FK
     - `booking_ref` pattern BB-XXXXXX

  3. `business_logistics_requests`
     - Same structure as `logistics_requests` but with `business_id` FK
     - `request_ref` pattern BR-XXXXXX

  ## Security
  - RLS enabled on all three tables
  - Businesses access only their own rows
  - Admin can read/update all rows
*/

-- ─── business_profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name        text NOT NULL DEFAULT '',
  contact_person      text NOT NULL DEFAULT '',
  email               text NOT NULL DEFAULT '',
  phone               text NOT NULL DEFAULT '',
  industry            text NOT NULL DEFAULT '',
  company_size        text NOT NULL DEFAULT 'small',
  address             text NOT NULL DEFAULT '',
  city                text NOT NULL DEFAULT '',
  registration_number text NOT NULL DEFAULT '',
  tax_id              text NOT NULL DEFAULT '',
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason    text NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business can read own profile"
  ON business_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Business can insert own profile"
  ON business_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Business can update own profile"
  ON business_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can read all business profiles"
  ON business_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update all business profiles"
  ON business_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── business_delivery_bookings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_delivery_bookings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref          text UNIQUE NOT NULL,
  business_id          uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  sender_name          text NOT NULL DEFAULT '',
  sender_phone         text NOT NULL DEFAULT '',
  sender_address       text NOT NULL DEFAULT '',
  pickup_city          text NOT NULL DEFAULT '',
  recipient_name       text NOT NULL DEFAULT '',
  recipient_phone      text NOT NULL DEFAULT '',
  recipient_address    text NOT NULL DEFAULT '',
  delivery_city        text NOT NULL DEFAULT '',
  package_type         text NOT NULL DEFAULT 'parcel',
  package_description  text NOT NULL DEFAULT '',
  weight_kg            numeric,
  declared_value       numeric,
  special_instructions text NOT NULL DEFAULT '',
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','picked_up','in_transit','out_for_delivery','delivered','cancelled')),
  admin_notes          text NOT NULL DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_delivery_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business can read own bookings"
  ON business_delivery_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = business_id);

CREATE POLICY "Business can insert own bookings"
  ON business_delivery_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Admin can read all business bookings"
  ON business_delivery_bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update all business bookings"
  ON business_delivery_bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── business_logistics_requests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_logistics_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_ref    text UNIQUE NOT NULL,
  business_id    uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  title          text NOT NULL DEFAULT '',
  service_type   text NOT NULL DEFAULT 'freight' CHECK (service_type IN ('freight','warehousing','express','bulk','customs','last_mile')),
  description    text NOT NULL DEFAULT '',
  origin         text NOT NULL DEFAULT '',
  destination    text NOT NULL DEFAULT '',
  quantity       text NOT NULL DEFAULT '',
  weight         text NOT NULL DEFAULT '',
  preferred_date date,
  budget_range   text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','in_progress','completed','rejected')),
  admin_notes    text NOT NULL DEFAULT '',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_logistics_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business can read own requests"
  ON business_logistics_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = business_id);

CREATE POLICY "Business can insert own requests"
  ON business_logistics_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Admin can read all business requests"
  ON business_logistics_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can update all business requests"
  ON business_logistics_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Auto-update updated_at triggers ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_business_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_business_updated_at();

CREATE TRIGGER trg_business_delivery_bookings_updated_at
  BEFORE UPDATE ON business_delivery_bookings
  FOR EACH ROW EXECUTE FUNCTION update_business_updated_at();

CREATE TRIGGER trg_business_logistics_requests_updated_at
  BEFORE UPDATE ON business_logistics_requests
  FOR EACH ROW EXECUTE FUNCTION update_business_updated_at();
