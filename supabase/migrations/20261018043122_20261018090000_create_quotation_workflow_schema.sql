/*
# Quotation & Booking Workflow — Part 1: Schema (retry, reordered)

Same as the first attempt, but the one-time backfill of standardized statuses
for existing rows now runs BEFORE the customer-protection trigger is created
(the guard correctly blocked the bulk seed update).

1. New Tables: quotations, quotation_line_items, quotation_revision_requests,
   quotation_history (all RLS-protected, deny-by-default writes).
2. Modified Tables: logistics_requests + business_logistics_requests gain
   request_status / quotation_status / operational_status / booking_reference /
   confirmed_at / accepted_quotation_id; legacy status kept in sync by trigger.
3. Security: owner/admin read policies; SECURITY DEFINER-only writes; guard
   trigger blocks customers from touching protected workflow fields.
*/

CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_ref text NOT NULL,
  request_table text NOT NULL CHECK (request_table IN ('logistics_requests','business_logistics_requests')),
  request_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','accepted','revision_requested','declined','expired','superseded')),
  currency text NOT NULL DEFAULT 'NGN',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  additional_charges numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  service_scope text NOT NULL DEFAULT '',
  exclusions text NOT NULL DEFAULT '',
  estimated_timeline text NOT NULL DEFAULT '',
  estimated_start_date date,
  estimated_end_date date,
  payment_terms text NOT NULL DEFAULT '',
  deposit_amount numeric(14,2),
  terms_and_conditions text NOT NULL DEFAULT '',
  internal_notes text NOT NULL DEFAULT '',
  valid_until timestamptz,
  created_by uuid,
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  superseded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_table, request_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_quotations_request ON public.quotations (request_table, request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_owner ON public.quotations (owner_id);

CREATE TABLE IF NOT EXISTS public.quotation_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  charge_type text NOT NULL DEFAULT 'service_fee'
    CHECK (charge_type IN ('service_fee','duty','tax','port_charge','third_party','storage','handling','transport','packaging','other')),
  is_estimate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quotation_line_items_quotation ON public.quotation_line_items (quotation_id);

CREATE TABLE IF NOT EXISTS public.quotation_revision_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  request_table text NOT NULL,
  request_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_qrr_request ON public.quotation_revision_requests (request_table, request_id);

CREATE TABLE IF NOT EXISTS public.quotation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table text NOT NULL,
  entity_id uuid NOT NULL,
  prev_status text,
  new_status text,
  actor_id uuid,
  actor_role text NOT NULL DEFAULT 'system',
  action text NOT NULL DEFAULT '',
  quotation_version integer,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qh_entity ON public.quotation_history (entity_table, entity_id);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotation_select_owner_or_admin" ON public.quotations;
CREATE POLICY "quotation_select_owner_or_admin" ON public.quotations FOR SELECT
TO authenticated
USING (
  owner_id = (SELECT auth.uid() AS uid)
  OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = (SELECT auth.uid() AS uid))
);

DROP POLICY IF EXISTS "qli_select_via_quotation" ON public.quotation_line_items;
CREATE POLICY "qli_select_via_quotation" ON public.quotation_line_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quotations q
    WHERE q.id = quotation_id
      AND (q.owner_id = (SELECT auth.uid() AS uid)
           OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = (SELECT auth.uid() AS uid)))
  )
);

DROP POLICY IF EXISTS "qrr_select_owner_or_admin" ON public.quotation_revision_requests;
CREATE POLICY "qrr_select_owner_or_admin" ON public.quotation_revision_requests FOR SELECT
TO authenticated
USING (
  customer_id = (SELECT auth.uid() AS uid)
  OR EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = (SELECT auth.uid() AS uid))
);

DROP POLICY IF EXISTS "qh_select_admin" ON public.quotation_history;
CREATE POLICY "qh_select_admin" ON public.quotation_history FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = (SELECT auth.uid() AS uid)));

