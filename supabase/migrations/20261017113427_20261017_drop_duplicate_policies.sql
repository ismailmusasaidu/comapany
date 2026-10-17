/*
# Remove exactly-duplicated row security policies

1. Summary
   The performance scan flagged 73 tables with overlapping permissive
   policies. Most overlaps are intentional (e.g. "admins see all" + "owners
   see own"), but 13 pairs are byte-for-byte identical rules created twice
   under different names. Postgres evaluates every permissive policy, so
   duplicates double the check cost for no benefit.

2. Changes
   - Drop the redundant member of each identical pair, keeping one:
     * about_section insert/update (keep "Admin insert"/"Admin update")
     * contact_info insert/update (keep "Admin insert"/"Admin update")
     * hero_section insert/update (keep "Admin insert"/"Admin update")
     * marketplace_categories ALL (keep "Authenticated users can manage ...")
     * marketplace_featured_products ALL (keep "Authenticated users can manage ...")
     * marketplace_hero insert/update (keep "Authenticated users can ...")
     * marketplace_partners ALL (keep "Authenticated users can manage ...")
     * rider_profiles select ("rider_select_own"), update own
       ("rider_update_own"), and update-all ("update_own_rider_profile")

3. Security impact
   None — the remaining policy grants exactly the same access.

4. Notes
   - Dropping a policy that does not exist is a no-op (IF EXISTS / guarded).
*/

DROP POLICY IF EXISTS "Authenticated users can insert about section" ON public.about_section;
DROP POLICY IF EXISTS "Authenticated users can update about section" ON public.about_section;
DROP POLICY IF EXISTS "Authenticated users can insert contact info" ON public.contact_info;
DROP POLICY IF EXISTS "Authenticated users can update contact info" ON public.contact_info;
DROP POLICY IF EXISTS "Authenticated users can insert hero section" ON public.hero_section;
DROP POLICY IF EXISTS "Authenticated users can update hero section" ON public.hero_section;
DROP POLICY IF EXISTS "Allow authenticated users to manage marketplace categories" ON public.marketplace_categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert marketplace hero" ON public.marketplace_hero;
DROP POLICY IF EXISTS "Allow authenticated users to update marketplace hero" ON public.marketplace_hero;
DROP POLICY IF EXISTS "Allow authenticated users to manage marketplace partners" ON public.marketplace_partners;
DROP POLICY IF EXISTS "rider_select_own" ON public.rider_profiles;
DROP POLICY IF EXISTS "rider_update_own" ON public.rider_profiles;
DROP POLICY IF EXISTS "update_own_rider_profile" ON public.rider_profiles;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'marketplace_featured_products'
      AND policyname LIKE 'Allow authenticated users to manage marketplace featured products%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.marketplace_featured_products', pol.policyname);
  END LOOP;
END $$;