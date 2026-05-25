/*
  # Add delivery_type to business_delivery_bookings

  Adds the delivery_type column to business_delivery_bookings so national and
  international routes are correctly identified on the order tracking page.

  - New column: delivery_type (text, nullable) — values: 'same_state', 'national', 'international'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_delivery_bookings' AND column_name = 'delivery_type'
  ) THEN
    ALTER TABLE business_delivery_bookings ADD COLUMN delivery_type text;
  END IF;
END $$;
