/*
  # Create Marketplace Content Management Tables

  1. New Tables
    - `marketplace_categories`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `order_index` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `marketplace_featured_products`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `image_url` (text)
      - `rating` (numeric, default 5)
      - `order_index` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `marketplace_partners`
      - `id` (uuid, primary key)
      - `name` (text)
      - `logo_url` (text)
      - `order_index` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `marketplace_hero`
      - `id` (uuid, primary key)
      - `title` (text)
      - `subtitle` (text)
      - `download_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin access (SELECT, INSERT, UPDATE, DELETE)
    - Add policies for public read access (SELECT only)
*/

CREATE TABLE IF NOT EXISTS marketplace_hero (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT 'Shop Smart, Shop Danhausa',
  subtitle text DEFAULT 'Your trusted online marketplace for quality products at unbeatable prices.',
  download_url text DEFAULT 'https://play.google.com/store',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_hero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to marketplace hero"
  ON marketplace_hero
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update marketplace hero"
  ON marketplace_hero
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert marketplace hero"
  ON marketplace_hero
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Category',
  description text DEFAULT '',
  image_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to marketplace categories"
  ON marketplace_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage marketplace categories"
  ON marketplace_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS marketplace_featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Product',
  description text DEFAULT '',
  image_url text DEFAULT '',
  rating numeric DEFAULT 5,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_featured_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to marketplace featured products"
  ON marketplace_featured_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage marketplace featured products"
  ON marketplace_featured_products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS marketplace_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New Partner',
  logo_url text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to marketplace partners"
  ON marketplace_partners
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage marketplace partners"
  ON marketplace_partners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO marketplace_hero (id) 
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM marketplace_hero LIMIT 1);

INSERT INTO marketplace_categories (title, description, image_url, order_index)
VALUES 
  ('Electronics & Gadgets', 'Latest tech and accessories', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800', 0),
  ('Fashion & Apparel', 'Trending styles for everyone', 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800', 1),
  ('Home & Living', 'Everything for your home', 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800', 2),
  ('Beauty & Health', 'Premium beauty products', 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800', 3)
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_featured_products (title, description, image_url, rating, order_index)
VALUES 
  ('Wireless Headphones', 'Premium sound quality with active noise cancellation', 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800', 5, 0),
  ('Smart Watch Pro', 'Track your fitness and stay connected on the go', 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800', 5, 1),
  ('Designer Backpack', 'Stylish and functional for everyday use', 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=800', 5, 2)
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_partners (name, logo_url, order_index)
VALUES 
  ('TechPro', 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600', 0),
  ('StyleHub', 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=600', 1),
  ('HomeNest', 'https://images.pexels.com/photos/1799500/pexels-photo-1799500.jpeg?auto=compress&cs=tinysrgb&w=600', 2),
  ('BeautyGlow', 'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=600', 3),
  ('FitnessMax', 'https://images.pexels.com/photos/1092444/pexels-photo-1092444.jpeg?auto=compress&cs=tinysrgb&w=600', 4),
  ('EcoLife', 'https://images.pexels.com/photos/1308882/pexels-photo-1308882.jpeg?auto=compress&cs=tinysrgb&w=600', 5)
ON CONFLICT DO NOTHING;
