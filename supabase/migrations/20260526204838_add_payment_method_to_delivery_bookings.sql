/*
  # Add payment_method to delivery booking tables

  ## Summary
  Adds a `payment_method` column to both `delivery_bookings` and `business_delivery_bookings`
  to record how the customer intends to pay for their delivery.

  ## Changes

  ### delivery_bookings
  - New column: `payment_method` (text, NOT NULL, default 'cash_on_delivery')

  ### business_delivery_bookings
  - New column: `payment_method` (text, NOT NULL, default 'cash_on_delivery')

  ## Payment Method Values
  - 'cash_on_delivery'   — Pay in cash when package is delivered
  - 'paystack'           — Online payment via Paystack
  - 'stripe'             — Online payment via Stripe
  - 'bank_transfer_local'       — Nigerian bank transfer
  - 'bank_transfer_international' — International wire transfer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delivery_bookings' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE delivery_bookings ADD COLUMN payment_method text NOT NULL DEFAULT 'cash_on_delivery';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_delivery_bookings' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE business_delivery_bookings ADD COLUMN payment_method text NOT NULL DEFAULT 'cash_on_delivery';
  END IF;
END $$;
