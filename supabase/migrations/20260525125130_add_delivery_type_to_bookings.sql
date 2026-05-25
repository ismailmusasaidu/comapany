/*
  # Add delivery_type to delivery booking tables

  Adds a `delivery_type` column to both `delivery_bookings` and `business_delivery_bookings`.

  1. Changes
    - `delivery_bookings`: new column `delivery_type` text, default 'same_state'
    - `business_delivery_bookings`: new column `delivery_type` text, default 'same_state'

  2. Values
    - 'same_state'    — pickup and delivery within the same state
    - 'inter_state'   — pickup and delivery across different Nigerian states
    - 'international' — cross-border / international delivery
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_bookings' AND column_name = 'delivery_type'
  ) THEN
    ALTER TABLE delivery_bookings ADD COLUMN delivery_type text NOT NULL DEFAULT 'same_state';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_delivery_bookings' AND column_name = 'delivery_type'
  ) THEN
    ALTER TABLE business_delivery_bookings ADD COLUMN delivery_type text NOT NULL DEFAULT 'same_state';
  END IF;
END $$;
