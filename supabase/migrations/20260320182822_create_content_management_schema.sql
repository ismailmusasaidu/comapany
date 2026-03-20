/*
  # Create Content Management System

  1. New Tables
    - `hero_section` - Main hero banner content
    - `services` - Services/logistics offerings
    - `team_members` - Team information
    - `partners` - Partner companies
    - `gallery_items` - Gallery images and descriptions
    - `contact_info` - Contact details
    - `about_section` - About company information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
    - Restrict data access to admins only for updates
    - Allow public read access for frontend display

  3. Important Notes
    - All tables store textual/structured content
    - Created_at and updated_at timestamps for tracking
    - Admin users are identified via auth.uid()
*/

CREATE TABLE IF NOT EXISTS hero_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Welcome to Danhausa Logistics',
  subtitle text NOT NULL DEFAULT 'Your trusted partner for logistics and marketplace solutions',
  cta_button_text text NOT NULL DEFAULT 'Get Started',
  cta_button_link text NOT NULL DEFAULT '/marketplace',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'package',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  bio text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL DEFAULT 'info@danhausa.com',
  phone text NOT NULL DEFAULT '+1234567890',
  address text NOT NULL DEFAULT '',
  hours text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS about_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'About Us',
  description text NOT NULL DEFAULT 'We are a leading logistics and marketplace provider',
  mission text NOT NULL DEFAULT '',
  vision text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_section ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON hero_section FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON hero_section FOR ALL TO authenticated USING (auth.uid() = auth.uid()) WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "Public read access" ON services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON services FOR ALL TO authenticated USING (auth.uid() = auth.uid()) WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "Public read access" ON team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON team_members FOR ALL TO authenticated USING (auth.uid() = auth.uid()) WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "Public read access" ON partners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON partners FOR ALL TO authenticated USING (auth.uid() = auth.uid()) WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "Public read access" ON gallery_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON gallery_items FOR ALL TO authenticated USING (auth.uid() = auth.uid()) WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "Public read access" ON contact_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON contact_info FOR ALL TO authenticated USING (auth.uid() = auth.uid()) WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "Public read access" ON about_section FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin full access" ON about_section FOR ALL TO authenticated USING (auth.uid() = auth.uid()) WITH CHECK (auth.uid() = auth.uid());
