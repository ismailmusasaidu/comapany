/*
# Add Paystack online payment tracking

## What this does
This sets up the database support for real Paystack online checkout.
Previously "Paystack" was only a selectable label — selecting it and clicking
"Confirm & Proceed to Payment" just created the booking without ever contacting
Paystack. This migration adds the columns and ledger table needed to track an
online payment from initialization through verification.

## 1. New columns on existing booking tables
- `delivery_bookings.payment_status` (text, default 'unpaid')
  Tracks whether the online payment has been completed.
  Values: 'unpaid' (default), 'paid', 'failed'.
- `business_delivery_bookings.payment_status` (text, default 'unpaid')
  Same column on the business bookings table.

These are ADD COLUMN only — no existing columns are dropped, renamed, or
type-changed, so no data is lost.

## 2. New table: paystack_transactions
A server-managed ledger of Paystack checkout sessions. Edge functions write to
it using the service role (which bypasses RLS). The frontend never reads or
writes this table directly — it goes through the edge functions instead.
- `id`             uuid primary key
- `booking_ref`    text, the booking reference this payment belongs to
- `table_name`     text, which booking table ('delivery_bookings' or 'business_delivery_bookings')
- `amount_kobo`    bigint, amount in kobo (1 naira = 100 kobo)
- `paystack_ref`   text unique, the reference sent to Paystack
- `status`         text, default 'initialized' ('initialized', 'success', 'failed')
- `customer_email` text, the payer's email
- `created_at`     timestamptz default now()
- `verified_at`    timestamptz, set when verification completes

## 3. Security (RLS)
- RLS enabled on `paystack_transactions`.
- No client-facing policies: the table is intentionally locked down so the
  anon/authenticated roles cannot read or modify payment records directly.
  All access is performed by edge functions using the service role key, which
  bypasses RLS. This keeps payment state tamper-proof.
*/

ALTER TABLE delivery_bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

ALTER TABLE business_delivery_bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

CREATE TABLE IF NOT EXISTS paystack_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref text NOT NULL,
  table_name text NOT NULL,
  amount_kobo bigint NOT NULL,
  paystack_ref text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'initialized',
  customer_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_paystack_tx_booking_ref
  ON paystack_transactions(booking_ref);

ALTER TABLE paystack_transactions ENABLE ROW LEVEL SECURITY;