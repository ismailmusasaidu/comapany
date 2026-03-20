/*
  # Create Remaining Content Management Tables

  1. Ensures all content tables exist with proper RLS policies
  2. Updates policies for all tables to use consistent naming
  3. Tables covered: hero_section, services, team_members, partners, gallery_items,
     contact_info, about_section, marketplace_hero, marketplace_categories,
     marketplace_featured_products, marketplace_partners
*/

DROP POLICY IF EXISTS "Anyone can view hero section" ON hero_section;
CREATE POLICY "Anyone can view hero section"
  ON hero_section FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can update hero section" ON hero_section;
CREATE POLICY "Authenticated users can update hero section"
  ON hero_section FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert hero section" ON hero_section;
CREATE POLICY "Authenticated users can insert hero section"
  ON hero_section FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services"
  ON services FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage services" ON services;
CREATE POLICY "Authenticated users can manage services"
  ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view team members" ON team_members;
CREATE POLICY "Anyone can view team members"
  ON team_members FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage team members" ON team_members;
CREATE POLICY "Authenticated users can manage team members"
  ON team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view partners" ON partners;
CREATE POLICY "Anyone can view partners"
  ON partners FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage partners" ON partners;
CREATE POLICY "Authenticated users can manage partners"
  ON partners FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view gallery items" ON gallery_items;
CREATE POLICY "Anyone can view gallery items"
  ON gallery_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage gallery items" ON gallery_items;
CREATE POLICY "Authenticated users can manage gallery items"
  ON gallery_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view contact info" ON contact_info;
CREATE POLICY "Anyone can view contact info"
  ON contact_info FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can update contact info" ON contact_info;
CREATE POLICY "Authenticated users can update contact info"
  ON contact_info FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert contact info" ON contact_info;
CREATE POLICY "Authenticated users can insert contact info"
  ON contact_info FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view about section" ON about_section;
CREATE POLICY "Anyone can view about section"
  ON about_section FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can update about section" ON about_section;
CREATE POLICY "Authenticated users can update about section"
  ON about_section FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert about section" ON about_section;
CREATE POLICY "Authenticated users can insert about section"
  ON about_section FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view marketplace hero" ON marketplace_hero;
CREATE POLICY "Anyone can view marketplace hero"
  ON marketplace_hero FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can update marketplace hero" ON marketplace_hero;
CREATE POLICY "Authenticated users can update marketplace hero"
  ON marketplace_hero FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert marketplace hero" ON marketplace_hero;
CREATE POLICY "Authenticated users can insert marketplace hero"
  ON marketplace_hero FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view marketplace categories" ON marketplace_categories;
CREATE POLICY "Anyone can view marketplace categories"
  ON marketplace_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage marketplace categories" ON marketplace_categories;
CREATE POLICY "Authenticated users can manage marketplace categories"
  ON marketplace_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view marketplace featured products" ON marketplace_featured_products;
CREATE POLICY "Anyone can view marketplace featured products"
  ON marketplace_featured_products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage marketplace featured products" ON marketplace_featured_products;
CREATE POLICY "Authenticated users can manage marketplace featured products"
  ON marketplace_featured_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view marketplace partners" ON marketplace_partners;
CREATE POLICY "Anyone can view marketplace partners"
  ON marketplace_partners FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage marketplace partners" ON marketplace_partners;
CREATE POLICY "Authenticated users can manage marketplace partners"
  ON marketplace_partners FOR ALL TO authenticated USING (true) WITH CHECK (true);
