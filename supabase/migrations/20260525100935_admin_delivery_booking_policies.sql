/*
  # Admin Delivery Booking Policies

  Allows authenticated admin users (via service role / admin auth) to insert into
  both delivery_bookings and business_delivery_bookings tables.

  1. Changes
    - Add INSERT policy on `delivery_bookings` for authenticated users (admin creates on behalf)
    - Add INSERT policy on `business_delivery_bookings` for authenticated users (admin creates on behalf)
    - Add SELECT policy so admin can read all rows in both tables

  Note: Admin identity is verified at the application layer via Supabase auth.
  These policies grant any authenticated user insert access, which is gated in
  the UI to the admin role only.
*/

-- delivery_bookings: allow authenticated INSERT (admin booking creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_bookings' AND policyname = 'Authenticated users can insert delivery bookings'
  ) THEN
    CREATE POLICY "Authenticated users can insert delivery bookings"
      ON delivery_bookings FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- delivery_bookings: allow authenticated SELECT all rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_bookings' AND policyname = 'Authenticated users can view all delivery bookings'
  ) THEN
    CREATE POLICY "Authenticated users can view all delivery bookings"
      ON delivery_bookings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- business_delivery_bookings: allow authenticated INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_delivery_bookings' AND policyname = 'Authenticated users can insert business delivery bookings'
  ) THEN
    CREATE POLICY "Authenticated users can insert business delivery bookings"
      ON business_delivery_bookings FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- business_delivery_bookings: allow authenticated SELECT all rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_delivery_bookings' AND policyname = 'Authenticated users can view all business delivery bookings'
  ) THEN
    CREATE POLICY "Authenticated users can view all business delivery bookings"
      ON business_delivery_bookings FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
