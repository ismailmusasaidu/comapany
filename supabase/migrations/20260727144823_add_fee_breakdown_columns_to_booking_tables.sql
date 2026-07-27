/*
# Add fee breakdown & total columns to delivery booking tables

## What this does
Adds columns to store the computed delivery fee breakdown and total amount
so that booking details and invoices can display the charges the customer
was quoted at checkout — for both Paystack (online) and cash-on-delivery
payments.

## 1. Columns added to delivery_bookings
- `distance_fee`    numeric — the distance-based delivery charge (₦)
- `weight_fee`      numeric — the weight-based surcharge (₦)
- `package_surcharge` numeric — the package-type surcharge (₦)
- `total_amount`    numeric — the grand total the customer must pay (₦)

## 2. Same columns added to business_delivery_bookings
- `distance_fee`, `weight_fee`, `package_surcharge`, `total_amount`

## Security
No RLS policy changes. These are ADD COLUMN only — no existing columns
are dropped, renamed, or type-changed, so no data is lost. Existing rows
get NULL for the new columns, which the frontend treats as "not calculated".
*/

ALTER TABLE delivery_bookings
  ADD COLUMN IF NOT EXISTS distance_fee numeric,
  ADD COLUMN IF NOT EXISTS weight_fee numeric,
  ADD COLUMN IF NOT EXISTS package_surcharge numeric,
  ADD COLUMN IF NOT EXISTS total_amount numeric;

ALTER TABLE business_delivery_bookings
  ADD COLUMN IF NOT EXISTS distance_fee numeric,
  ADD COLUMN IF NOT EXISTS weight_fee numeric,
  ADD COLUMN IF NOT EXISTS package_surcharge numeric,
  ADD COLUMN IF NOT EXISTS total_amount numeric;
