-- Allow 'relocation' as a valid service_type in logistics request tables.
-- The original CHECK constraint only allowed: freight, warehousing, express, bulk, customs, last_mile.
-- The UI exposes "Relocation Services" (value 'relocation') but the DB rejected it.

ALTER TABLE logistics_requests
  DROP CONSTRAINT IF EXISTS logistics_requests_service_type_check;

ALTER TABLE logistics_requests
  ADD CONSTRAINT logistics_requests_service_type_check
  CHECK (service_type = ANY (ARRAY['freight'::text, 'warehousing'::text, 'express'::text, 'bulk'::text, 'customs'::text, 'last_mile'::text, 'relocation'::text]));

ALTER TABLE business_logistics_requests
  DROP CONSTRAINT IF EXISTS business_logistics_requests_service_type_check;

ALTER TABLE business_logistics_requests
  ADD CONSTRAINT business_logistics_requests_service_type_check
  CHECK (service_type = ANY (ARRAY['freight'::text, 'warehousing'::text, 'express'::text, 'bulk'::text, 'customs'::text, 'last_mile'::text, 'relocation'::text]));