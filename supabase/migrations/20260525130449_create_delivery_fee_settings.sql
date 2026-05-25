/*
  # Create delivery_fee_settings table

  Stores per-km fee rates that admin can configure per delivery type.

  1. New Tables
    - `delivery_fee_settings`
      - `id` (uuid, primary key)
      - `delivery_type` (text, unique) — 'same_state' | 'inter_state' | 'international'
      - `fee_per_km` (numeric) — fee in Naira per kilometre
      - `minimum_fee` (numeric) — minimum charge regardless of distance
      - `updated_at` (timestamptz)
      - `updated_by` (text) — admin email for audit trail

  2. Security
    - Enable RLS
    - Authenticated admin can read and update
    - Public can read (needed to display fee estimate to bookers)

  3. Seed default values
*/

CREATE TABLE IF NOT EXISTS delivery_fee_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_type text UNIQUE NOT NULL,
  fee_per_km numeric NOT NULL DEFAULT 0,
  minimum_fee numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by text DEFAULT ''
);

ALTER TABLE delivery_fee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fee settings"
  ON delivery_fee_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update fee settings"
  ON delivery_fee_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert fee settings"
  ON delivery_fee_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed default rates
INSERT INTO delivery_fee_settings (delivery_type, fee_per_km, minimum_fee)
VALUES
  ('same_state', 150, 1500),
  ('inter_state', 200, 5000),
  ('international', 500, 25000)
ON CONFLICT (delivery_type) DO NOTHING;
