/*
  # Add package type surcharges and weight-based fee

  ## Changes

  1. New Table: `package_type_charges`
     - `id` (uuid, primary key)
     - `package_type` (text, unique) — document | parcel | fragile | heavy
     - `label` (text) — display name
     - `surcharge` (numeric) — flat additional charge in ₦, 0 = free
     - `updated_at` (timestamptz)
     - `updated_by` (text) — audit trail

  2. Modified Table: `delivery_fee_settings`
     - Added `weight_fee_per_kg` (numeric) — per-kg charge in ₦, 0 = free

  3. Security
     - RLS enabled on package_type_charges
     - Public (anon + authenticated) can SELECT
     - Authenticated can INSERT/UPDATE

  4. Seed default package type charges (all free by default)
*/

-- Add weight_fee_per_kg to delivery_fee_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_fee_settings' AND column_name = 'weight_fee_per_kg'
  ) THEN
    ALTER TABLE delivery_fee_settings ADD COLUMN weight_fee_per_kg numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create package_type_charges table
CREATE TABLE IF NOT EXISTS package_type_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_type text UNIQUE NOT NULL,
  label text NOT NULL DEFAULT '',
  surcharge numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by text DEFAULT ''
);

ALTER TABLE package_type_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read package type charges"
  ON package_type_charges FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update package type charges"
  ON package_type_charges FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert package type charges"
  ON package_type_charges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed defaults (all free by default)
INSERT INTO package_type_charges (package_type, label, surcharge)
VALUES
  ('document', 'Document', 0),
  ('parcel',   'Parcel',   0),
  ('fragile',  'Fragile',  2500),
  ('heavy',    'Heavy Cargo', 5000)
ON CONFLICT (package_type) DO NOTHING;
