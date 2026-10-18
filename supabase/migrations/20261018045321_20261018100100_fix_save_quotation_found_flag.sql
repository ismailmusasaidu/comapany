/*
# Fix quotation version branching in save_quotation

1. Problem
- In PL/pgSQL, `SELECT ... INTO v_existing` followed by `v_existing IS NOT NULL`
  does not reliably detect "a row was found": after a no-row select the record
  variable evaluates as NULL, but after a found row the IS NOT NULL test on a
  record of non-null fields is always true, so the draft-reuse / version-increment
  branches could be skipped and the function re-inserted version 1, violating the
  unique constraint (request_table, request_id, version_number).

2. Fix
- Use the `FOUND` flag immediately after the SELECT instead of testing the
  record variable. `FOUND` is set true only when the SELECT returned a row.
- Behaviour is otherwise unchanged: drafts are edited in place; sending a
  quotation creates the next version and supersedes prior sent versions; terms
  and a future validity date are still required before sending; totals are still
  recomputed server-side from validated line items.
*/

CREATE OR REPLACE FUNCTION public.save_quotation(
  p_request_table text,
  p_request_id uuid,
  p_payload jsonb,
  p_items jsonb,
  p_send boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_existing record;
  v_found boolean;
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
  v_found := FOUND;

  IF v_found AND v_existing.status = 'draft' THEN
    v_version := v_existing.version_number;
    v_qid := v_existing.id;
    v_ref := v_existing.quotation_ref;
  ELSIF v_found THEN
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
    VALUES (
      v_qid,
      COALESCE(v_item->>'description',''),
      v_qty,
      v_price,
      v_amount,
      COALESCE(v_item->>'charge_type','service_fee'),
      COALESCE((v_item->>'is_estimate')::boolean, false)
    );
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