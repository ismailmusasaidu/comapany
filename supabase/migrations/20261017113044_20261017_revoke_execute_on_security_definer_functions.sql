/*
# Production hardening: lock down SECURITY DEFINER functions

1. Summary
   A security scan found 30 database helper functions that any visitor (the
   anonymous role) or any signed-in user could invoke directly over the public
   API. These functions are only meant to run internally (from triggers, other
   functions, or server-side jobs) — no part of the website calls them
   directly. This migration removes that public access.

2. Changes
   - REVOKE EXECUTE from PUBLIC, anon, and authenticated on all affected
     functions in the public schema.
   - GRANT EXECUTE to service_role so server-side operations keep working.
   - Fix "mutable search_path" warnings by pinning SET search_path = public
     on the 4 flagged trigger/handler functions.

3. Security impact
   - Visitors and regular signed-in users can no longer call internal
     functions such as confirm_payment, generate_delivery_otp,
     verify_delivery_otp, rider_accept_offer, admin_manual_assign, etc.
   - Triggers and internal callers are unaffected: they run with the
     function owner's rights and do not depend on EXECUTE grants.

4. Notes
   - All statements are idempotent (IF EXISTS / conditional DO blocks).
*/

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC', fn.proname, fn.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', fn.proname, fn.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM authenticated', fn.proname, fn.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', fn.proname, fn.args);
  END LOOP;
END $$;

-- Pin search_path on flagged functions (idempotent: re-ALTER with same body not needed,
-- only the SET clause changes via ALTER FUNCTION ... SET).
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)))
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', fn.proname, fn.args);
  END LOOP;
END $$;