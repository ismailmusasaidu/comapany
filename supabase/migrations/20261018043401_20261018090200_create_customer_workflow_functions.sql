/*
# Quotation & Booking Workflow — Part 2b: Customer-side functions + expiry (retry)

Same as the previous attempt; the decline function body was corrupted by a
stray fragment last time and has been rewritten cleanly.

1. New Functions (SECURITY DEFINER, all re-verify ownership):
- accept_quotation(p_quotation_id) — owner-only, latest version, 'sent' and not
  expired only; atomic and concurrency-safe; generates booking reference;
  notifies customer + admins.
- request_revision(p_quotation_id, p_message) — owner-only while valid;
  quotation → revision_requested, request back to admin queue, admins notified.
- decline_quotation(p_quotation_id, p_reason) — owner-only while valid;
  quotation → declined, request → declined; preserved for audit.
- expire_quotations() — system job; expires overdue sent quotations,
  updates requests, notifies customer + admins.

2. Security: every function re-checks ownership against auth.uid() and enforces
server-time expiry; declined/expired/superseded quotations cannot be accepted.
*/

CREATE OR REPLACE FUNCTION public.accept_quotation(p_quotation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q record;
  v_prev text;
  v_booking_ref text;
BEGIN
  SELECT * INTO v_q FROM public.quotations WHERE id = p_quotation_id;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  IF v_q.owner_id IS DISTINCT FROM (SELECT auth.uid() AS uid) THEN
    RAISE EXCEPTION 'You can only accept your own quotation';
  END IF;
  IF v_q.status <> 'sent' THEN
    RAISE EXCEPTION 'Only a sent quotation awaiting your decision can be accepted';
  END IF;
  IF v_q.valid_until IS NOT NULL AND v_q.valid_until <= now() THEN
    RAISE EXCEPTION 'This quotation has expired and can no longer be accepted';
  END IF;

  SELECT request_status INTO v_prev FROM public.logistics_requests
    WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  IF v_prev IS NULL THEN
    SELECT request_status INTO v_prev FROM public.business_logistics_requests
      WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';
  END IF;

  v_booking_ref := 'BK-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(clock_timestamp()::text || random()::text), 1, 5));

  UPDATE public.quotations SET status='accepted', accepted_at=now(), updated_at=now()
    WHERE id=p_quotation_id AND status='sent';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quotation is no longer awaiting a decision';
  END IF;

  UPDATE public.logistics_requests SET
    request_status='confirmed', quotation_status='accepted',
    booking_reference=v_booking_ref, confirmed_at=now(), accepted_quotation_id=p_quotation_id,
    updated_at=now()
    WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  UPDATE public.business_logistics_requests SET
    request_status='confirmed', quotation_status='accepted',
    booking_reference=v_booking_ref, confirmed_at=now(), accepted_quotation_id=p_quotation_id,
    updated_at=now()
    WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';

  PERFORM public.insert_in_app_notification(
    v_q.owner_id,
    'Booking Confirmed',
    'Quotation accepted successfully. Your logistics booking is now confirmed. Our team will contact you regarding the next steps.',
    'success',
    '/individual/orders'
  );
  INSERT INTO public.admin_notifications (type, title, message)
  VALUES ('quotation_accepted', 'Quotation Accepted',
    format('Quotation %s was accepted. Booking %s confirmed.', v_q.quotation_ref, v_booking_ref));

  PERFORM public.log_workflow_history(v_q.request_table, v_q.request_id, v_prev, 'confirmed',
    'quotation_accepted', (SELECT auth.uid() AS uid), 'customer', v_q.version_number,
    jsonb_build_object('quotation_ref', v_q.quotation_ref, 'total', v_q.total_amount, 'booking_reference', v_booking_ref));

  RETURN jsonb_build_object('booking_reference', v_booking_ref, 'quotation_ref', v_q.quotation_ref, 'version', v_q.version_number);
END;
$$;

CREATE OR REPLACE FUNCTION public.request_revision(p_quotation_id uuid, p_message text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q record;
  v_prev text;
BEGIN
  SELECT * INTO v_q FROM public.quotations WHERE id = p_quotation_id;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  IF v_q.owner_id IS DISTINCT FROM (SELECT auth.uid() AS uid) THEN
    RAISE EXCEPTION 'You can only request a revision for your own quotation';
  END IF;
  IF v_q.status <> 'sent' THEN
    RAISE EXCEPTION 'Only a sent quotation awaiting your decision can be revised';
  END IF;
  IF v_q.valid_until IS NOT NULL AND v_q.valid_until <= now() THEN
    RAISE EXCEPTION 'This quotation has expired and can no longer be revised';
  END IF;
  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'Please explain the changes you need';
  END IF;

  SELECT request_status INTO v_prev FROM public.logistics_requests
    WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  IF v_prev IS NULL THEN
    SELECT request_status INTO v_prev FROM public.business_logistics_requests
      WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';
  END IF;

  UPDATE public.quotations SET status='revision_requested', updated_at=now()
    WHERE id=p_quotation_id AND status='sent';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quotation is no longer awaiting a decision';
  END IF;

  INSERT INTO public.quotation_revision_requests
    (quotation_id, request_table, request_id, customer_id, message)
  VALUES (p_quotation_id, v_q.request_table, v_q.request_id, v_q.owner_id, p_message);

  UPDATE public.logistics_requests SET request_status='revision_requested', quotation_status='revision_requested', updated_at=now()
    WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  UPDATE public.business_logistics_requests SET request_status='revision_requested', quotation_status='revision_requested', updated_at=now()
    WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';

  INSERT INTO public.admin_notifications (type, title, message)
  VALUES ('revision_requested', 'Revision Requested',
    format('Customer requested a revision of quotation %s.', v_q.quotation_ref));

  PERFORM public.log_workflow_history(v_q.request_table, v_q.request_id, v_prev, 'revision_requested',
    'revision_requested', (SELECT auth.uid() AS uid), 'customer', v_q.version_number,
    jsonb_build_object('quotation_ref', v_q.quotation_ref, 'message', p_message));
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_quotation(p_quotation_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q record;
  v_prev text;
BEGIN
  SELECT * INTO v_q FROM public.quotations WHERE id = p_quotation_id;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;
  IF v_q.owner_id IS DISTINCT FROM (SELECT auth.uid() AS uid) THEN
    RAISE EXCEPTION 'You can only decline your own quotation';
  END IF;
  IF v_q.status <> 'sent' THEN
    RAISE EXCEPTION 'Only a sent quotation awaiting your decision can be declined';
  END IF;
  IF v_q.valid_until IS NOT NULL AND v_q.valid_until <= now() THEN
    RAISE EXCEPTION 'This quotation has expired and can no longer be declined';
  END IF;

  SELECT request_status INTO v_prev FROM public.logistics_requests
    WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  IF v_prev IS NULL THEN
    SELECT request_status INTO v_prev FROM public.business_logistics_requests
      WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';
  END IF;

  UPDATE public.quotations SET status='declined', declined_at=now(), updated_at=now()
    WHERE id=p_quotation_id AND status='sent';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quotation is no longer awaiting a decision';
  END IF;

  UPDATE public.logistics_requests SET request_status='declined', quotation_status='declined', updated_at=now()
    WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  UPDATE public.business_logistics_requests SET request_status='declined', quotation_status='declined', updated_at=now()
    WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';

  INSERT INTO public.admin_notifications (type, title, message)
  VALUES ('quotation_declined', 'Quotation Declined',
    format('Customer declined quotation %s.', v_q.quotation_ref));

  PERFORM public.log_workflow_history(v_q.request_table, v_q.request_id, v_prev, 'declined',
    'quotation_declined', (SELECT auth.uid() AS uid), 'customer', v_q.version_number,
    jsonb_build_object('quotation_ref', v_q.quotation_ref, 'reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_quotations()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_row record;
BEGIN
  FOR v_row IN
    SELECT q.*, COALESCE(l.individual_id, l.agent_id) AS lr_owner,
           b.business_id AS blr_owner
    FROM public.quotations q
    LEFT JOIN public.logistics_requests l ON l.id = q.request_id AND q.request_table='logistics_requests'
    LEFT JOIN public.business_logistics_requests b ON b.id = q.request_id AND q.request_table='business_logistics_requests'
    WHERE q.status='sent' AND q.valid_until IS NOT NULL AND q.valid_until <= now()
  LOOP
    UPDATE public.quotations SET status='expired', updated_at=now() WHERE id=v_row.id AND status='sent';
    IF FOUND THEN
      v_count := v_count + 1;
      UPDATE public.logistics_requests SET request_status='expired', quotation_status='expired', updated_at=now()
        WHERE id=v_row.request_id AND v_row.request_table='logistics_requests';
      UPDATE public.business_logistics_requests SET request_status='expired', quotation_status='expired', updated_at=now()
        WHERE id=v_row.request_id AND v_row.request_table='business_logistics_requests';

      IF v_row.lr_owner IS NOT NULL THEN
        PERFORM public.insert_in_app_notification(v_row.lr_owner, 'Quotation Expired',
          'Your quotation has expired. Contact us if you would like a new quotation.', 'warning', '/individual/orders');
      ELSIF v_row.blr_owner IS NOT NULL THEN
        PERFORM public.insert_in_app_notification(v_row.blr_owner, 'Quotation Expired',
          'Your quotation has expired. Contact us if you would like a new quotation.', 'warning', '/individual/orders');
      END IF;

      INSERT INTO public.admin_notifications (type, title, message)
      VALUES ('quotation_expired', 'Quotation Expired', format('Quotation %s has expired.', v_row.quotation_ref));

      PERFORM public.log_workflow_history(v_row.request_table, v_row.request_id, 'quotation_sent', 'expired',
        'quotation_expired', NULL, 'system', v_row.version_number,
        jsonb_build_object('quotation_ref', v_row.quotation_ref));
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;
