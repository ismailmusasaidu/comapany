/*
  # Migrate Marketplace Gallery to Database

  1. Insert Sample Gallery Items
    - Product categories from the marketplace page
    - Featured products with details
    
  2. Important Notes
    - This migration adds the existing hardcoded gallery items to the database
    - These items can now be managed through the admin dashboard
    - Images are from Pexels (free stock photos)
*/

INSERT INTO gallery_items (title, description, image_url, category, order_index) VALUES
  ('Electronics', 'Latest gadgets & devices', 'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=800', 'category', 0),
  ('Fashion', 'Trendy clothing & accessories', 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800', 'category', 1),
  ('Home & Living', 'Quality furniture & decor', 'https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg?auto=compress&cs=tinysrgb&w=800', 'category', 2),
  ('Beauty & Health', 'Premium care products', 'https://images.pexels.com/photos/2292953/pexels-photo-2292953.jpeg?auto=compress&cs=tinysrgb&w=800', 'category', 3),
  ('Premium Wireless Headphones', 'High-quality sound with noise cancellation', 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600', 'featured', 4),
  ('Fitness Smart Watch', 'Track your health and fitness goals', 'https://images.pexels.com/photos/1805053/pexels-photo-1805053.jpeg?auto=compress&cs=tinysrgb&w=600', 'featured', 5),
  ('Professional DSLR Camera', 'Capture stunning photos and videos', 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=600', 'featured', 6)
ON CONFLICT DO NOTHING;
