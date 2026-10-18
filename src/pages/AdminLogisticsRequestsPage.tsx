import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Search, Truck, User, Building2, Users,
  Filter, X, MapPin, Package, Calendar, StickyNote, CheckCircle, DollarSign, FileText,
  History, ClipboardList, Quote, Eye, Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logAdminAction } from '../lib/auditLog';
import { getDocumentViewUrl, StoredDocument } from '../lib/logisticsDocuments';
import { fetchQuotations, fetchWorkflowHistory, Quotation, updateReviewStatus, sendInformationRequest } from '../lib/quotations';
import QuotationBuilderModal from '../components/QuotationBuilderModal';

interface UnifiedRequest {
  id: string;
  source: 'individual' | 'agent' | 'business';
  table: 'logistics_requests' | 'business_logistics_requests';
  request_ref: string;
  title: string;
  service_type: string;
  description: string;
  origin: string;
  destination: string;
  quantity: string;
  weight: string;
  preferred_date: string | null;
  budget_range: string;
  vehicle_type: string | null;
  status: string;
  admin_notes: string;
  fee_amount: number | null;
  payment_status: string;
  created_at: string;
  requester_name: string;
  requester_phone: string;
  requester_email: string;
  documents: StoredDocument[];
  request_status: string;
  quotation_status: string;
  operational_status: string;
  booking_reference: string | null;
}

