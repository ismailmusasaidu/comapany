/*
  # Seed Gallery Data

  1. Data Seeding
    - Insert gallery items with descriptions
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM gallery_items) THEN
    INSERT INTO gallery_items (title, description, image_url, category, order_index) VALUES
    (
      'Modern Warehouse',
      'State-of-the-art storage facilities equipped with latest technology',
      'https://images.pexels.com/photos/4393426/pexels-photo-4393426.jpeg?auto=compress&cs=tinysrgb&w=800',
      'operations',
      0
    ),
    (
      'Delivery Fleet',
      'Modern vehicles for fast and reliable delivery services',
      'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800',
      'fleet',
      1
    ),
    (
      'Customer Service',
      '24/7 customer support team dedicated to excellence',
      'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800',
      'team',
      2
    );
  END IF;
END $$;
