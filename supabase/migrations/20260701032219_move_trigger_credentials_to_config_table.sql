-- Create a config table to hold sensitive runtime values
-- so trigger functions never need hardcoded credentials in source.
CREATE TABLE IF NOT EXISTS app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Only the service role (backend/triggers) can access this table
CREATE POLICY "service_role_select" ON app_config
  FOR SELECT TO service_role USING (true);

CREATE POLICY "service_role_insert" ON app_config
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_role_update" ON app_config
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_delete" ON app_config
  FOR DELETE TO service_role USING (true);

-- Rewrite trigger functions to read URL and token from app_config
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_msg        text;
  v_payload    jsonb;
  v_notify_url text;
  v_token      text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_msg := CASE NEW.status
    WHEN 'confirmed'        THEN 'Good news! Your delivery ' || NEW.booking_ref || ' has been confirmed and is being prepared for pickup.'
    WHEN 'picked_up'        THEN 'Your package (' || NEW.booking_ref || ') has been picked up! We are heading to ' || COALESCE(NEW.delivery_city, 'the destination') || '.'
    WHEN 'in_transit'       THEN 'Your package (' || NEW.booking_ref || ') is in transit to ' || COALESCE(NEW.delivery_city, 'the destination') || '. We will keep you updated.'
    WHEN 'out_for_delivery' THEN 'Your package (' || NEW.booking_ref || ') is out for delivery. Expect it today!'
    WHEN 'delivered'        THEN 'Your package (' || NEW.booking_ref || ') has been delivered successfully. Thank you for choosing Danhausa!'
    WHEN 'cancelled'        THEN 'Your booking ' || NEW.booking_ref || ' has been cancelled. Contact us if you need assistance.'
    ELSE NULL
  END;

  IF v_msg IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT value INTO v_notify_url FROM app_config WHERE key = 'notify_url';
  SELECT value INTO v_token      FROM app_config WHERE key = 'notify_token';

  IF v_notify_url IS NULL OR v_token IS NULL THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'booking_ref',     NEW.booking_ref,
    'old_status',      OLD.status,
    'new_status',      NEW.status,
    'recipient_name',  COALESCE(NEW.recipient_name, ''),
    'recipient_phone', COALESCE(NEW.recipient_phone, ''),
    'sender_phone',    COALESCE(NEW.sender_phone, ''),
    'delivery_city',   COALESCE(NEW.delivery_city, ''),
    'message',         v_msg
  );

  PERFORM extensions.pg_net.http_post(
    url     := v_notify_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body    := v_payload
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_msg        text;
  v_payload    jsonb;
  v_notify_url text;
  v_token      text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_msg := CASE NEW.status
    WHEN 'confirmed'        THEN 'Good news! Your order ' || NEW.order_id || ' has been confirmed.'
    WHEN 'picked_up'        THEN 'Your package (' || NEW.order_id || ') has been picked up and is on its way.'
    WHEN 'in_transit'       THEN 'Your package (' || NEW.order_id || ') is in transit to ' || COALESCE(NEW.destination, 'your address') || '.'
    WHEN 'out_for_delivery' THEN 'Your package (' || NEW.order_id || ') is out for delivery. Expect it today!'
    WHEN 'delivered'        THEN 'Your package (' || NEW.order_id || ') has been delivered. Thank you for choosing Danhausa!'
    WHEN 'cancelled'        THEN 'Your order ' || NEW.order_id || ' has been cancelled. Contact us if you need assistance.'
    ELSE NULL
  END;

  IF v_msg IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT value INTO v_notify_url FROM app_config WHERE key = 'notify_url';
  SELECT value INTO v_token      FROM app_config WHERE key = 'notify_token';

  IF v_notify_url IS NULL OR v_token IS NULL THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'order_id',       NEW.order_id,
    'old_status',     OLD.status,
    'new_status',     NEW.status,
    'customer_name',  COALESCE(NEW.customer_name, ''),
    'customer_phone', COALESCE(NEW.customer_phone, ''),
    'customer_email', COALESCE(NEW.customer_email, ''),
    'message',        v_msg
  );

  PERFORM extensions.pg_net.http_post(
    url     := v_notify_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body    := v_payload
  );

  RETURN NEW;
END;
$$;
