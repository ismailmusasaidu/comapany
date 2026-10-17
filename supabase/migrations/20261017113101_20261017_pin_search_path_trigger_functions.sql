/*
# Pin search_path on remaining trigger functions

1. Summary
   Four timestamp-maintenance trigger functions did not pin their search
   path, which a security scanner flagged. Pinning the search path prevents
   a class of function-hijacking attacks where a malicious object is placed
   earlier on the lookup path.

2. Changes
   - ALTER FUNCTION ... SET search_path = public on:
     update_rider_profiles_updated_at, update_orders_updated_at,
     update_updated_at_column, update_business_updated_at.

3. Notes
   - Idempotent: re-running produces the same state.
*/

ALTER FUNCTION public.update_rider_profiles_updated_at() SET search_path = public;
ALTER FUNCTION public.update_orders_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_business_updated_at() SET search_path = public;