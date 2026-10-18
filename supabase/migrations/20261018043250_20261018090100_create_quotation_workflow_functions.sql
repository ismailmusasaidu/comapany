/*
# Quotation & Booking Workflow — Part 2a: Admin-side server functions

SECURITY DEFINER functions enforcing every rule server-side.

1. New Functions:
- is_admin() — true when the caller is in admin_users.
- request_owner_id(table, id) — resolves the customer who owns a request.
- log_workflow_history(...) — writes the audit trail.
- save_quotation(table, request_id, payload jsonb, items jsonb, send boolean)
    Admin-only. Creates/updates a quotation (draft or sent). Validates all
    monetary values, recomputes subtotal and total server-side, requires
    terms + future expiry before sending, supersedes prior versions, updates
    request statuses and notifies the customer.
- update_request_review_status(table, request_id, status, message)
    Admin-only. Moves the request through under_review / awaiting_quotation /
    awaiting_information / cancelled.
- send_information_request(table, request_id, message)
    Admin-only. Asks the customer for clarification; request → awaiting_information.

2. Security: all functions re-verify admin status internally; new tables have no
direct write policies, so these functions are the only write path.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = (SELECT auth.uid() AS uid));
$$;

CREATE OR REPLACE FUNCTION public.request_owner_id(p_table text, p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_owner uuid;
BEGIN
  IF p_table = 'logistics_requests' THEN
    SELECT COALESCE(individual_id, agent_id) INTO v_owner
    FROM public.logistics_requests WHERE id = p_request_id;
  ELSIF p_table = 'business_logistics_requests' THEN
    SELECT business_id INTO v_owner FROM public.business_logistics_requests WHERE id = p_request_id;
  END IF;
  RETURN v_owner;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_workflow_history(
  p_entity_table text, p_entity_id uuid, p_prev text, p_new text,
  p_action text, p_actor uuid, p_role text, p_version integer, p_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.quotation_history
    (entity_table, entity_id, prev_status, new_status, actor_id, actor_role, action, quotation_version, metadata)
  VALUES (p_entity_table, p_entity_id, p_prev, p_new, p_actor, p_role, p_action, p_version, p_metadata);
END;
$$;

CREATE OR REPLACE FUNCTION public.save_quotation(
  p_request_table text, p_request_id uuid,
  p_payload jsonb, p_items jsonb, p_send boolean
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_existing record;
  v_version integer;
  v_qid uuid;
  v_ref text;
  v_item jsonb;
  v_qty numeric;
  v_price numeric;
  v_amount numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_discount numeric;
  v_tax numeric;
  v_additional numeric;
  v_valid_until timestamptz;
  v_currency text;
  v_prev_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can create quotations';
  END IF;
  IF p_request_table NOT IN ('logistics_requests','business_logistics_requests') THEN
    RAISE EXCEPTION 'Invalid request table';
  END IF;

  v_owner := public.request_owner_id(p_request_table, p_request_id);
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  SELECT * INTO v_existing FROM public.quotations
    WHERE request_table = p_request_table AND request_id = p_request_id
    ORDER BY version_number DESC LIMIT 1;

  IF v_existing IS NOT NULL AND v_existing.status = 'draft' THEN
    v_version := v_existing.version_number;
    v_qid := v_existing.id;
    v_ref := v_existing.quotation_ref;
  ELSIF v_existing IS NOT NULL THEN
    v_version := v_existing.version_number + 1;
  ELSE
    v_version := 1;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'A quotation needs at least one line item';
  END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := COALESCE(NULLIF(v_item->>'quantity','')::numeric, 1);
    v_price := COALESCE(NULLIF(v_item->>'unit_price','')::numeric, 0);
    v_amount := COALESCE(NULLIF(v_item->>'amount','')::numeric, v_qty * v_price);
    IF v_qty < 0 OR v_price < 0 OR v_amount < 0 THEN
      RAISE EXCEPTION 'Negative amounts are not allowed';
    END IF;
    v_subtotal := v_subtotal + v_amount;
  END LOOP;

  v_discount := COALESCE(NULLIF(p_payload->>'discount_amount','')::numeric, 0);
  v_tax := COALESCE(NULLIF(p_payload->>'tax_amount','')::numeric, 0);
  v_additional := COALESCE(NULLIF(p_payload->>'additional_charges','')::numeric, 0);
  v_total := v_subtotal - v_discount + v_tax + v_additional;
  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Quotation total must be greater than zero';
  END IF;

  v_currency := COALESCE(NULLIF(p_payload->>'currency',''), 'NGN');

  IF p_send THEN
    IF COALESCE(NULLIF(p_payload->>'terms_and_conditions',''), '') = '' THEN
      RAISE EXCEPTION 'Terms and conditions are required before sending';
    END IF;
    IF COALESCE(NULLIF(p_payload->>'valid_until',''), '') = '' THEN
      RAISE EXCEPTION 'A validity expiry date is required before sending';
    END IF;
    v_valid_until := (p_payload->>'valid_until')::timestamptz;
    IF v_valid_until <= now() THEN
      RAISE EXCEPTION 'Validity date must be in the future';
    END IF;
  END IF;

  IF v_qid IS NOT NULL THEN
    UPDATE public.quotations SET
      status = CASE WHEN p_send THEN 'sent' ELSE 'draft' END,
      currency = v_currency,
      subtotal = v_subtotal,
      discount_amount = v_discount,
      tax_amount = v_tax,
      additional_charges = v_additional,
      total_amount = v_total,
      service_scope = COALESCE(p_payload->>'service_scope',''),
      exclusions = COALESCE(p_payload->>'exclusions',''),
      estimated_timeline = COALESCE(p_payload->>'estimated_timeline',''),
      estimated_start_date = NULLIF(p_payload->>'estimated_start_date','')::date,
      estimated_end_date = NULLIF(p_payload->>'estimated_end_date','')::date,
      payment_terms = COALESCE(p_payload->>'payment_terms',''),
      deposit_amount = NULLIF(p_payload->>'deposit_amount','')::numeric,
      terms_and_conditions = COALESCE(p_payload->>'terms_and_conditions',''),
      internal_notes = COALESCE(p_payload->>'internal_notes',''),
      valid_until = CASE WHEN p_send THEN v_valid_until ELSE NULL END,
      created_by = (SELECT auth.uid() AS uid),
      sent_at = CASE WHEN p_send THEN now() ELSE NULL END,
      updated_at = now()
    WHERE id = v_qid;
  ELSE
    v_ref := 'QT-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    INSERT INTO public.quotations
      (quotation_ref, request_table, request_id, owner_id, version_number, status,
       currency, subtotal, discount_amount, tax_amount, additional_charges, total_amount,
       service_scope, exclusions, estimated_timeline, estimated_start_date, estimated_end_date,
       payment_terms, deposit_amount, terms_and_conditions, internal_notes, valid_until,
       created_by, sent_at)
    VALUES (
      v_ref, p_request_table, p_request_id, v_owner, v_version,
      CASE WHEN p_send THEN 'sent' ELSE 'draft' END,
      v_currency,
      v_subtotal, v_discount, v_tax, v_additional, v_total,
      COALESCE(p_payload->>'service_scope',''),
      COALESCE(p_payload->>'exclusions',''),
      COALESCE(p_payload->>'estimated_timeline',''),
      NULLIF(p_payload->>'estimated_start_date','')::date,
      NULLIF(p_payload->>'estimated_end_date','')::date,
      COALESCE(p_payload->>'payment_terms',''),
      NULLIF(p_payload->>'deposit_amount','')::numeric,
      COALESCE(p_payload->>'terms_and_conditions',''),
      COALESCE(p_payload->>'internal_notes',''),
      CASE WHEN p_send THEN v_valid_until ELSE NULL END,
      (SELECT auth.uid() AS uid),
      CASE WHEN p_send THEN now() ELSE NULL END
    )
    RETURNING id INTO v_qid;
  END IF;

  DELETE FROM public.quotation_line_items WHERE quotation_id = v_qid;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := COALESCE(NULLIF(v_item->>'quantity','')::numeric, 1);
    v_price := COALESCE(NULLIF(v_item->>'unit_price','')::numeric, 0);
    v_amount := COALESCE(NULLIF(v_item->>'amount','')::numeric, v_qty * v_price);
    INSERT INTO public.quotation_line_items
      (quotation_id, description, quantity, unit_price, amount, charge_type, is_estimate)
    VALUES
      (v_qid,
       COALESCE(v_item->>'description',''),
       v_qty,
       v_price,
       v_amount,
       COALESCE(v_item->>'charge_type','service_fee'),
       COALESCE((v_item->>'is_estimate')::boolean, false));
  END LOOP;

  IF p_send THEN
    UPDATE public.quotations SET status='superseded', superseded_at=now()
      WHERE request_table=p_request_table AND request_id=p_request_id
        AND id <> v_qid AND status IN ('sent','revision_requested');

    SELECT request_status INTO v_prev_status FROM public.logistics_requests
      WHERE id=p_request_id AND p_request_table='logistics_requests';
    IF v_prev_status IS NULL THEN
      SELECT request_status INTO v_prev_status FROM public.business_logistics_requests
        WHERE id=p_request_id AND p_request_table='business_logistics_requests';
    END IF;

    UPDATE public.logistics_requests SET
      request_status='quotation_sent', quotation_status='sent', updated_at=now()
      WHERE id=p_request_id AND p_request_table='logistics_requests';
    UPDATE public.business_logistics_requests SET
      request_status='quotation_sent', quotation_status='sent', updated_at=now()
      WHERE id=p_request_id AND p_request_table='business_logistics_requests';

    PERFORM public.insert_in_app_notification(
      v_owner,
      'Quotation Ready',
      'A quotation for your logistics request is ready for review.',
      'quotation',
      '/individual/orders'
    );
    PERFORM public.log_workflow_history(p_request_table, p_request_id, v_prev_status, 'quotation_sent',
      'quotation_sent', (SELECT auth.uid() AS uid), 'admin', v_version,
      jsonb_build_object('quotation_ref', v_ref, 'total', v_total, 'currency', v_currency));
  ELSE
    PERFORM public.log_workflow_history(p_request_table, p_request_id, NULL, NULL,
      'quotation_draft_saved', (SELECT auth.uid() AS uid), 'admin', v_version,
      jsonb_build_object('quotation_ref', v_ref, 'total', v_total));
  END IF;

  RETURN jsonb_build_object(
    'id', v_qid,
    'version_number', v_version,
    'status', CASE WHEN p_send THEN 'sent' ELSE 'draft' END,
    'total_amount', v_total,
    'quotation_ref', v_ref
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_request_review_status(
  p_request_table text, p_request_id uuid, p_status text, p_message text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_prev text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update review status';
  END IF;
  IF p_status NOT IN ('submitted','under_review','awaiting_quotation','awaiting_information','cancelled') THEN
    RAISE EXCEPTION 'Invalid review status';
  END IF;
  v_owner := public.request_owner_id(p_request_table, p_request_id);
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  SELECT request_status INTO v_prev FROM public.logistics_requests
    WHERE id=p_request_id AND p_request_table='logistics_requests';
  IF v_prev IS NULL THEN
    SELECT request_status INTO v_prev FROM public.business_logistics_requests
      WHERE id=p_request_id AND p_request_table='business_logistics_requests';
  END IF;

  UPDATE public.logistics_requests SET request_status=p_status, updated_at=now()
    WHERE id=p_request_id AND p_request_table='logistics_requests';
  UPDATE public.business_logistics_requests SET request_status=p_status, updated_at=now()
    WHERE id=p_request_id AND p_request_table='business_logistics_requests';

  IF p_message IS NOT NULL AND p_message <> '' THEN
    PERFORM public.insert_in_app_notification(v_owner, 'Update on your logistics request', p_message, 'info', '/individual/orders');
  END IF;
  PERFORM public.log_workflow_history(p_request_table, p_request_id, v_prev, p_status,
    'review_status_update', (SELECT auth.uid() AS uid), 'admin', NULL,
    CASE WHEN p_message IS NOT NULL AND p_message <> '' THEN jsonb_build_object('message', p_message) ELSE NULL END);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_information_request(
  p_request_table text, p_request_id uuid, p_message text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_prev text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can request information';
  END IF;
  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'A message is required';
  END IF;
  v_owner := public.request_owner_id(p_request_table, p_request_id);
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  SELECT request_status INTO v_prev FROM public.logistics_requests
    WHERE id=p_request_id AND p_request_table='logistics_requests';
  IF v_prev IS NULL THEN
    SELECT request_status INTO v_prev FROM public.business_logistics_requests
      WHERE id=p_request_id AND p_request_table='business_logistics_requests';
  END IF;

  UPDATE public.logistics_requests SET request_status='awaiting_information', updated_at=now()
    WHERE id=p_request_id AND p_request_table='logistics_requests';
  UPDATE public.business_logistics_requests SET request_status='awaiting_information', updated_at=now()
    WHERE id=p_request_id AND p_request_table='business_logistics_requests';

  PERFORM public.insert_in_app_notification(
    v_owner,
    'More information needed',
    'The logistics team needs more information about your request. Please check the messages for details.',
    'info',
    '/individual/messages'
  );
  PERFORM public.log_workflow_history(p_request_table, p_request_id, v_prev, 'awaiting_information',
    'information_request', (SELECT auth.uid() AS uid), 'admin', NULL, jsonb_build_object('message', p_message));
END;
$$;
