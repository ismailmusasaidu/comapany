/*
# Fix workflow field guard to allow trusted database roles

1. Problem
- The `guard_request_protected_fields()` trigger only allowed updates when the
  caller's JWT (`auth.uid()`) belonged to an admin.
- The pg_cron job that expires overdue quotations has no JWT at all, so its
  legitimate workflow updates were rejected with
  "Customers cannot modify workflow-managed fields".

2. Fix
- The trigger now also allows updates when the *actual database role* executing
  the statement is a trusted one (`postgres` or `service_role`), e.g. inside
  SECURITY DEFINER functions and cron jobs.
- API callers (anon / authenticated roles) can never assume those roles, so the
  customer-protection behaviour is unchanged: regular customers still cannot
  change request_status, quotation_status, payment_status, fee_amount,
  booking_reference, accepted_quotation_id, confirmed_at or admin_notes.
- Applies the same change to both request tables (they share one trigger
  function).
*/

CREATE OR REPLACE FUNCTION public.guard_request_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Trusted database roles: security definer functions and cron jobs run as
  -- the table owner (postgres) or service_role; API callers cannot assume these.
  IF current_user IN ('postgres', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Admin users identified by their JWT are also allowed.
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = (SELECT auth.uid() AS uid)) THEN
    RETURN NEW;
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