-- ─────────────── New workflow columns ───────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='logistics_requests' AND column_name='request_status') THEN
    ALTER TABLE public.logistics_requests ADD COLUMN request_status text NOT NULL DEFAULT 'submitted';
    ALTER TABLE public.logistics_requests ADD COLUMN quotation_status text NOT NULL DEFAULT 'none';
    ALTER TABLE public.logistics_requests ADD COLUMN operational_status text NOT NULL DEFAULT 'not_scheduled';
    ALTER TABLE public.logistics_requests ADD COLUMN booking_reference text;
    ALTER TABLE public.logistics_requests ADD COLUMN confirmed_at timestamptz;
    ALTER TABLE public.logistics_requests ADD COLUMN accepted_quotation_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='business_logistics_requests' AND column_name='request_status') THEN
    ALTER TABLE public.business_logistics_requests ADD COLUMN request_status text NOT NULL DEFAULT 'submitted';
    ALTER TABLE public.business_logistics_requests ADD COLUMN quotation_status text NOT NULL DEFAULT 'none';
    ALTER TABLE public.business_logistics_requests ADD COLUMN operational_status text NOT NULL DEFAULT 'not_scheduled';
    ALTER TABLE public.business_logistics_requests ADD COLUMN booking_reference text;
    ALTER TABLE public.business_logistics_requests ADD COLUMN confirmed_at timestamptz;
    ALTER TABLE public.business_logistics_requests ADD COLUMN accepted_quotation_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lr_request_status ON public.logistics_requests (request_status);
CREATE INDEX IF NOT EXISTS idx_blr_request_status ON public.business_logistics_requests (request_status);

-- Backfill standardized statuses for existing rows (must run before guard trigger)
UPDATE public.logistics_requests SET request_status = CASE status
  WHEN 'pending' THEN 'submitted' WHEN 'reviewing' THEN 'under_review'
  WHEN 'approved' THEN 'confirmed' WHEN 'in_progress' THEN 'confirmed'
  WHEN 'completed' THEN 'confirmed' WHEN 'rejected' THEN 'declined'
  ELSE 'submitted' END
WHERE request_status = 'submitted' AND status IS DISTINCT FROM 'pending';

UPDATE public.business_logistics_requests SET request_status = CASE status
  WHEN 'pending' THEN 'submitted' WHEN 'reviewing' THEN 'under_review'
  WHEN 'approved' THEN 'confirmed' WHEN 'in_progress' THEN 'confirmed'
  WHEN 'completed' THEN 'confirmed' WHEN 'rejected' THEN 'declined'
  ELSE 'submitted' END
WHERE request_status = 'submitted' AND status IS DISTINCT FROM 'pending';

-- ─────────────── Legacy status sync trigger ───────────────
CREATE OR REPLACE FUNCTION public.sync_legacy_request_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.status := CASE NEW.request_status
    WHEN 'submitted' THEN 'pending'
    WHEN 'under_review' THEN 'reviewing'
    WHEN 'awaiting_quotation' THEN 'reviewing'
    WHEN 'awaiting_information' THEN 'reviewing'
    WHEN 'quotation_sent' THEN 'reviewing'
    WHEN 'revision_requested' THEN 'reviewing'
    WHEN 'quotation_revised' THEN 'reviewing'
    WHEN 'confirmed' THEN 'approved'
    WHEN 'declined' THEN 'rejected'
    WHEN 'expired' THEN 'pending'
    WHEN 'cancelled' THEN 'rejected'
    ELSE NEW.status
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_legacy_status_lr ON public.logistics_requests;
CREATE TRIGGER trg_sync_legacy_status_lr BEFORE UPDATE OF request_status ON public.logistics_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_request_status();

DROP TRIGGER IF EXISTS trg_sync_legacy_status_blr ON public.business_logistics_requests;
CREATE TRIGGER trg_sync_legacy_status_blr BEFORE UPDATE OF request_status ON public.business_logistics_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_request_status();

-- ─────────────── Guard: customers cannot change protected fields ───────────────
CREATE OR REPLACE FUNCTION public.guard_request_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = (SELECT auth.uid() AS uid)) THEN
    RETURN NEW; -- admins are allowed
  END IF;
  IF NEW.request_status IS DISTINCT FROM OLD.request_status
     OR NEW.quotation_status IS DISTINCT FROM OLD.quotation_status
     OR NEW.operational_status IS DISTINCT FROM OLD.operational_status
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.fee_amount IS DISTINCT FROM OLD.fee_amount
     OR NEW.booking_reference IS DISTINCT FROM OLD.booking_reference
     OR NEW.accepted_quotation_id IS DISTINCT FROM OLD.accepted_quotation_id
     OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'Customers cannot modify workflow-managed fields of a logistics request';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_protected_lr ON public.logistics_requests;
CREATE TRIGGER trg_guard_protected_lr BEFORE UPDATE ON public.logistics_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_request_protected_fields();

DROP TRIGGER IF EXISTS trg_guard_protected_blr ON public.business_logistics_requests;
CREATE TRIGGER trg_guard_protected_blr BEFORE UPDATE ON public.business_logistics_requests
FOR EACH ROW EXECUTE FUNCTION public.guard_request_protected_fields();
