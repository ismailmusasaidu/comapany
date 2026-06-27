/*
# Add Status Change Notification Triggers

## Purpose
Automatically send SMS and email notifications to customers/recipients whenever
a delivery or order status changes.

## Changes

### Extensions
- Enables `pg_net` extension for async HTTP requests from the database.

### New Functions
1. `notify_booking_status_change()` — fires on `delivery_bookings` and
   `business_delivery_bookings` status updates. Sends an async HTTP POST to
   the `notify-status-change` edge function with recipient and sender contact
   details plus a human-readable status message.

2. `notify_order_status_change()` — fires on `orders` status updates. Sends
   customer phone and email to the same edge function.

### New Triggers
- `trg_delivery_booking_notify` on `delivery_bookings` AFTER UPDATE
- `trg_business_booking_notify` on `business_delivery_bookings` AFTER UPDATE
- `trg_order_notify` on `orders` AFTER UPDATE

## Security Notes
- Functions run with SECURITY DEFINER so pg_net can be called regardless of
  the calling role's permissions.
- Only fires when `status` actually changes (OLD.status IS DISTINCT FROM NEW.status).
- Notifications are skipped for the initial `pending` status (no action needed).
*/

-- Enable pg_net for async HTTP from triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ── Booking trigger function (delivery_bookings + business_delivery_bookings) ──

CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_msg   text;
  v_payload jsonb;
BEGIN
  -- Only fire when status actually changed and isn't the initial pending
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

  -- Skip statuses with no notification (e.g. pending → pending)
  IF v_msg IS NULL THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'booking_ref',    NEW.booking_ref,
    'old_status',     OLD.status,
    'new_status',     NEW.status,
    'recipient_name', COALESCE(NEW.recipient_name, ''),
    'recipient_phone',COALESCE(NEW.recipient_phone, ''),
    'sender_phone',   COALESCE(NEW.sender_phone, ''),
    'delivery_city',  COALESCE(NEW.delivery_city, ''),
    'message',        v_msg
  );

  PERFORM extensions.pg_net.http_post(
    url     := 'https://rxxufrcvyurzkfnpknlw.supabase.co/functions/v1/notify-status-change',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eHVmcmN2eXVyemtmbnBrbmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjk0NTEsImV4cCI6MjA4OTYwNTQ1MX0.Onav3i3ykJwV-H9CfR8ly6zZ1elyTJhzwnlKHW5lG2k'
    ),
    body    := v_payload
  );

  RETURN NEW;
END;
$$;

-- ── Order trigger function (orders table) ──────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  PERFORM extensions.pg_net.http_post(
    url     := 'https://rxxufrcvyurzkfnpknlw.supabase.co/functions/v1/notify-status-change',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eHVmcmN2eXVyemtmbnBrbmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjk0NTEsImV4cCI6MjA4OTYwNTQ1MX0.Onav3i3ykJwV-H9CfR8ly6zZ1elyTJhzwnlKHW5lG2k'
    ),
    body    := v_payload
  );

  RETURN NEW;
END;
$$;

-- ── Attach triggers ────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_delivery_booking_notify ON delivery_bookings;
CREATE TRIGGER trg_delivery_booking_notify
  AFTER UPDATE OF status ON delivery_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status_change();

DROP TRIGGER IF EXISTS trg_business_booking_notify ON business_delivery_bookings;
CREATE TRIGGER trg_business_booking_notify
  AFTER UPDATE OF status ON business_delivery_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status_change();

DROP TRIGGER IF EXISTS trg_order_notify ON orders;
CREATE TRIGGER trg_order_notify
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();
