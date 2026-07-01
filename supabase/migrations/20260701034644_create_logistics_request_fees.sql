/*
# Create Logistics Request Fees Settings Table

## Purpose
Stores admin-configurable pricing for each logistics service type
(freight, warehousing, express, bulk, customs, last_mile, relocation).
This is separate from delivery_fee_settings which covers per-km delivery bookings.

## New Tables

### `logistics_request_fees`
| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| service_type | text | Unique key matching service codes in the logistics request forms |
| label | text | Human-readable service name |
| base_fee | numeric | Starting / minimum fee for this service (₦) |
| fee_per_km | numeric | Additional charge per kilometre of road distance (₦, 0 = not applicable) |
| fee_per_kg | numeric | Additional charge per kilogram of cargo weight (₦, 0 = not applicable) |
| fee_per_unit | numeric | Additional charge per unit/item (₦, 0 = not applicable) |
| is_quotation_based | boolean | True = admin reviews and sends a custom quote; fee fields are indicative only |
| notes | text | Visible note shown to customers about this service's pricing |
| is_active | boolean | Whether this service is currently offered |
| updated_at | timestamptz | Last update timestamp |
| updated_by | text | Email of the admin who last saved changes |

## Security
- RLS enabled.
- Public (anon + authenticated) can SELECT so the frontend can display pricing.
- Only authenticated users (admin) can INSERT / UPDATE / DELETE.

## Seed Data
Pre-populates all 7 service types with zero fees and quotation_based = true
so the page shows something on first load.
*/

CREATE TABLE IF NOT EXISTS logistics_request_fees (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type        text        UNIQUE NOT NULL,
  label               text        NOT NULL DEFAULT '',
  base_fee            numeric     NOT NULL DEFAULT 0,
  fee_per_km          numeric     NOT NULL DEFAULT 0,
  fee_per_kg          numeric     NOT NULL DEFAULT 0,
  fee_per_unit        numeric     NOT NULL DEFAULT 0,
  is_quotation_based  boolean     NOT NULL DEFAULT true,
  notes               text        NOT NULL DEFAULT '',
  is_active           boolean     NOT NULL DEFAULT true,
  updated_at          timestamptz          DEFAULT now(),
  updated_by          text        NOT NULL DEFAULT ''
);

ALTER TABLE logistics_request_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_logistics_fees"   ON logistics_request_fees;
DROP POLICY IF EXISTS "admin_insert_logistics_fees"  ON logistics_request_fees;
DROP POLICY IF EXISTS "admin_update_logistics_fees"  ON logistics_request_fees;
DROP POLICY IF EXISTS "admin_delete_logistics_fees"  ON logistics_request_fees;

CREATE POLICY "public_read_logistics_fees" ON logistics_request_fees
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_insert_logistics_fees" ON logistics_request_fees
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_update_logistics_fees" ON logistics_request_fees
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin_delete_logistics_fees" ON logistics_request_fees
  FOR DELETE TO authenticated USING (true);

-- Seed all 7 service types
INSERT INTO logistics_request_fees (service_type, label, is_quotation_based)
VALUES
  ('freight',    'Freight Shipping',     true),
  ('warehousing','Warehousing',          true),
  ('express',    'Express Delivery',     true),
  ('bulk',       'Bulk Transport',       true),
  ('customs',    'Customs Clearance',    true),
  ('last_mile',  'Last Mile Delivery',   true),
  ('relocation', 'Relocation Services',  true)
ON CONFLICT (service_type) DO NOTHING;
