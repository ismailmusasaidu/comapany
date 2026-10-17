-- Admin-set service fee for logistics requests, once a request is approved.
ALTER TABLE logistics_requests
  ADD COLUMN IF NOT EXISTS fee_amount numeric,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

ALTER TABLE business_logistics_requests
  ADD COLUMN IF NOT EXISTS fee_amount numeric,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'logistics_requests_payment_status_check'
  ) THEN
    ALTER TABLE logistics_requests
      ADD CONSTRAINT logistics_requests_payment_status_check CHECK (payment_status IN ('unpaid','paid'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_logistics_requests_payment_status_check'
  ) THEN
    ALTER TABLE business_logistics_requests
      ADD CONSTRAINT business_logistics_requests_payment_status_check CHECK (payment_status IN ('unpaid','paid'));
  END IF;
END $$;