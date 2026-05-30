/*
  # Add vehicle_type to delivery bookings tables

  ## Changes
  - Adds optional `vehicle_type` column to `delivery_bookings` (individual)
  - Adds optional `vehicle_type` column to `business_delivery_bookings`
  - Adds optional `vehicle_type` column to `logistics_requests` (if exists)
  - Adds optional `vehicle_type` column to `business_logistics_requests` (if exists)

  ## Notes
  - Column is nullable so existing rows are unaffected
  - Values: 'motorbike' | 'car' | 'minivan' | 'truck'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_bookings' AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE delivery_bookings ADD COLUMN vehicle_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_delivery_bookings' AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE business_delivery_bookings ADD COLUMN vehicle_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'logistics_requests'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'logistics_requests' AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE logistics_requests ADD COLUMN vehicle_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'business_logistics_requests'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_logistics_requests' AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE business_logistics_requests ADD COLUMN vehicle_type text;
  END IF;
END $$;
