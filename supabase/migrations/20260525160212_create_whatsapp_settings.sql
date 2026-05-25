/*
  # Create whatsapp_settings table

  1. New Tables
    - `whatsapp_settings`
      - `id` (uuid, primary key)
      - `phone_number` (text) — international format, e.g. 2348012345678
      - `delivery_message` (text) — pre-filled message for delivery booking
      - `logistics_message` (text) — pre-filled message for logistics request
      - `is_enabled` (boolean) — toggle visibility on homepage
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public can SELECT (needed for homepage display)
    - Authenticated admin can INSERT/UPDATE
*/

CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL DEFAULT '',
  delivery_message text NOT NULL DEFAULT 'Hello! I would like to book a delivery. Please provide me with the details and pricing.',
  logistics_message text NOT NULL DEFAULT 'Hello! I would like to make a logistics request. Please provide me with information on your services.',
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read whatsapp settings"
  ON whatsapp_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert whatsapp settings"
  ON whatsapp_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update whatsapp settings"
  ON whatsapp_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed one default row
INSERT INTO whatsapp_settings (phone_number, is_enabled)
VALUES ('', true)
ON CONFLICT DO NOTHING;
