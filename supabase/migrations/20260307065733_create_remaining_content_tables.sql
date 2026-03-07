/*
  # Create Remaining Content Management Tables

  1. New Tables
    - `hero_section` - Already exists
    - `services` - Already exists
    - `team_members` - Already exists
    - `partners` - Already exists
    - `gallery_items` - Already exists
    - `contact_info` - Already exists
    - `about_section` - Already exists
    - `marketplace_hero` - Already exists
    - `marketplace_categories` - Already exists
    - `marketplace_featured_products` - Already exists
    - `marketplace_partners` - Already exists

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin updates

  Note: This migration ensures all tables exist and have proper RLS policies
*/

-- Hero Section
CREATE TABLE IF NOT EXISTS hero_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT 'Seamless Logistics & Marketplace Solutions',
  subtitle text DEFAULT 'Experience excellence in delivery services and discover quality products in one unified platform.',
  cta_button_text text DEFAULT 'Explore Services',
  cta_button_link text DEFAULT '#logistics',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view hero section" ON hero_section;
CREATE POLICY "Anyone can view hero section"
  ON hero_section FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update hero section" ON hero_section;
CREATE POLICY "Authenticated users can update hero section"
  ON hero_section FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert hero section" ON hero_section;
CREATE POLICY "Authenticated users can insert hero section"
  ON hero_section FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  icon text DEFAULT 'package',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage services" ON services;
CREATE POLICY "Authenticated users can manage services"
  ON services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  position text DEFAULT '',
  bio text DEFAULT '',
  image_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view team members" ON team_members;
CREATE POLICY "Anyone can view team members"
  ON team_members FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage team members" ON team_members;
CREATE POLICY "Authenticated users can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Partners
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text DEFAULT '',
  website_url text DEFAULT '',
  description text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view partners" ON partners;
CREATE POLICY "Anyone can view partners"
  ON partners FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage partners" ON partners;
CREATE POLICY "Authenticated users can manage partners"
  ON partners FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Gallery Items
CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  image_url text DEFAULT '',
  category text DEFAULT 'general',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view gallery items" ON gallery_items;
CREATE POLICY "Anyone can view gallery items"
  ON gallery_items FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage gallery items" ON gallery_items;
CREATE POLICY "Authenticated users can manage gallery items"
  ON gallery_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contact Info
CREATE TABLE IF NOT EXISTS contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text DEFAULT 'info@danhausa.com',
  phone text DEFAULT '+234 (0) 123 456 7890',
  address text DEFAULT '123 Business District, Nigeria',
  hours text DEFAULT 'Mon-Fri: 9AM-6PM',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view contact info" ON contact_info;
CREATE POLICY "Anyone can view contact info"
  ON contact_info FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update contact info" ON contact_info;
CREATE POLICY "Authenticated users can update contact info"
  ON contact_info FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert contact info" ON contact_info;
CREATE POLICY "Authenticated users can insert contact info"
  ON contact_info FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- About Section
CREATE TABLE IF NOT EXISTS about_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT 'Why Choose Danhausa?',
  description text DEFAULT 'We combine decades of logistics expertise with modern marketplace technology.',
  mission text DEFAULT '',
  vision text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE about_section ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view about section" ON about_section;
CREATE POLICY "Anyone can view about section"
  ON about_section FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update about section" ON about_section;
CREATE POLICY "Authenticated users can update about section"
  ON about_section FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert about section" ON about_section;
CREATE POLICY "Authenticated users can insert about section"
  ON about_section FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Marketplace Hero
CREATE TABLE IF NOT EXISTS marketplace_hero (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT 'Shop Smart, Shop Danhausa',
  subtitle text DEFAULT 'Your trusted online marketplace for quality products at unbeatable prices.',
  download_url text DEFAULT 'https://play.google.com/store',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_hero ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view marketplace hero" ON marketplace_hero;
CREATE POLICY "Anyone can view marketplace hero"
  ON marketplace_hero FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update marketplace hero" ON marketplace_hero;
CREATE POLICY "Authenticated users can update marketplace hero"
  ON marketplace_hero FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert marketplace hero" ON marketplace_hero;
CREATE POLICY "Authenticated users can insert marketplace hero"
  ON marketplace_hero FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Marketplace Categories
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  image_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view marketplace categories" ON marketplace_categories;
CREATE POLICY "Anyone can view marketplace categories"
  ON marketplace_categories FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage marketplace categories" ON marketplace_categories;
CREATE POLICY "Authenticated users can manage marketplace categories"
  ON marketplace_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Marketplace Featured Products
CREATE TABLE IF NOT EXISTS marketplace_featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  image_url text DEFAULT '',
  rating numeric DEFAULT 5.0,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_featured_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view marketplace featured products" ON marketplace_featured_products;
CREATE POLICY "Anyone can view marketplace featured products"
  ON marketplace_featured_products FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage marketplace featured products" ON marketplace_featured_products;
CREATE POLICY "Authenticated users can manage marketplace featured products"
  ON marketplace_featured_products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Marketplace Partners
CREATE TABLE IF NOT EXISTS marketplace_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view marketplace partners" ON marketplace_partners;
CREATE POLICY "Anyone can view marketplace partners"
  ON marketplace_partners FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage marketplace partners" ON marketplace_partners;
CREATE POLICY "Authenticated users can manage marketplace partners"
  ON marketplace_partners FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
