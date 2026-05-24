/*
  # Seed Sample Order Data

  Creates realistic sample orders with tracking events so the customer
  tracking page has demo data to display immediately.

  ## Sample Orders
  - ORD-2024001: In transit order with full event history
  - ORD-2024002: Delivered order with complete history
  - ORD-2024003: Pending/just confirmed order
*/

-- Insert sample orders
INSERT INTO orders (order_id, customer_name, customer_email, customer_phone, origin, destination, status, package_description, weight_kg, estimated_delivery)
VALUES
  (
    'ORD-2024001',
    'Ahmed Al-Rashidi',
    'ahmed@example.com',
    '+971 50 123 4567',
    'Dubai Logistics Hub, Al Quoz',
    'Abu Dhabi, Khalidiyah District',
    'in_transit',
    'Electronics - Laptop & Accessories',
    2.5,
    now() + interval '1 day'
  ),
  (
    'ORD-2024002',
    'Sara Mohammed',
    'sara@example.com',
    '+971 55 987 6543',
    'Sharjah Warehouse, Industrial Area',
    'Dubai Marina, Tower 14',
    'delivered',
    'Clothing & Fashion Items',
    1.2,
    now() - interval '2 hours'
  ),
  (
    'ORD-2024003',
    'Khalid Ibrahim',
    'khalid@example.com',
    '+971 52 456 7890',
    'Ajman Free Zone',
    'Ras Al Khaimah, Al Nakheel',
    'confirmed',
    'Home Appliances - Small Kitchen Items',
    4.8,
    now() + interval '3 days'
  )
ON CONFLICT (order_id) DO NOTHING;

-- Insert tracking events for ORD-2024001 (in_transit)
INSERT INTO order_tracking_events (order_id, status, title, description, location, occurred_at)
SELECT
  o.id,
  events.status,
  events.title,
  events.description,
  events.location,
  events.occurred_at
FROM orders o
CROSS JOIN (
  VALUES
    ('pending', 'Order Placed', 'Your order has been successfully placed and payment confirmed.', 'Online', now() - interval '2 days'),
    ('confirmed', 'Order Confirmed', 'Our team has reviewed and confirmed your order for processing.', 'Dubai Logistics Hub, Al Quoz', now() - interval '1 day 18 hours'),
    ('picked_up', 'Package Picked Up', 'Package has been collected from the sender and checked in at our facility.', 'Dubai Logistics Hub, Al Quoz', now() - interval '1 day 10 hours'),
    ('in_transit', 'In Transit', 'Your package is on its way to the destination city sorting center.', 'Dubai - Abu Dhabi Highway', now() - interval '4 hours')
) AS events(status, title, description, location, occurred_at)
WHERE o.order_id = 'ORD-2024001'
ON CONFLICT DO NOTHING;

-- Insert tracking events for ORD-2024002 (delivered)
INSERT INTO order_tracking_events (order_id, status, title, description, location, occurred_at)
SELECT
  o.id,
  events.status,
  events.title,
  events.description,
  events.location,
  events.occurred_at
FROM orders o
CROSS JOIN (
  VALUES
    ('pending', 'Order Placed', 'Your order has been successfully placed and payment confirmed.', 'Online', now() - interval '4 days'),
    ('confirmed', 'Order Confirmed', 'Our team has reviewed and confirmed your order for processing.', 'Sharjah Warehouse, Industrial Area', now() - interval '3 days 20 hours'),
    ('picked_up', 'Package Picked Up', 'Package collected from sender location.', 'Sharjah Warehouse, Industrial Area', now() - interval '3 days 8 hours'),
    ('in_transit', 'In Transit', 'Package en route to Dubai sorting facility.', 'Sharjah - Dubai Border', now() - interval '2 days 12 hours'),
    ('out_for_delivery', 'Out for Delivery', 'Package is with our delivery driver and will arrive today.', 'Dubai Marina Delivery Hub', now() - interval '5 hours'),
    ('delivered', 'Delivered', 'Package successfully delivered. Received by: S. Mohammed.', 'Dubai Marina, Tower 14', now() - interval '2 hours')
) AS events(status, title, description, location, occurred_at)
WHERE o.order_id = 'ORD-2024002'
ON CONFLICT DO NOTHING;

-- Insert tracking events for ORD-2024003 (confirmed)
INSERT INTO order_tracking_events (order_id, status, title, description, location, occurred_at)
SELECT
  o.id,
  events.status,
  events.title,
  events.description,
  events.location,
  events.occurred_at
FROM orders o
CROSS JOIN (
  VALUES
    ('pending', 'Order Placed', 'Your order has been successfully placed and payment confirmed.', 'Online', now() - interval '6 hours'),
    ('confirmed', 'Order Confirmed', 'Our team has reviewed and confirmed your order. Pickup scheduled for tomorrow.', 'Ajman Free Zone', now() - interval '2 hours')
) AS events(status, title, description, location, occurred_at)
WHERE o.order_id = 'ORD-2024003'
ON CONFLICT DO NOTHING;
