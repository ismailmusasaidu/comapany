import { useState } from 'react';
import {
  X, FileText, CheckCircle, RefreshCw, XCircle, AlertTriangle,
  Calendar, Clock, CreditCard, ShieldCheck, Loader2, Check, Hash,
} from 'lucide-react';
import {
  Quotation, acceptQuotation, requestQuotationRevision, declineQuotation,
} from '../lib/quotations';

const CHARGE_LABELS: Record<string, string> = {
  service_fee: 'Service fee',
  duty: 'Duty',
  tax: 'Tax / Levy',
  port_charge: 'Port charge',
  third_party: 'Third-party charge',
  storage: 'Storage',
  handling: 'Handling',
  transport: 'Transport',
  packaging: 'Packaging',
  other: 'Other',
};

function money(n: number, currency: string) {
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : currency + ' ';
  return `${symbol}${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}

interface Props {
  quotation: Quotation;
  requestRef: string;
  serviceType: string;
  onClose: () => void;
  onDecided: () => void;
}

export default function QuotationDetailModal({ quotation, requestRef, serviceType, onClose, onDecided }: Props) {
  const [dialog, setDialog] = useState<null | 'accept' | 'revise' | 'decline'>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ booking_reference: string } | null>(null);

  const awaitingDecision = quotation.status === 'sent' &&
    (!quotation.valid_until || new Date(quotation.valid_until) > new Date());

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      if (dialog === 'accept') {
        const r = await acceptQuotation(quotation.id);
        setResult(r);
      } else if (dialog === 'revise') {
        await requestQuotationRevision(quotation.id, message);
        setDialog(null);
        onDecided();
      } else if (dialog === 'decline') {
        await declineQuotation(quotation.id, message);
        setDialog(null);
        onDecided();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-green-50 border border-green-100 flex-shrink-0">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 truncate">Quotation {quotation.quotation_ref}</h2>
                <p className="text-xs text-gray-400">{requestRef} · Version {quotation.version_number} · {quotation.status === 'sent' ? 'Awaiting your decision' : quotation.status}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {result ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-500 text-sm mb-6">Quotation accepted successfully. Your logistics booking is now confirmed. Our team will contact you regarding the next steps.</p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 inline-block mb-2">
                  <p className="text-xs text-blue-600 font-medium">Booking Reference</p>
                  <p className="text-2xl font-bold text-blue-700">{result.booking_reference}</p>
                </div>
                <p className="text-xs text-gray-400">Accepted quotation version {quotation.version_number} · Total {money(quotation.total_amount, quotation.currency)}</p>
                <button onClick={onDecided} className="mt-8 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 rounded-xl text-sm hover:from-orange-600 hover:to-red-600 transition-all">
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Amount hero */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Total quoted amount</p>
                  <p className="text-4xl font-bold text-gradient-light mt-2">{money(quotation.total_amount, quotation.currency)}</p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />{serviceType}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Issued {fmtDate(quotation.created_at)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Valid until {fmtDate(quotation.valid_until)}</span>
                  </div>
                </div>

                {/* Itemized charges */}
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">Itemized charges</p>
                  <div className="divide-y divide-gray-50">
                    {(quotation.line_items ?? []).map((li, i) => (
                      <div key={li.id ?? i} className="px-4 py-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 font-medium">{li.description || CHARGE_LABELS[li.charge_type] || 'Charge'}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            {CHARGE_LABELS[li.charge_type] ?? 'Other'}
                            {li.quantity !== 1 && <span>· Qty {li.quantity}</span>}
                            {li.is_estimate && (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                                <AlertTriangle className="h-3 w-3" /> Estimated — not guaranteed
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{money(li.amount, quotation.currency)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{money(quotation.subtotal, quotation.currency)}</span></div>
                    {quotation.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600"><span>Discount</span><span>-{money(quotation.discount_amount, quotation.currency)}</span></div>
                    )}
                    {quotation.tax_amount > 0 && (
                      <div className="flex justify-between text-gray-500"><span>Taxes & statutory charges</span><span>{money(quotation.tax_amount, quotation.currency)}</span></div>
                    )}
                    {quotation.additional_charges > 0 && (
                      <div className="flex justify-between text-gray-500"><span>Additional fees</span><span>{money(quotation.additional_charges, quotation.currency)}</span></div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                      <span>Total</span><span>{money(quotation.total_amount, quotation.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Scope, exclusions, timeline, terms */}
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {quotation.service_scope && (
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Service scope</p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{quotation.service_scope}</p>
                    </div>
                  )}
                  {quotation.exclusions && (
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5" />Exclusions</p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{quotation.exclusions}</p>
                    </div>
                  )}
                  {(quotation.estimated_timeline || quotation.estimated_start_date || quotation.estimated_end_date) && (
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Estimated timeline</p>
                      {quotation.estimated_timeline && <p className="text-gray-700">{quotation.estimated_timeline}</p>}
                      {(quotation.estimated_start_date || quotation.estimated_end_date) && (
                        <p className="text-gray-500 text-xs mt-1">{fmtDate(quotation.estimated_start_date)} → {fmtDate(quotation.estimated_end_date)}</p>
                      )}
                    </div>
                  )}
                  {(quotation.payment_terms || quotation.deposit_amount != null) && (
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Payment terms</p>
                      {quotation.deposit_amount != null && (
                        <p className="text-gray-800 font-medium">Deposit required: {money(quotation.deposit_amount, quotation.currency)}</p>
                      )}
                      {quotation.payment_terms && <p className="text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">{quotation.payment_terms}</p>}
                    </div>
                  )}
                </div>

                {quotation.terms_and_conditions && (
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Terms & conditions</p>
                    <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Accepting means you agree to this quotation. Payment is handled separately and is not collected at acceptance.
                </p>

                {/* Actions */}
                {awaitingDecision ? (
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button onClick={() => { setDialog('accept'); setMessage(''); }} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                      <Check className="h-4 w-4" /> Accept Quotation
                    </button>
                    <button onClick={() => { setDialog('revise'); setMessage(''); }} className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all">
                      <RefreshCw className="h-4 w-4" /> Request Revision
                    </button>
                    <button onClick={() => { setDialog('decline'); setMessage(''); }} className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all">
                      <XCircle className="h-4 w-4" /> Decline
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
                    {quotation.status === 'sent'
                      ? 'This quotation has expired. Request a new quotation to continue.'
                      : quotation.status === 'revision_requested'
                        ? 'Your revision request has been sent to our team. A revised quotation will follow.'
                        : quotation.status === 'accepted'
                          ? 'You accepted this quotation — the booking is confirmed.'
                          : quotation.status === 'declined'
                            ? 'You declined this quotation. Our team may issue a new quotation if you wish to continue.'
                            : 'This quotation is no longer active.'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm dialogs */}
      {dialog && !result && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !busy && setDialog(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {dialog === 'accept' ? 'Accept this quotation?' : dialog === 'revise' ? 'Request a revision' : 'Decline this quotation?'}
            </h3>
            {dialog === 'accept' && (
              <p className="text-sm text-gray-500 mb-1">
                You are accepting quotation <span className="font-semibold text-gray-700">{quotation.quotation_ref}</span> (version {quotation.version_number}) for a total of{' '}
                <span className="font-bold text-gray-900">{money(quotation.total_amount, quotation.currency)}</span>.
                Your booking will be confirmed immediately after acceptance.
              </p>
            )}
            {dialog === 'revise' && (
              <p className="text-sm text-gray-500 mb-1">Tell our team what you would like changed. The current quotation stays unchanged and a new version will be prepared.</p>
            )}
            {dialog === 'decline' && (
              <p className="text-sm text-gray-500 mb-1">Optionally tell us why you are declining — it helps us prepare a better quotation.</p>
            )}
            {dialog !== 'accept' && (
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                placeholder={dialog === 'revise' ? 'e.g. Can the pickup be moved to next week?' : 'e.g. Price is above our budget'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none mt-3" />
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDialog(null)} disabled={busy} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button onClick={run} disabled={busy || (dialog === 'revise' && message.trim() === '')}
                className={`flex-1 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  dialog === 'accept' ? 'bg-green-600 hover:bg-green-700' : dialog === 'revise' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : dialog === 'accept' ? 'Confirm Acceptance' : dialog === 'revise' ? 'Send Revision Request' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
