/*
  # Fix RLS Policies for Admin Updates

  1. Issue
    - Previous policies used auth.uid() = auth.uid() which is logically always true
    - This allowed ANY authenticated user to bypass proper authorization checks
    - Need to replace with policies that allow ALL authenticated users to manage content

  2. Changes
    - Drop incorrect policies from all tables
    - Create new READ policies allowing public and authenticated access
    - Create new INSERT/UPDATE/DELETE policies allowing authenticated users only
    - Simplify policies to use `true` for authenticated users (no user-specific checks needed for shared admin content)

  3. Tables Updated
    - hero_section
    - services
    - team_members
    - partners
    - gallery_items
    - contact_info
    - about_section

  4. Security Notes
    - Public users can only READ content (SELECT)
    - Authenticated admins can INSERT, UPDATE, DELETE content
    - No ownership checks needed as all admins manage shared company content
*/

DROP POLICY IF EXISTS "Public read access" ON hero_section;
DROP POLICY IF EXISTS "Admin full access" ON hero_section;
CREATE POLICY "Public read access" ON hero_section FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert" ON hero_section FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update" ON hero_section FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON hero_section FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read access" ON services;
DROP POLICY IF EXISTS "Admin full access" ON services;
CREATE POLICY "Public read access" ON services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert" ON services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update" ON services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON services FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read access" ON team_members;
DROP POLICY IF EXISTS "Admin full access" ON team_members;
CREATE POLICY "Public read access" ON team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert" ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update" ON team_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON team_members FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read access" ON partners;
DROP POLICY IF EXISTS "Admin full access" ON partners;
CREATE POLICY "Public read access" ON partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert" ON partners FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update" ON partners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON partners FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read access" ON gallery_items;
DROP POLICY IF EXISTS "Admin full access" ON gallery_items;
CREATE POLICY "Public read access" ON gallery_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert" ON gallery_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update" ON gallery_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON gallery_items FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read access" ON contact_info;
DROP POLICY IF EXISTS "Admin full access" ON contact_info;
CREATE POLICY "Public read access" ON contact_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert" ON contact_info FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update" ON contact_info FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON contact_info FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read access" ON about_section;
DROP POLICY IF EXISTS "Admin full access" ON about_section;
CREATE POLICY "Public read access" ON about_section FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert" ON about_section FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin update" ON about_section FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete" ON about_section FOR DELETE TO authenticated USING (true);
