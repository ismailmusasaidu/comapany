import { supabase } from './supabase';

export interface QuotationLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  charge_type: string;
  is_estimate: boolean;
}

export interface Quotation {
  id: string;
  quotation_ref: string;
  request_table: string;
  request_id: string;
  owner_id: string;
  version_number: number;
  status: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  additional_charges: number;
  total_amount: number;
  service_scope: string;
  exclusions: string;
  estimated_timeline: string;
  estimated_start_date: string | null;
  estimated_end_date: string | null;
  payment_terms: string;
  deposit_amount: number | null;
  terms_and_conditions: string;
  internal_notes: string;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
  line_items?: QuotationLineItem[];
}

export interface RevisionRequest {
  id: string;
  quotation_id: string;
  message: string;
  status: string;
  created_at: string;
}

/** All quotation versions for one request, newest first. */
export async function fetchQuotations(requestTable: string, requestId: string): Promise<Quotation[]> {
  const { data, error } = await supabase
    .from('quotations')
    .select('*, quotation_line_items(*)')
    .eq('request_table', requestTable)
    .eq('request_id', requestId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Quotation[];
}

/** Latest non-superseded quotation, if any. */
export function latestQuotation(quotations: Quotation[]): Quotation | null {
  return quotations.find(q => q.status !== 'superseded') ?? quotations[0] ?? null;
}

/** Admin-only: create/update a quotation draft or send it. */
export async function saveQuotation(
  requestTable: string,
  requestId: string,
  payload: Record<string, unknown>,
  items: Array<Record<string, unknown>>,
  send: boolean
): Promise<{ id: string; version_number: number; quotation_ref: string; total_amount: number }> {
  const { data, error } = await supabase.rpc('save_quotation', {
    p_request_table: requestTable,
    p_request_id: requestId,
    p_payload: payload,
    p_items: items,
    p_send: send,
  });
  if (error) throw error;
  return data as { id: string; version_number: number; quotation_ref: string; total_amount: number };
}

/** Admin-only: move the request through the review pipeline. */
export async function updateReviewStatus(
  requestTable: string,
  requestId: string,
  status: string,
  message = ''
): Promise<void> {
  const { error } = await supabase.rpc('update_request_review_status', {
    p_request_table: requestTable,
    p_request_id: requestId,
    p_status: status,
    p_message: message,
  });
  if (error) throw error;
}

/** Admin-only: ask the customer for more information. */
export async function sendInformationRequest(
  requestTable: string,
  requestId: string,
  message: string
): Promise<void> {
  const { error } = await supabase.rpc('send_information_request', {
    p_request_table: requestTable,
    p_request_id: requestId,
    p_message: message,
  });
  if (error) throw error;
}

/** Customer actions on their quotation. */
export async function acceptQuotation(quotationId: string): Promise<{ booking_reference: string }> {
  const { data, error } = await supabase.rpc('accept_quotation', { p_quotation_id: quotationId });
  if (error) throw error;
  return data as { booking_reference: string };
}

export async function requestQuotationRevision(quotationId: string, message: string): Promise<void> {
  const { error } = await supabase.rpc('request_revision', { p_quotation_id: quotationId, p_message: message });
  if (error) throw error;
}

export async function declineQuotation(quotationId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('decline_quotation', { p_quotation_id: quotationId, p_reason: reason });
  if (error) throw error;
}

/** Admin-only: workflow history for one request. */
export async function fetchWorkflowHistory(requestTable: string, requestId: string) {
  const { data, error } = await supabase
    .from('quotation_history')
    .select('*')
    .eq('entity_table', requestTable)
    .eq('entity_id', requestId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