const STATUS_OPTIONS = ['pending', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const SOURCE_META = {
  individual: { label: 'Individual', icon: User, chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  agent: { label: 'Agent', icon: Users, chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  business: { label: 'Business', icon: Building2, chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
} as const;

const FEE_EDITABLE_STATUSES = ['approved', 'in_progress', 'completed'];

function naira(n: number | null | undefined) { return n != null ? `₦${Number(n).toLocaleString('en-NG')}` : '—'; }

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function AdminDocumentRow({ doc }: { doc: StoredDocument }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await getDocumentViewUrl(doc.path);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else setError('Could not open document');
    } catch {
      setError('Could not open document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-700 truncate">{doc.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <button
          onClick={open}
          disabled={loading}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50"
        >
          {loading ? 'Opening…' : 'View'}
        </button>
      </div>
    </div>
  );
}

function DescriptionBlock({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Lines like "Label: value" become paired rows; anything else stays free text
  const pairs: { label: string; value: string }[] = [];
  const freeText: string[] = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9 /&'-]{0,40}?):\s*(.+)$/);
    if (m) pairs.push({ label: m[1].trim(), value: m[2].trim() });
    else freeText.push(line);
  }

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">Description</p>
      {pairs.length > 0 && (
        <div className="divide-y divide-gray-50">
          {pairs.map((p, i) => (
            <div key={i} className="flex gap-3 px-4 py-2.5 text-sm odd:bg-gray-50/60">
              <span className="w-36 flex-shrink-0 text-xs font-semibold text-gray-500 pt-0.5">{p.label}</span>
              <span className="text-gray-800 leading-relaxed">{p.value}</span>
            </div>
          ))}
        </div>
      )}
      {freeText.length > 0 && (
        <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed space-y-1.5">
          {freeText.map((t, i) => <p key={i}>{t}</p>)}
        </div>
      )}
    </div>
  );
}

export default function AdminLogisticsRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'individual' | 'agent' | 'business'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<UnifiedRequest | null>(null);
  const [editStatus, setEditStatus] = useState('pending');
  const [editNotes, setEditNotes] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('unpaid');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [requestQuotes, setRequestQuotes] = useState<Quotation[]>([]);
  const [workflowLog, setWorkflowLog] = useState<Array<Record<string, unknown>>>([]);
  const [buildingQuotation, setBuildingQuotation] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [indRes, agentRes, bizRes] = await Promise.all([
      supabase.from('logistics_requests').select('*, individual_profiles(full_name, phone, email)').not('individual_id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('logistics_requests').select('*, agent_profiles(full_name, company_name)').not('agent_id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('business_logistics_requests').select('*, business_profiles(company_name, contact_person, phone, email)').order('created_at', { ascending: false }),
    ]);

    const unified: UnifiedRequest[] = [];
    (indRes.data ?? []).forEach((r: Record<string, unknown>) => {
      const p = (r.individual_profiles ?? {}) as Record<string, string | null>;
      unified.push({
        id: r.id as string, source: 'individual', table: 'logistics_requests',
        request_ref: r.request_ref as string, title: r.title as string,
        service_type: r.service_type as string, description: (r.description as string) ?? '',
        origin: r.origin as string, destination: r.destination as string,
        quantity: r.quantity != null ? String(r.quantity) : '',
        weight: r.weight_kg != null ? `${r.weight_kg} kg` : '',
        preferred_date: r.preferred_date as string | null,
        budget_range: (r.budget_range as string) ?? '',
        vehicle_type: r.vehicle_type as string | null,
        status: r.status as string, admin_notes: (r.admin_notes as string) ?? '',
        fee_amount: (r.fee_amount as number | null) ?? null,
        payment_status: (r.payment_status as string) ?? 'unpaid',
        created_at: r.created_at as string,
        requester_name: p.full_name ?? 'Unknown', requester_phone: p.phone ?? '',
        requester_email: p.email ?? '',
        documents: (r.documents as StoredDocument[] | null) ?? [],
        request_status: (r.request_status as string) ?? 'submitted',
        quotation_status: (r.quotation_status as string) ?? 'none',
        operational_status: (r.operational_status as string) ?? 'not_scheduled',
        booking_reference: (r.booking_reference as string | null) ?? null,
      });
    });
    (agentRes.data ?? []).forEach((r: Record<string, unknown>) => {
      const p = (r.agent_profiles ?? {}) as Record<string, string | null>;
      unified.push({
        id: r.id as string, source: 'agent', table: 'logistics_requests',
        request_ref: r.request_ref as string, title: r.title as string,
        service_type: r.service_type as string, description: (r.description as string) ?? '',
        origin: r.origin as string, destination: r.destination as string,
        quantity: r.quantity != null ? String(r.quantity) : '',
        weight: r.weight_kg != null ? `${r.weight_kg} kg` : '',
        preferred_date: r.preferred_date as string | null,
        budget_range: (r.budget_range as string) ?? '',
        vehicle_type: r.vehicle_type as string | null,
        status: r.status as string, admin_notes: (r.admin_notes as string) ?? '',
        fee_amount: (r.fee_amount as number | null) ?? null,
        payment_status: (r.payment_status as string) ?? 'unpaid',
        created_at: r.created_at as string,
        requester_name: p.full_name ?? p.company_name ?? 'Unknown', requester_phone: '',
        requester_email: '',
        documents: (r.documents as StoredDocument[] | null) ?? [],
        request_status: (r.request_status as string) ?? 'submitted',
        quotation_status: (r.quotation_status as string) ?? 'none',
        operational_status: (r.operational_status as string) ?? 'not_scheduled',
        booking_reference: (r.booking_reference as string | null) ?? null,
      });
    });
    (bizRes.data ?? []).forEach((r: Record<string, unknown>) => {
      const p = (r.business_profiles ?? {}) as Record<string, string | null>;
      unified.push({
        id: r.id as string, source: 'business', table: 'business_logistics_requests',
        request_ref: r.request_ref as string, title: r.title as string,
        service_type: r.service_type as string, description: (r.description as string) ?? '',
        origin: r.origin as string, destination: r.destination as string,
        quantity: (r.quantity as string) ?? '', weight: (r.weight as string) ?? '',
        preferred_date: r.preferred_date as string | null,
        budget_range: (r.budget_range as string) ?? '',
        vehicle_type: r.vehicle_type as string | null,
        status: r.status as string, admin_notes: (r.admin_notes as string) ?? '',
        fee_amount: (r.fee_amount as number | null) ?? null,
        payment_status: (r.payment_status as string) ?? 'unpaid',
        created_at: r.created_at as string,
        requester_name: p.company_name ?? p.contact_person ?? 'Unknown',
        requester_phone: p.phone ?? '', requester_email: p.email ?? '',
        documents: (r.documents as StoredDocument[] | null) ?? [],
        request_status: (r.request_status as string) ?? 'submitted',
        quotation_status: (r.quotation_status as string) ?? 'none',
        operational_status: (r.operational_status as string) ?? 'not_scheduled',
        booking_reference: (r.booking_reference as string | null) ?? null,
      });
    });

    unified.sort((a, b) => b.created_at.localeCompare(a.created_at));
    setRequests(unified);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => requests.filter(r => {
    const q = search.trim().toLowerCase();
    const matchSearch = q === '' ||
      r.request_ref.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) ||
      r.requester_name.toLowerCase().includes(q) || r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) || r.service_type.toLowerCase().includes(q);
    const matchSource = sourceFilter === 'all' || r.source === sourceFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchSource && matchStatus;
  }), [requests, search, sourceFilter, statusFilter]);

  const counts = useMemo(() => ({
    all: requests.length,
    individual: requests.filter(r => r.source === 'individual').length,
    agent: requests.filter(r => r.source === 'agent').length,
    business: requests.filter(r => r.source === 'business').length,
  }), [requests]);

  const openDetail = async (r: UnifiedRequest) => {
    setSelected(r);
    setEditStatus(r.status);
    setEditNotes(r.admin_notes);
    setEditFee(r.fee_amount != null ? String(r.fee_amount) : '');
    setEditPaymentStatus(r.payment_status || 'unpaid');
    setActionError('');
    setRequestQuotes([]);
    setWorkflowLog([]);
    fetchQuotations(r.table, r.id).then(qs => setRequestQuotes(qs)).catch(() => setRequestQuotes([]));
    fetchWorkflowHistory(r.table, r.id).then(log => setWorkflowLog(log)).catch(() => setWorkflowLog([]));
  };

  const feeEditable = FEE_EDITABLE_STATUSES.includes(editStatus);

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    setActionError('');

    const canSetFee = FEE_EDITABLE_STATUSES.includes(editStatus);
    const parsedFee = editFee.trim() === '' ? null : Number(editFee);
    if (editFee.trim() !== '' && (Number.isNaN(parsedFee) || parsedFee! < 0)) {
      setActionError('Fee amount must be a positive number.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from(selected.table).update({
      status: editStatus,
      admin_notes: editNotes,
      ...(canSetFee ? {
        fee_amount: parsedFee,
        // Clearing the fee forces the request back to unpaid
        payment_status: parsedFee == null ? 'unpaid' : editPaymentStatus,
      } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', selected.id);
    if (error) {
      setActionError('Could not save changes. Please try again.');
      setSaving(false);
      return;
    }
    const feeAmount = canSetFee ? parsedFee : selected.fee_amount;
    const paymentStatus = canSetFee ? (parsedFee == null ? 'unpaid' : editPaymentStatus) : selected.payment_status;
    setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, status: editStatus, admin_notes: editNotes, fee_amount: feeAmount, payment_status: paymentStatus } : r));
    setSelected(prev => prev ? { ...prev, status: editStatus, admin_notes: editNotes, fee_amount: feeAmount, payment_status: paymentStatus } : prev);
    logAdminAction({
      action: 'logistics_request.update',
      category: 'logistics',
      entityType: selected.table,
      entityId: selected.id,
      entityLabel: selected.request_ref,
      details: {
        title: selected.title,
        old_status: selected.status,
        new_status: editStatus,
        fee_amount: feeAmount,
        payment_status: paymentStatus,
        ...(canSetFee && selected.fee_amount !== feeAmount ? { old_fee_amount: selected.fee_amount } : {}),
      },
    });
    setSaving(false);
  };

  const quickSetStatus = async (r: UnifiedRequest, status: string) => {
    setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    if (selected?.id === r.id) setSelected(prev => prev ? { ...prev, status } : prev);
    const { error } = await supabase.from(r.table).update({ status, updated_at: new Date().toISOString() }).eq('id', r.id);
    if (error) {
      setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: r.status } : x));
      return;
    }
    logAdminAction({
      action: 'logistics_request.status_change',
      category: 'logistics',
      entityType: r.table,
      entityId: r.id,
      entityLabel: r.request_ref,
      details: { title: r.title, old_status: r.status, new_status: status },
    });
  };

  const setReviewState = async (state: 'under_review' | 'awaiting_quotation') => {
    if (!selected) return;
    setSaving(true);
    setActionError('');
    try {
      await updateReviewStatus(selected.table, selected.id, state);
      await fetchAll();
      setSelected(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not update the review status.');
    } finally {
      setSaving(false);
    }
  };

  const requestInfo = async () => {
    if (!selected) return;
    const msg = window.prompt('What information do you need from the requester?');
    if (msg == null || msg.trim() === '') return;
    setSaving(true);
    setActionError('');
    try {
      await sendInformationRequest(selected.table, selected.id, msg.trim());
      await fetchAll();
      setSelected(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not send the information request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Logistics Requests</h1>
              <p className="text-gray-500 text-sm">All requests from individuals, agents and businesses</p>
            </div>
          </div>
          <button onClick={fetchAll} className={`p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([['all', 'All Requests', Truck, 'text-slate-600 bg-slate-100'], ['individual', 'Individuals', User, 'text-blue-600 bg-blue-50'], ['agent', 'Agents', Users, 'text-orange-600 bg-orange-50'], ['business', 'Businesses', Building2, 'text-emerald-600 bg-emerald-50']] as const).map(([key, label, Icon, tint]) => (
            <button key={key} onClick={() => setSourceFilter(key)}
              className={`bg-white rounded-2xl border p-5 text-left transition-all hover:shadow-md ${sourceFilter === key ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{counts[key]}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by reference, title, requester, route…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none">
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Truck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No logistics requests found</p>
              <p className="text-gray-400 text-sm mt-1">Requests from all portals will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(r => {
                const meta = SOURCE_META[r.source];
                const SIcon = meta.icon;
                return (
                  <div key={`${r.table}-${r.id}`} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${meta.chip}`}>
                          <SIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.chip}`}>{meta.label}</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[r.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>{cap(r.status)}</span>
                            {r.quotation_status !== 'none' && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">Quotation: {cap(r.quotation_status)}</span>
                            )}
                            {r.booking_reference && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">{r.booking_reference}</span>
                            )}
                            {r.fee_amount != null && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${r.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {naira(r.fee_amount)} · {cap(r.payment_status)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{r.request_ref} · {r.requester_name} · {fmtDate(r.created_at)}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.origin} → {r.destination}</span>
                            <span className="flex items-center gap-1 capitalize"><Package className="h-3.5 w-3.5" />{cap(r.service_type)}</span>
                            {(r.weight || r.quantity) && <span>{[r.quantity, r.weight].filter(Boolean).join(' · ')}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select value={r.status} onChange={e => quickSetStatus(r, e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                        </select>
                        <button onClick={() => openDetail(r)}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors">
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail / manage panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-gray-400">{selected.request_ref}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SOURCE_META[selected.source].chip}`}>
                  {SOURCE_META[selected.source].label} request
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[selected.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {cap(selected.status)}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Requester</p>
                  <p className="font-medium text-gray-900">{selected.requester_name}</p>
                  {(selected.requester_phone || selected.requester_email) && (
                    <p className="text-gray-500 text-xs mt-0.5">{[selected.requester_phone, selected.requester_email].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Service</p>
                  <p className="font-medium text-gray-900 capitalize">{cap(selected.service_type)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Route</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gray-400" />{selected.origin} → {selected.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Preferred date</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gray-400" />{selected.preferred_date ? fmtDate(selected.preferred_date) : '—'}</p>
                </div>
                {selected.quantity && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Quantity</p>
                    <p className="font-medium text-gray-900">{selected.quantity}</p>
                  </div>
                )}
                {selected.weight && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Weight</p>
                    <p className="font-medium text-gray-900">{selected.weight}</p>
                  </div>
                )}
                {selected.vehicle_type && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Vehicle</p>
                    <p className="font-medium text-gray-900 capitalize">{cap(selected.vehicle_type)}</p>
                  </div>
                )}
                {selected.budget_range && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Budget</p>
                    <p className="font-medium text-gray-900">{selected.budget_range}</p>
                  </div>
                )}
              </div>

              {selected.description && <DescriptionBlock text={selected.description} />}

              {/* Review workflow actions */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  <ClipboardList className="h-3.5 w-3.5" /> Review workflow
                </p>
                <div className="grid sm:grid-cols-3 gap-2">
                  <button onClick={() => setReviewState('under_review')} disabled={saving}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60">
                    <Eye className="h-3.5 w-3.5" /> Under Review
                  </button>
                  <button onClick={() => setReviewState('awaiting_quotation')} disabled={saving}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60">
                    <Quote className="h-3.5 w-3.5" /> Awaiting Quotation
                  </button>
                  <button onClick={requestInfo} disabled={saving}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-blue-200 bg-white text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60">
                    <StickyNote className="h-3.5 w-3.5" /> More Info Required
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Bookings are only created when the customer accepts a quotation — submitting a request never confirms a booking.
                </p>
              </div>

              {/* Quotations */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <FileText className="h-3.5 w-3.5" /> Quotations
                  </p>
                  <button onClick={() => setBuildingQuotation(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors">
                    <Plus className="h-3 w-3" /> New / Draft
                  </button>
                </div>
                {requestQuotes.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-gray-400">No quotations yet. Build one to send the requester a price.</p>
                ) : (
                  <div className="divide-y divide-gray-50 px-2 pb-2">
                    {requestQuotes.map(q => {
                      const expired = q.status === 'sent' && q.valid_until && new Date(q.valid_until) <= new Date();
                      return (
                        <div key={q.id} className="px-2 py-2.5 flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 flex items-center gap-2">
                              v{q.version_number}
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">{cap(q.status)}</span>
                              {expired && <span className="text-[11px] font-semibold text-red-500">expired</span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{q.quotation_ref} · sent {q.sent_at ? fmtDate(q.sent_at) : '—'}</p>
                          </div>
                          <span className="font-semibold text-gray-900 whitespace-nowrap">₦{Number(q.total_amount).toLocaleString('en-NG')}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Workflow history */}
              {workflowLog.length > 0 && (
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">
                    <History className="h-3.5 w-3.5" /> Workflow history
                  </p>
                  <div className="divide-y divide-gray-50 px-4 pb-3">
                    {workflowLog.map((h, i) => (
                      <div key={(h.id as string) ?? i} className="py-2 text-xs">
                        <p className="text-gray-700 font-medium">
                          {cap(String(h.action_type ?? 'event'))}
                          {h.version_number != null ? <span className="text-gray-400"> · v{h.version_number as number}</span> : null}
                        </p>
                        <p className="text-gray-400 mt-0.5">
                          {h.created_at ? fmtDate(h.created_at as string) : ''} · {h.actor_type === 'admin' ? 'Admin' : 'Customer'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.documents.length > 0 && (
                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">Attached Documents</p>
                  <div className="divide-y divide-gray-50">
                    {selected.documents.map((doc, i) => (
                      <AdminDocumentRow key={doc.path || i} doc={doc} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
              </div>

              {feeEditable && (
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 space-y-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 uppercase tracking-wide">
                    <DollarSign className="h-3.5 w-3.5" /> Service Fee
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">Fee cost (₦)</label>
                      <input type="number" min="0" step="0.01" value={editFee} onChange={e => setEditFee(e.target.value)}
                        placeholder="e.g. 15000"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1.5 block">Payment status</label>
                      <select value={editPaymentStatus} onChange={e => setEditPaymentStatus(e.target.value)} disabled={editFee.trim() === ''}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400">
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {editFee.trim() === ''
                      ? 'Leave the fee empty while the cost is not yet fixed — the request stays unpaid.'
                      : `The requester will see a fee of ₦${Number(editFee || 0).toLocaleString('en-NG')} for this request.`}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5" /> Admin notes (visible to the requester)
                </label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                  placeholder="Add a note about this request…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none" />
              </div>

              {actionError && (
                <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <CheckCircle className="h-4 w-4" /> {actionError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={saveChanges} disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button onClick={() => setSelected(null)}
                  className="px-6 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && buildingQuotation && (
        <QuotationBuilderModal
          requestTable={selected.table}
          requestId={selected.id}
          requestRef={selected.request_ref}
          quotations={requestQuotes}
          onClose={() => setBuildingQuotation(false)}
          onSaved={async () => {
            setBuildingQuotation(false);
            const updated = await fetchQuotations(selected.table, selected.id);
            setRequestQuotes(updated);
            fetchWorkflowHistory(selected.table, selected.id).then(log => setWorkflowLog(log)).catch(() => {});
            await fetchAll();
          }}
        />
      )}
    </div>
  );
}
