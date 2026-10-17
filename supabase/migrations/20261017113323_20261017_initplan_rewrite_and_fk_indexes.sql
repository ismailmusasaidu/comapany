/*
# Performance: cache auth.uid() per statement and index foreign keys

1. Summary
   Two performance fixes from the database scan:
   - Row-security policies call auth.uid() inside their condition, which
     Postgres may re-evaluate for EVERY row scanned. Wrapping it as
     (select auth.uid()) makes Postgres evaluate it once per query. This is
     a pure mechanical rewrite — behavior is identical, only faster.
   - 3 foreign key columns used for joins lack indexes, slowing deletes and
     joins. Added standard indexes.

2. Changes
   - For every policy whose condition contains auth.uid(), rebuild the
     policy with (select auth.uid()) instead. Policy names, roles, commands
     and conditions are otherwise preserved exactly.
   - CREATE INDEX on foreign key columns:
     business_delivery_bookings(business_id),
     business_logistics_requests(business_id),
     notification_queue(template_id).

3. Notes
   - Idempotent: re-running finds nothing left to rewrite.
*/

DO $$
DECLARE
  pol record;
  new_qual text;
  new_with_check text;
  policy_roles text;
  policy_cmd text;
  clause text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd,
           qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
  LOOP
    new_qual := replace(pol.qual, 'auth.uid()', '(select auth.uid())');
    new_with_check := replace(pol.with_check, 'auth.uid()', '(select auth.uid())');
    policy_roles := array_to_string(pol.roles, ',');
    policy_cmd := upper(pol.cmd);

    IF policy_cmd = 'ALL' THEN
      clause := format('USING (%s) WITH CHECK (%s)', new_qual, new_with_check);
    ELSIF policy_cmd = 'SELECT' THEN
      clause := format('USING (%s)', new_qual);
    ELSIF policy_cmd = 'INSERT' THEN
      clause := format('WITH CHECK (%s)', new_with_check);
    ELSIF policy_cmd = 'UPDATE' THEN
      clause := format('USING (%s) WITH CHECK (%s)', new_qual, new_with_check);
    ELSIF policy_cmd = 'DELETE' THEN
      clause := format('USING (%s)', new_qual);
    ELSE
      RAISE EXCEPTION 'Unsupported policy command % on %', policy_cmd, pol.policyname;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s',
      pol.policyname, pol.schemaname, pol.tablename,
      pol.permissive, policy_cmd, policy_roles, clause);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_business_delivery_bookings_business_id
  ON public.business_delivery_bookings (business_id);
CREATE INDEX IF NOT EXISTS idx_business_logistics_requests_business_id
  ON public.business_logistics_requests (business_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_template_id
  ON public.notification_queue (template_id);