/*
# Fix admin notification inserts in quotation workflow functions

1. Problem
- Four workflow functions inserted into `admin_notifications` using the column
  names (type, title, message), but the table's real columns are
  (kind, title, body). Any customer action or the expiry job failed with
  'column "type" of relation "admin_notifications" does not exist'.

2. Fix
- Rewrites `request_revision` and `decline_quotation` with the correct column
  names, keeping their existing void signatures. All workflow logic — status
  transitions, ownership checks, validity checks, atomic guarded updates,
  in-app customer notifications and audit history — is unchanged.
  `accept_quotation` and `expire_quotations` are fixed in the next migration.
*/

CREATE OR REPLACE FUNCTION public.request_revision(p_quotation_id uuid, p_message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q record;
  v_owner uuid;
BEGIN
  SELECT * INTO v_q FROM public.quotations WHERE id = p_quotation_id;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;

  v_owner := public.request_owner_id(v_q.request_table, v_q.request_id);
  IF v_owner IS NULL OR v_owner <> (SELECT auth.uid() AS uid) THEN
    RAISE EXCEPTION 'You can only manage quotations for your own requests';
  END IF;

  IF v_q.status <> 'sent' THEN
    RAISE EXCEPTION 'Only quotations awaiting your decision can be revised';
  END IF;
  IF v_q.valid_until IS NOT NULL AND v_q.valid_until <= now() THEN
    RAISE EXCEPTION 'This quotation has expired';
  END IF;
  IF COALESCE(p_message, '') = '' THEN
    RAISE EXCEPTION 'Please describe what you would like changed';
  END IF;

  UPDATE public.quotations SET status='revision_requested', updated_at=now()
  WHERE id = p_quotation_id AND status='sent';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quotation is no longer awaiting your decision';
  END IF;

  INSERT INTO public.quotation_revision_requests (quotation_id, customer_id, message)
  VALUES (p_quotation_id, (SELECT auth.uid() AS uid), p_message);

  UPDATE public.logistics_requests SET
    request_status='revision_requested', quotation_status='revision_requested', updated_at=now()
  WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  UPDATE public.business_logistics_requests SET
    request_status='revision_requested', quotation_status='revision_requested', updated_at=now()
  WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';

  INSERT INTO public.admin_notifications (kind, title, body)
  VALUES ('revision_requested', 'Revision Requested',
    format('Customer requested a revision of quotation %s.', v_q.quotation_ref));

  PERFORM public.log_workflow_history(v_q.request_table, v_q.request_id, 'quotation_sent', 'revision_requested',
    'revision_requested', (SELECT auth.uid() AS uid), 'customer', v_q.version_number,
    jsonb_build_object('message', p_message));
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_quotation(p_quotation_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_q record;
  v_owner uuid;
BEGIN
  SELECT * INTO v_q FROM public.quotations WHERE id = p_quotation_id;
  IF v_q.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;

  v_owner := public.request_owner_id(v_q.request_table, v_q.request_id);
  IF v_owner IS NULL OR v_owner <> (SELECT auth.uid() AS uid) THEN
    RAISE EXCEPTION 'You can only manage quotations for your own requests';
  END IF;

  IF v_q.status <> 'sent' THEN
    RAISE EXCEPTION 'Only quotations awaiting your decision can be declined';
  END IF;
  IF v_q.valid_until IS NOT NULL AND v_q.valid_until <= now() THEN
    RAISE EXCEPTION 'This quotation has expired';
  END IF;

  UPDATE public.quotations SET
    status='declined', declined_at=now(), updated_at=now()
  WHERE id = p_quotation_id AND status='sent';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This quotation is no longer awaiting your decision';
  END IF;

  UPDATE public.logistics_requests SET
    request_status='declined', quotation_status='declined', updated_at=now()
  WHERE id=v_q.request_id AND v_q.request_table='logistics_requests';
  UPDATE public.business_logistics_requests SET
    request_status='declined', quotation_status='declined', updated_at=now()
  WHERE id=v_q.request_id AND v_q.request_table='business_logistics_requests';

  INSERT INTO public.admin_notifications (kind, title, body)
  VALUES ('quotation_declined', 'Quotation Declined',
    format('Customer declined quotation %s.%s', v_q.quotation_ref,
      CASE WHEN COALESCE(p_reason,'') <> '' THEN format(' Reason: %s', p_reason) ELSE '' END));

  PERFORM public.log_workflow_history(v_q.request_table, v_q.request_id, 'quotation_sent', 'declined',
    'quotation_declined', (SELECT auth.uid() AS uid), 'customer', v_q.version_number,
    jsonb_build_object('reason', COALESCE(p_reason, '')));
END;
$$;