/*
# Add cold_chain to logistics service types

1. Changes
- Extend the `service_type` check constraints on `logistics_requests` and
  `business_logistics_requests` to accept a new `cold_chain` value.

2. Reason
- The Individual, Agent and Business dashboards need a Cold Chain Logistics
  request type for temperature-sensitive cargo.

3. Safety
- Constraint-only change. No data is dropped or altered.
*/

ALTER TABLE logistics_requests
  DROP CONSTRAINT IF EXISTS logistics_requests_service_type_check;
ALTER TABLE logistics_requests
  ADD CONSTRAINT logistics_requests_service_type_check
  CHECK (service_type = ANY (ARRAY['freight','warehousing','express','bulk','customs','last_mile','relocation','cold_chain']::text[]));

ALTER TABLE business_logistics_requests
  DROP CONSTRAINT IF EXISTS business_logistics_requests_service_type_check;
ALTER TABLE business_logistics_requests
  ADD CONSTRAINT business_logistics_requests_service_type_check
  CHECK (service_type = ANY (ARRAY['freight','warehousing','express','bulk','customs','last_mile','relocation','cold_chain']::text[]));
