/*
# Fix admin notification columns in accept_quotation and expire_quotations

1. Problem
- `accept_quotation` and `expire_quotations` also inserted into
  `admin_notifications` using (type, title, message); the real columns are
  (kind, title, body). Accepting a quotation or the scheduled expiry job would
  fail with 'column "type" ... does not exist'.

2. Fix
- Rewrites both functions with the correct column names. All workflow logic is
  unchanged:
  - accept: owner-only, sent+unexpired only, atomic guarded update, BK-reference
    generation, request confirmed state, customer in-app notification, history.
  - expire: expires overdue sent quotations for both request tables, sets the
    request to expired, notifies owner and admin, writes history. Returns count.
*/

CREATE OR REPLACE FUNCTION public.accept_quotation(p_quotation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
  INSERT INTO public.admin_notifications (kind, title, body)
  VALUES ('quotation_accepted', 'Quotation Accepted',
    format('Quotation %s was accepted. Booking %s confirmed.', v_q.quotation_ref, v_booking_ref));

  PERFORM public.log_workflow_history(v_q.request_table, v_q.request_id, v_prev, 'confirmed',
    'quotation_accepted', (SELECT auth.uid() AS uid), 'customer', v_q.version_number,
    jsonb_build_object('quotation_ref', v_q.quotation_ref, 'total', v_q.total_amount, 'booking_reference', v_booking_ref));

  RETURN jsonb_build_object('booking_reference', v_booking_ref, 'quotation_ref', v_q.quotation_ref, 'version', v_q.version_number);
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_quotations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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

      INSERT INTO public.admin_notifications (kind, title, body)
      VALUES ('quotation_expired', 'Quotation Expired', format('Quotation %s has expired.', v_row.quotation_ref));

      PERFORM public.log_workflow_history(v_row.request_table, v_row.request_id, 'quotation_sent', 'expired',
        'quotation_expired', NULL, 'system', v_row.version_number,
        jsonb_build_object('quotation_ref', v_row.quotation_ref));
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$;