/*
  # Make agent_id nullable in delivery_bookings

  Admin-created bookings have no associated agent, so agent_id must allow NULL.

  ## Changes
  - `delivery_bookings.agent_id`: NOT NULL → nullable
*/

ALTER TABLE delivery_bookings ALTER COLUMN agent_id DROP NOT NULL;
