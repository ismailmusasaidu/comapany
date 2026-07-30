-- Add freight_details JSONB column to both logistics request tables.
-- This stores the rich freight forwarding wizard data (shipment scope, mode,
-- cargo items, container info, incoterms, additional services, contact info, etc.)
-- without requiring many new columns.

ALTER TABLE logistics_requests
  ADD COLUMN IF NOT EXISTS freight_details jsonb DEFAULT '{}'::jsonb;

ALTER TABLE business_logistics_requests
  ADD COLUMN IF NOT EXISTS freight_details jsonb DEFAULT '{}'::jsonb;