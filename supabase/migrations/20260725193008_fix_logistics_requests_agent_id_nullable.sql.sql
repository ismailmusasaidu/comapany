/*
  # Make agent_id nullable on logistics_requests

  ## Problem
  The `logistics_requests` table was originally created for agents, so
  `agent_id` was defined NOT NULL. Later, an Individuals portal was added
  that reuses this same table — individuals submit requests with
  `individual_id` set (and `agent_id` left unset). Because `agent_id` is
  NOT NULL with no default, every insert from an individual customer fails
  with a NOT NULL constraint violation, so the "Request Logistics Service"
  form never completes for individuals.

  ## Fix
  Alter `agent_id` to be nullable, mirroring what was already done for
  `delivery_bookings` in a prior migration. Agent submissions continue to
  set `agent_id`; individual submissions set `individual_id` instead.
  No data is lost — existing rows keep their values.

  ## Security
  No RLS policy changes. Existing policies already handle both paths:
    - "Approved agents can insert requests" requires agent_id = auth.uid()
    - "Individuals can insert own logistics requests" requires
      individual_id = auth.uid()
  Making agent_id nullable does not weaken these checks.
*/

ALTER TABLE logistics_requests ALTER COLUMN agent_id DROP NOT NULL;
