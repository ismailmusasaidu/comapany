
-- Fix notify_booking_status_change: use correct net.http_post schema and
-- wrap in exception handler so a notification failure never rolls back a status update.

CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  v_msg    text;
  v_payload jsonb;
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

  BEGIN
    PERFORM net.http_post(
      url     := 'https://rxxufrcvyurzkfnpknlw.supabase.co/functions/v1/notify-status-change',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eHVmcmN2eXVyemtmbnBrbmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjk0NTEsImV4cCI6MjA4OTYwNTQ1MX0.Onav3i3ykJwV-H9CfR8ly6zZ1elyTJhzwnlKHW5lG2k'
      ),
      body    := v_payload
    );
  EXCEPTION WHEN OTHERS THEN
    -- Notification failure must never roll back the status update
    NULL;
  END;

  RETURN NEW;
END;
$$;

-- Fix notify_order_status_change with the same corrections

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  v_msg     text;
  v_payload jsonb;
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

  v_payload := jsonb_build_object(
    'order_id',       NEW.order_id,
    'old_status',     OLD.status,
    'new_status',     NEW.status,
    'customer_name',  COALESCE(NEW.customer_name, ''),
    'customer_phone', COALESCE(NEW.customer_phone, ''),
    'customer_email', COALESCE(NEW.customer_email, ''),
    'message',        v_msg
  );

  BEGIN
    PERFORM net.http_post(
      url     := 'https://rxxufrcvyurzkfnpknlw.supabase.co/functions/v1/notify-status-change',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eHVmcmN2eXVyemtmbnBrbmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjk0NTEsImV4cCI6MjA4OTYwNTQ1MX0.Onav3i3ykJwV-H9CfR8ly6zZ1elyTJhzwnlKHW5lG2k'
      ),
      body    := v_payload
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;
