/*
  # Seed Initial Content Data

  1. Data Seeding
    - Insert hero section data
    - Insert services data
    - Insert team members data
    - Insert partners data
    - Insert contact info
    - Insert about section
    - Insert marketplace hero
    - Insert marketplace categories

  Note: This migration seeds initial data for all content sections.
*/

DO $$
BEGIN
  -- Seed hero_section (only if empty)
  IF NOT EXISTS (SELECT 1 FROM hero_section) THEN
    INSERT INTO hero_section (title, subtitle, cta_button_text, cta_button_link)
    VALUES (
      'Seamless Logistics & Marketplace Solutions',
      'Experience excellence in delivery services and discover quality products in one unified platform. Danhausa connects your business to endless possibilities.',
      'Explore Services',
      '#logistics'
    );
  END IF;

  -- Seed services (only if empty)
  IF NOT EXISTS (SELECT 1 FROM services) THEN
    INSERT INTO services (title, description, icon, order_index) VALUES
    ('Express Shipping', 'Lightning-fast delivery for time-sensitive packages with real-time tracking.', 'truck', 0),
    ('Freight Services', 'Comprehensive freight solutions for businesses of all sizes and industries.', 'package', 1),
    ('Scheduled Delivery', 'Plan your deliveries in advance with our flexible scheduling options.', 'clock', 2),
    ('B2B Solutions', 'Tailored logistics solutions for enterprise and corporate clients.', 'users', 3);
  END IF;

  -- Seed team_members (only if empty)
  IF NOT EXISTS (SELECT 1 FROM team_members) THEN
    INSERT INTO team_members (name, position, bio, image_url, order_index) VALUES
    ('Aminu Hassan', 'Chief Executive Officer', 'Visionary leader with 15+ years in logistics and supply chain management.', '', 0),
    ('Zainab Abubakar', 'Chief Operations Officer', 'Operations expert ensuring seamless delivery and customer satisfaction.', '', 1),
    ('Kafayat Mohammed', 'Head of Marketplace', 'E-commerce specialist driving our marketplace growth and vendor partnerships.', '', 2),
    ('Ahmed Ibrahim', 'Customer Success Manager', 'Dedicated professional ensuring every customer receives exceptional service.', '', 3);
  END IF;

  -- Seed partners (only if empty)
  IF NOT EXISTS (SELECT 1 FROM partners) THEN
    INSERT INTO partners (name, logo_url, website_url, description, order_index) VALUES
    ('Nile Trading', '', 'https://example.com', 'Leading trade company', 0),
    ('Sahara Commerce', '', 'https://example.com', 'Commerce partner', 1),
    ('Desert Logistics', '', 'https://example.com', 'Logistics provider', 2),
    ('Oasis Distribution', '', 'https://example.com', 'Distribution network', 3),
    ('Dune Express', '', 'https://example.com', 'Express services', 4);
  END IF;

  -- Seed contact_info (only if empty)
  IF NOT EXISTS (SELECT 1 FROM contact_info) THEN
    INSERT INTO contact_info (email, phone, address, hours)
    VALUES (
      'info@danhausa.com',
      '+234 (0) 123 456 7890',
      '123 Business District, Nigeria',
      'Mon-Fri: 9AM-6PM'
    );
  END IF;

  -- Seed about_section (only if empty)
  IF NOT EXISTS (SELECT 1 FROM about_section) THEN
    INSERT INTO about_section (title, description, mission, vision)
    VALUES (
      'Why Choose Danhausa?',
      'We combine decades of logistics expertise with modern marketplace technology.',
      'To be the most trusted logistics and marketplace provider in Africa.',
      'To revolutionize commerce through seamless delivery and quality marketplace solutions.'
    );
  END IF;

  -- Seed marketplace_hero (only if empty)
  IF NOT EXISTS (SELECT 1 FROM marketplace_hero) THEN
    INSERT INTO marketplace_hero (title, subtitle, download_url)
    VALUES (
      'Shop Smart, Shop Danhausa',
      'Your trusted online marketplace for quality products at unbeatable prices.',
      'https://play.google.com/store'
    );
  END IF;

  -- Seed marketplace_categories (only if empty)
  IF NOT EXISTS (SELECT 1 FROM marketplace_categories) THEN
    INSERT INTO marketplace_categories (title, description, image_url, order_index) VALUES
    ('Electronics', 'Latest gadgets and technology products', '', 0),
    ('Fashion', 'Trendy clothing and accessories', '', 1),
    ('Home & Garden', 'Everything for your home', '', 2),
    ('Sports & Outdoors', 'Sports equipment and outdoor gear', '', 3);
  END IF;

  -- Seed marketplace_featured_products (only if empty)
  IF NOT EXISTS (SELECT 1 FROM marketplace_featured_products) THEN
    INSERT INTO marketplace_featured_products (title, description, image_url, rating, order_index) VALUES
    ('Premium Smartphone', 'Latest generation smartphone with advanced features', '', 5.0, 0),
    ('Wireless Headphones', 'High-quality sound with noise cancellation', '', 4.8, 1),
    ('Smart Watch', 'Stay connected with our latest smartwatch', '', 4.9, 2),
    ('Laptop Stand', 'Ergonomic stand for improved productivity', '', 4.7, 3);
  END IF;

  -- Seed marketplace_partners (only if empty)
  IF NOT EXISTS (SELECT 1 FROM marketplace_partners) THEN
    INSERT INTO marketplace_partners (name, logo_url, order_index) VALUES
    ('TechCorp', '', 0),
    ('Fashion Hub', '', 1),
    ('Home Essentials', '', 2),
    ('Sports World', '', 3);
  END IF;
END $$;
