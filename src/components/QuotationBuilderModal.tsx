import { useState } from 'react';
import {
  X, Plus, Trash2, Loader2, FileText, Save, Send, Eye, AlertTriangle,
} from 'lucide-react';
import { QuotationLineItem, Quotation, saveQuotation } from '../lib/quotations';

const CHARGE_TYPES = [
  { value: 'service_fee', label: 'Service fee' },
  { value: 'duty', label: 'Duty' },
  { value: 'tax', label: 'Tax / Levy' },
  { value: 'port_charge', label: 'Port charge' },
  { value: 'third_party', label: 'Third-party' },
  { value: 'storage', label: 'Storage' },
  { value: 'handling', label: 'Handling' },
  { value: 'transport', label: 'Transport' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Other' },
];

function money(n: number) {
  return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

interface Props {
  requestTable: string;
  requestId: string;
  requestRef: string;
  quotations: Quotation[];
  onClose: () => void;
  onSaved: () => void;
}

interface EditorItem extends QuotationLineItem {
  /** local id for React keys; never sent to the database */
  _lid: string;
}

const emptyItem = (): EditorItem => ({
  _lid: Math.random().toString(36).slice(2),
  description: '',
  quantity: 1,
  unit_price: 0,
  amount: 0,
  charge_type: 'service_fee',
  is_estimate: false,
});

export default function QuotationBuilderModal({ requestTable, requestId, requestRef, quotations, onClose, onSaved }: Props) {
  const existing = quotations[0];
  const draft = existing && existing.status === 'draft' ? existing : null;

  const [items, setItems] = useState<EditorItem[]>(
    draft?.line_items && draft.line_items.length > 0
      ? draft.line_items.map(li => ({ ...li, _lid: Math.random().toString(36).slice(2) }))
      : [emptyItem()]
  );
  const [form, setForm] = useState({
    discount_amount: draft ? String(draft.discount_amount) : '',
    tax_amount: draft ? String(draft.tax_amount) : '',
    additional_charges: draft ? String(draft.additional_charges) : '',
    service_scope: draft?.service_scope ?? '',
    exclusions: draft?.exclusions ?? '',
    estimated_timeline: draft?.estimated_timeline ?? '',
    estimated_start_date: draft?.estimated_start_date ?? '',
    estimated_end_date: draft?.estimated_end_date ?? '',
    payment_terms: draft?.payment_terms ?? '',
    deposit_amount: draft?.deposit_amount != null ? String(draft.deposit_amount) : '',
    terms_and_conditions: draft?.terms_and_conditions ?? '',
    internal_notes: draft?.internal_notes ?? '',
    valid_until: draft?.valid_until ? draft.valid_until.slice(0, 10) : '',
  });

  const [busy, setBusy] = useState<'' | 'draft' | 'send'>('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const discount = Number(form.discount_amount) || 0;
  const tax = Number(form.tax_amount) || 0;
  const additional = Number(form.additional_charges) || 0;
  const total = subtotal - discount + tax + additional;

  const upd = (lid: string, patch: Partial<EditorItem>) =>
    setItems(prev => prev.map(it => (it._lid === lid ? { ...it, ...patch } : it)));

  const run = async (send: boolean) => {
    const cleanItems = items
      .filter(it => it.description.trim() !== '' || (Number(it.unit_price) || 0) > 0)
      .map(it => ({
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        amount: (Number(it.unit_price) || 0) * (Number(it.quantity) || 1),
        charge_type: it.charge_type,
        is_estimate: !!it.is_estimate,
      }));
    if (cleanItems.length === 0) {
      setError('Add at least one line item with a description or price.');
      return;
    }
    if (send) {
      if (form.terms_and_conditions.trim() === '') { setError('Terms and conditions are required before sending.'); return; }
      if (form.valid_until.trim() === '') { setError('Set a validity expiry date before sending.'); return; }
    }
    setBusy(send ? 'send' : 'draft');
    setError('');
    try {
      await saveQuotation(requestTable, requestId, {
        discount_amount: discount,
        tax_amount: tax,
        additional_charges: additional,
        service_scope: form.service_scope,
        exclusions: form.exclusions,
        estimated_timeline: form.estimated_timeline,
        estimated_start_date: form.estimated_start_date,
        estimated_end_date: form.estimated_end_date,
        payment_terms: form.payment_terms,
        deposit_amount: form.deposit_amount === '' ? null : Number(form.deposit_amount),
        terms_and_conditions: form.terms_and_conditions,
        internal_notes: form.internal_notes,
        valid_until: form.valid_until,
      }, cleanItems, send);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save the quotation. Please try again.');
      setBusy('');
    }
  };

  const L = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block';
  const I = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';
  const B = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

  const visibleItems = items.filter(it => it.description.trim() !== '' || (Number(it.unit_price) || 0) > 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100 flex-shrink-0">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">Build Quotation · {requestRef}</h2>
              <p className="text-xs text-gray-400">
                {draft
                  ? `Editing draft version ${draft.version_number} — versions already sent are never changed`
                  : `New version ${((existing?.version_number) ?? 0) + 1} — sent quotations are never overwritten`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={L + ' mb-0'}>Line items</p>
              <button onClick={() => setItems(p => [...p, emptyItem()])} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700">
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map(it => (
                <div key={it._lid} className="rounded-2xl border border-gray-100 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={it.description} onChange={e => upd(it._lid, { description: e.target.value })}
                      placeholder="Charge description (e.g. Sea freight Lagos → Shanghai)" className={I} />
                    <button onClick={() => setItems(p => (p.length > 1 ? p.filter(x => x._lid !== it._lid) : [emptyItem()]))}
                      className="p-2 text-gray-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <select value={it.charge_type} onChange={e => upd(it._lid, { charge_type: e.target.value })} className={I}>
                      {CHARGE_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                    </select>
                    <input type="number" min="0" step="1" value={it.quantity} onChange={e => upd(it._lid, { quantity: Number(e.target.value) })}
                      placeholder="Qty" className={I} title="Quantity" />
                    <input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => upd(it._lid, { unit_price: Number(e.target.value) })}
                      placeholder="Unit price" className={I} title="Unit price (₦)" />
                    <div className="col-span-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">{money((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</span>
                      <label className="flex items-center gap-1.5 text-xs text-amber-600 font-medium cursor-pointer select-none">
                        <input type="checkbox" checked={it.is_estimate} onChange={e => upd(it._lid, { is_estimate: e.target.checked })} className="accent-amber-500" />
                        Estimate flag
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-2xl bg-slate-50 border border-gray-100 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-[11px] text-gray-400 font-medium block">Discount (₦)</label>
                <input type="number" min="0" step="0.01" value={form.discount_amount} onChange={e => setForm(p => ({ ...p, discount_amount: e.target.value }))} className={I} />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-medium block">Tax / statutory (₦)</label>
                <input type="number" min="0" step="0.01" value={form.tax_amount} onChange={e => setForm(p => ({ ...p, tax_amount: e.target.value }))} className={I} />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 font-medium block">Additional (₦)</label>
                <input type="number" min="0" step="0.01" value={form.additional_charges} onChange={e => setForm(p => ({ ...p, additional_charges: e.target.value }))} className={I} />
              </div>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
              <span>Total</span><span>{money(total)}</span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={L}>Service scope</label>
              <textarea rows={3} value={form.service_scope} onChange={e => setForm(p => ({ ...p, service_scope: e.target.value }))} className={I + ' resize-none'} placeholder="What the quoted price covers" />
            </div>
            <div>
              <label className={L}>Exclusions</label>
              <textarea rows={3} value={form.exclusions} onChange={e => setForm(p => ({ ...p, exclusions: e.target.value }))} className={I + ' resize-none'} placeholder="What is not included" />
            </div>
            <div>
              <label className={L}>Estimated timeline</label>
              <input value={form.estimated_timeline} onChange={e => setForm(p => ({ ...p, estimated_timeline: e.target.value }))} className={I} placeholder="e.g. 14–21 days door to door" />
            </div>
            <div>
              <label className={L}>Payment terms</label>
              <input value={form.payment_terms} onChange={e => setForm(p => ({ ...p, payment_terms: e.target.value }))} className={I} placeholder="e.g. 50% upfront, 50% on delivery" />
            </div>
            <div>
              <label className={L}>Deposit amount (₦)</label>
              <input type="number" min="0" step="0.01" value={form.deposit_amount} onChange={e => setForm(p => ({ ...p, deposit_amount: e.target.value }))} className={I} placeholder="Leave empty if no deposit" />
            </div>
            <div>
              <label className={L}>Valid until (required to send)</label>
              <input type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))} className={I} />
            </div>
            <div>
              <label className={L}>Timeline start date</label>
              <input type="date" value={form.estimated_start_date} onChange={e => setForm(p => ({ ...p, estimated_start_date: e.target.value }))} className={I} />
            </div>
            <div>
              <label className={L}>Timeline end date</label>
              <input type="date" value={form.estimated_end_date} onChange={e => setForm(p => ({ ...p, estimated_end_date: e.target.value }))} className={I} />
            </div>
          </div>

          <div>
            <label className={L}>Terms &amp; conditions (required to send)</label>
            <textarea rows={4} value={form.terms_and_conditions} onChange={e => setForm(p => ({ ...p, terms_and_conditions: e.target.value }))} className={I + ' resize-none'} placeholder="Payment terms, liability, cancellation policy..." />
          </div>
          <div>
            <label className={L}>Internal notes (never visible to the customer)</label>
            <textarea rows={2} value={form.internal_notes} onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))} className={I + ' resize-none'} placeholder="Margin notes, supplier quotes..." />
          </div>

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => run(false)} disabled={busy !== ''} className={B + ' flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50'}>
              {busy === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {busy === 'draft' ? 'Saving…' : 'Save Draft'}
            </button>
            <button onClick={() => setShowPreview(true)} disabled={busy !== ''} className={B + ' flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50'}>
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button onClick={() => run(true)} disabled={busy !== '' || total <= 0} className={B + ' flex-1 bg-green-600 hover:bg-green-700 text-white'}>
              {busy === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {busy === 'send' ? 'Sending…' : 'Send to Customer'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Customer preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500"><X className="h-5 w-5" /></button>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 text-white">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">Total quoted amount</p>
              <p className="text-3xl font-bold mt-1">{money(total)}</p>
              <p className="text-[11px] text-gray-400 mt-2">Valid until {form.valid_until ? fmtDate(form.valid_until) : '— not set —'}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {visibleItems.map(it => (
                <div key={it._lid} className="px-4 py-2.5 flex justify-between gap-3 text-sm">
                  <span className="text-gray-800">
                    {it.description || 'Charge'}
                    {Number(it.quantity) !== 1 ? ` · Qty ${it.quantity}` : ''}
                    {it.is_estimate ? ' · estimated' : ''}
                  </span>
                  <span className="font-semibold whitespace-nowrap">{money((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</span>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{form.terms_and_conditions || 'No terms added yet.'}</div>
            <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Sending requires terms and a future validity date.
            </p>
            {form.internal_notes && (
              <p className="text-[11px] text-gray-400">Internal notes are excluded from this preview.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
