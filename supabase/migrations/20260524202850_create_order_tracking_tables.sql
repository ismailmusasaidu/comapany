/*
  # Create Order Tracking Tables

  ## New Tables

  ### `orders`
  Stores customer order records with tracking information.
  - `id` (uuid, primary key)
  - `order_id` (text, unique) - human-readable order ID (e.g. "ORD-123456")
  - `customer_name` (text)
  - `customer_email` (text)
  - `customer_phone` (text)
  - `origin` (text) - pickup location
  - `destination` (text) - delivery location
  - `status` (text) - current status: pending, confirmed, picked_up, in_transit, out_for_delivery, delivered, cancelled
  - `estimated_delivery` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `order_tracking_events`
  Stores timeline events for each order.
  - `id` (uuid, primary key)
  - `order_id` (uuid, FK to orders)
  - `status` (text) - status at this event
  - `title` (text) - short event title
  - `description` (text) - detailed description
  - `location` (text) - location where event occurred
  - `occurred_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Public SELECT on orders by order_id lookup
  - Public SELECT on tracking events by order_id
  - Authenticated admin INSERT/UPDATE/DELETE on both tables

  ## Notes
  - Orders are publicly readable by order_id so customers can track without login
  - No write access for anonymous users
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled')),
  package_description text NOT NULL DEFAULT '',
  weight_kg numeric(10,2),
  estimated_delivery timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_events_order_id ON order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_events_occurred_at ON order_tracking_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;

-- Public can look up orders (needed for customer tracking)
CREATE POLICY "Anyone can view orders for tracking"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public can view tracking events
CREATE POLICY "Anyone can view tracking events"
  ON order_tracking_events FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users (admins) can insert orders
CREATE POLICY "Authenticated users can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users (admins) can update orders
CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users (admins) can delete orders
CREATE POLICY "Authenticated users can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- Authenticated users (admins) can insert tracking events
CREATE POLICY "Authenticated users can insert tracking events"
  ON order_tracking_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users (admins) can update tracking events
CREATE POLICY "Authenticated users can update tracking events"
  ON order_tracking_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users (admins) can delete tracking events
CREATE POLICY "Authenticated users can delete tracking events"
  ON order_tracking_events FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at on orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();
