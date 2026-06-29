import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Package, Truck, Search, Eye, RefreshCw,
  ChevronDown, MapPin, Phone, Mail, User, Send, MessageSquare,
  Check, CheckCheck, Plus, X, FileDown, Activity, Clock,
  CheckCircle, XCircle, TrendingUp, Filter,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BookingDetailModal from '../components/BookingDetailModal';
import InvoiceModal, { type InvoiceData } from '../components/InvoiceModal';

type Tab = 'overview' | 'individuals' | 'bookings' | 'requests' | 'messages';

interface Individual {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  created_at: string;
}

interface Booking {
  id: string;
  booking_ref: string;
  individual_id: string | null;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  pickup_city: string;
  delivery_city: string;
  package_type: string;
  package_description: string;
  weight_kg: number | null;
  declared_value: number | null;
  special_instructions: string;
  status: string;
  delivery_type: string | null;
  vehicle_type: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  individual_profiles: { full_name: string; phone: string; email: string } | null;
}

interface Request {
  id: string;
  request_ref: string;
  individual_id: string | null;
  title: string;
  description: string;
  service_type: string;
  vehicle_type: string | null;
  origin: string;
  destination: string;
  quantity: number | null;
  weight_kg: number | null;
  preferred_date: string | null;
  budget_range: string;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  individual_profiles: { full_name: string; phone: string; email: string } | null;
}

interface MsgThread {
  id: string;
  recipient_type: string;
  recipient_id: string;
  subject: string;
  created_at: string;
  updated_at: string;
  recipient_name?: string;
  unread_count?: number;
  last_message?: string;
}

interface MsgMessage {
  id: string;
  thread_id: string;
  sender_role: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const BOOKING_STATUS_OPTIONS = [
  'pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled',
  'national_in_transit', 'national_at_hub', 'national_out_for_delivery',
  'international_in_transit', 'customs_clearance', 'customs_hold', 'international_out_for_delivery',
];
const REQUEST_STATUS_OPTIONS = ['pending', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-orange-50 text-orange-600 border-orange-200',
  out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  national_in_transit: 'bg-sky-50 text-sky-700 border-sky-200',
  national_at_hub: 'bg-sky-50 text-sky-800 border-sky-300',
  national_out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  international_in_transit: 'bg-blue-50 text-blue-700 border-blue-200',
  customs_clearance: 'bg-amber-50 text-amber-700 border-amber-200',
  customs_hold: 'bg-red-50 text-red-700 border-red-200',
  international_out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function pct(n: number, d: number) { return d === 0 ? 0 : Math.round((n / d) * 100); }

export default function AdminIndividualsPage() {
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bStatusFilter, setBStatusFilter] = useState('all');
  const [rStatusFilter, setRStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // booking detail / invoice modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // request detail modal
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [requestStatus, setRequestStatus] = useState('');

  // messaging
  const [msgThreads, setMsgThreads] = useState<MsgThread[]>([]);
  const [msgActive, setMsgActive] = useState<MsgThread | null>(null);
  const [msgMessages, setMsgMessages] = useState<MsgMessage[]>([]);
  const [msgReply, setMsgReply] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState<Individual | null>(null);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState('');
  const msgBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 'messages') loadMsgThreads(); }, [tab]);
  useEffect(() => { if (msgActive) loadMsgMessages(msgActive.id); }, [msgActive]);
  useEffect(() => { msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgMessages]);

  const fetchAll = async () => {
    setLoading(true);
    const [indsRes, bookingsRes, requestsRes] = await Promise.all([
      supabase.from('individual_profiles').select('*').order('created_at', { ascending: false }),
      supabase
        .from('delivery_bookings')
        .select('*, individual_profiles(full_name, phone, email)')
        .not('individual_id', 'is', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('logistics_requests')
        .select('*, individual_profiles(full_name, phone, email)')
        .not('individual_id', 'is', null)
        .order('created_at', { ascending: false }),
    ]);
    setIndividuals(indsRes.data ?? []);
    setBookings(bookingsRes.data as Booking[] ?? []);
    setRequests(requestsRes.data as Request[] ?? []);
    setLoading(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    setActionLoading(id);
    await supabase.from('delivery_bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selectedBooking?.id === id) setSelectedBooking(prev => prev ? { ...prev, status } : prev);
    setActionLoading(null);
  };

  const saveRequestChanges = async () => {
    if (!selectedRequest) return;
    setActionLoading(selectedRequest.id);
    await supabase.from('logistics_requests').update({
      status: requestStatus,
      admin_notes: requestNotes,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedRequest.id);
    setRequests(prev => prev.map(r => r.id === selectedRequest.id
      ? { ...r, status: requestStatus, admin_notes: requestNotes } : r));
    setSelectedRequest(null);
    setActionLoading(null);
  };

  const loadMsgThreads = async () => {
    setMsgLoading(true);
    const { data } = await supabase
      .from('message_threads')
      .select('*')
      .eq('recipient_type', 'individual')
      .order('updated_at', { ascending: false });
    if (!data) { setMsgLoading(false); return; }
    const enriched = await Promise.all(data.map(async (t) => {
      const { data: profile } = await supabase
        .from('individual_profiles').select('full_name').eq('id', t.recipient_id).maybeSingle();
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('thread_id', t.id).eq('is_read', false).neq('sender_role', 'admin');
      const { data: last } = await supabase.from('messages').select('body')
        .eq('thread_id', t.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return { ...t, recipient_name: profile?.full_name ?? 'Unknown User', unread_count: count || 0, last_message: last?.body || '' };
    }));
    setMsgThreads(enriched);
    setMsgLoading(false);
  };

  const loadMsgMessages = async (threadId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    setMsgMessages(data || []);
    await supabase.from('messages').update({ is_read: true }).eq('thread_id', threadId).neq('sender_role', 'admin');
    setMsgThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread_count: 0 } : t));
  };

  const sendMsgReply = async () => {
    if (!msgReply.trim() || !msgActive || !adminUser) return;
    setMsgSending(true);
    await supabase.from('messages').insert({ thread_id: msgActive.id, sender_role: 'admin', sender_id: adminUser.id, body: msgReply.trim(), is_read: false });
    await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', msgActive.id);
    setMsgReply('');
    await loadMsgMessages(msgActive.id);
    await loadMsgThreads();
    setMsgSending(false);
  };

  const sendNewThread = async () => {
    if (!composeRecipient || !composeSubject.trim() || !composeBody.trim() || !adminUser) {
      setComposeError('Fill in all fields.'); return;
    }
    setComposeSending(true); setComposeError('');
    const { data: thread, error: te } = await supabase
      .from('message_threads')
      .insert({ recipient_type: 'individual', recipient_id: composeRecipient.id, subject: composeSubject.trim() })
      .select().maybeSingle();
    if (te || !thread) { setComposeError('Failed to create thread.'); setComposeSending(false); return; }
    await supabase.from('messages').insert({ thread_id: thread.id, sender_role: 'admin', sender_id: adminUser.id, body: composeBody.trim(), is_read: false });
    setComposing(false); setComposeRecipient(null); setComposeSubject(''); setComposeBody(''); setComposeError('');
    await loadMsgThreads();
    setComposeSending(false);
  };

  const fmtMsg = (iso: string) => {
    const d = new Date(iso); const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnread = msgThreads.reduce((s, t) => s + (t.unread_count || 0), 0);

  // ── Filtered lists ──
  const filteredIndividuals = individuals.filter(ind => {
    const q = search.toLowerCase();
    return !q || ind.full_name.toLowerCase().includes(q) || ind.email.toLowerCase().includes(q) || ind.phone?.includes(q) || ind.city?.toLowerCase().includes(q);
  });

  const filteredBookings = bookings.filter(b => {
    const matchStatus = bStatusFilter === 'all' || b.status === bStatusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.booking_ref.toLowerCase().includes(q) || b.sender_name.toLowerCase().includes(q)
      || b.recipient_name.toLowerCase().includes(q) || b.pickup_city.toLowerCase().includes(q) || b.delivery_city.toLowerCase().includes(q)
      || b.individual_profiles?.full_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const filteredRequests = requests.filter(r => {
    const matchStatus = rStatusFilter === 'all' || r.status === rStatusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.request_ref.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)
      || r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q)
      || r.individual_profiles?.full_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const openRequestModal = (r: Request) => {
    setSelectedRequest(r);
    setRequestStatus(r.status);
    setRequestNotes(r.admin_notes || '');
  };

  // ── Overview stats ──
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const deliveredBookings = bookings.filter(b => b.status === 'delivered').length;
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'individuals', label: 'Individuals', icon: Users, badge: individuals.length },
    { id: 'bookings', label: 'Delivery Bookings', icon: Package, badge: pendingBookings || undefined },
    { id: 'requests', label: 'Logistics Requests', icon: Truck, badge: pendingRequests || undefined },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: totalUnread || undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Individual Customers</h1>
              <p className="text-xs text-gray-400">Bookings, logistics & messaging</p>
            </div>
          </div>
          <button onClick={fetchAll} className="ml-auto p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative ${
                tab === t.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {(t.badge ?? 0) > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Individuals', value: individuals.length, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
                { label: 'Total Bookings', value: totalBookings, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Pending Bookings', value: pendingBookings, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { label: 'Delivered', value: deliveredBookings, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Logistics Requests', value: totalRequests, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Completed Requests', value: completedRequests, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <card.icon className={`h-4.5 w-4.5 ${card.color}`} style={{ width: 18, height: 18 }} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Booking status breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Booking Status Breakdown</h3>
                {['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(s => {
                  const count = bookings.filter(b => b.status === s).length;
                  return (
                    <div key={s} className="flex items-center gap-3 mb-3 last:mb-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium w-28 text-center flex-shrink-0 ${STATUS_BADGE[s] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{cap(s)}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all duration-700"
                          style={{ width: `${totalBookings === 0 ? 0 : (count / totalBookings) * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Request status breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Request Status Breakdown</h3>
                {REQUEST_STATUS_OPTIONS.map(s => {
                  const count = requests.filter(r => r.status === s).length;
                  return (
                    <div key={s} className="flex items-center gap-3 mb-3 last:mb-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium w-28 text-center flex-shrink-0 ${STATUS_BADGE[s] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{cap(s)}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 rounded-full transition-all duration-700"
                          style={{ width: `${totalRequests === 0 ? 0 : (count / totalRequests) * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-1">Delivery Rate</h3>
                <p className="text-3xl font-bold text-green-600">{pct(deliveredBookings, totalBookings)}%</p>
                <p className="text-sm text-gray-500 mt-1">{deliveredBookings} of {totalBookings} bookings delivered</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-1">Request Completion Rate</h3>
                <p className="text-3xl font-bold text-teal-600">{pct(completedRequests, totalRequests)}%</p>
                <p className="text-sm text-gray-500 mt-1">{completedRequests} of {totalRequests} requests completed</p>
              </div>
            </div>
          </div>
        )}

        {/* ── INDIVIDUALS TAB ── */}
        {tab === 'individuals' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, phone or city..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Requests</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...
                      </td></tr>
                    ) : filteredIndividuals.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No individuals found</td></tr>
                    ) : filteredIndividuals.map(ind => {
                      const indBookings = bookings.filter(b => b.individual_id === ind.id).length;
                      const indRequests = requests.filter(r => r.individual_id === ind.id).length;
                      return (
                        <tr key={ind.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-orange-600" />
                              </div>
                              <p className="font-semibold text-gray-900">{ind.full_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <p className="flex items-center gap-1 text-gray-600"><Mail className="h-3 w-3 text-gray-400" />{ind.email}</p>
                              {ind.phone && <p className="flex items-center gap-1 text-gray-600"><Phone className="h-3 w-3 text-gray-400" />{ind.phone}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {[ind.city, ind.state].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                              <Package className="h-3.5 w-3.5" />{indBookings}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600">
                              <Truck className="h-3.5 w-3.5" />{indRequests}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(ind.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by ref, name or city..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" style={{ display: 'inline' }} />
                <select
                  value={bStatusFilter} onChange={e => setBStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                >
                  <option value="all">All Statuses</option>
                  {BOOKING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Package</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...
                      </td></tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No bookings found</td></tr>
                    ) : filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.booking_ref}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{b.individual_profiles?.full_name ?? b.sender_name}</p>
                          <p className="text-xs text-gray-400">{b.sender_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs">{b.pickup_city} → {b.delivery_city}</span>
                          </div>
                          {b.delivery_type && <span className="text-xs text-gray-400">{cap(b.delivery_type)}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs">{cap(b.package_type || '—')}</p>
                          {b.weight_kg && <p className="text-xs text-gray-400">{b.weight_kg} kg</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative group">
                            <span className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${STATUS_BADGE[b.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {cap(b.status)}
                            </span>
                            {/* Dropdown on hover */}
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[180px] hidden group-hover:block">
                              <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Update Status</p>
                              {BOOKING_STATUS_OPTIONS.map(s => (
                                <button key={s} onClick={() => updateBookingStatus(b.id, s)}
                                  disabled={actionLoading === b.id}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${b.status === s ? 'font-bold text-orange-600' : 'text-gray-700'}`}>
                                  {b.status === s && <Check className="h-3 w-3" />}
                                  {cap(s)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(b.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedBooking(b)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500" title="View details">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setInvoiceData({
                                type: 'booking',
                                booking_ref: b.booking_ref,
                                sender_name: b.sender_name,
                                sender_phone: b.sender_phone,
                                sender_address: b.sender_address,
                                recipient_name: b.recipient_name,
                                recipient_phone: b.recipient_phone,
                                recipient_address: b.recipient_address,
                                pickup_city: b.pickup_city,
                                delivery_city: b.delivery_city,
                                package_type: b.package_type,
                                package_description: b.package_description,
                                weight_kg: b.weight_kg,
                                declared_value: b.declared_value,
                                special_instructions: b.special_instructions,
                                status: b.status,
                                created_at: b.created_at,
                                delivery_type: b.delivery_type ?? undefined,
                                vehicle_type: b.vehicle_type ?? undefined,
                              })}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500" title="Download invoice">
                              <FileDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by ref, title, customer or route..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="relative">
                <select
                  value={rStatusFilter} onChange={e => setRStatusFilter(e.target.value)}
                  className="pl-4 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                >
                  <option value="all">All Statuses</option>
                  {REQUEST_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...
                      </td></tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No requests found</td></tr>
                    ) : filteredRequests.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.request_ref}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{r.individual_profiles?.full_name ?? '—'}</p>
                          {r.individual_profiles?.phone && <p className="text-xs text-gray-400">{r.individual_profiles.phone}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 truncate max-w-[140px]">{r.title}</p>
                          <p className="text-xs text-gray-400">{cap(r.service_type)}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.origin} → {r.destination}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.budget_range || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_BADGE[r.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {cap(r.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(r.created_at)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => openRequestModal(r)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500" title="Review request">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {tab === 'messages' && (
          <div className="flex gap-4 h-[calc(100vh-240px)]">
            {/* Thread list */}
            <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conversations</p>
                <button
                  onClick={() => { setComposing(true); setComposeRecipient(null); setComposeSubject(''); setComposeBody(''); setComposeError(''); }}
                  className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  title="New message"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : msgThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                    <MessageSquare className="h-7 w-7 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">No conversations yet</p>
                  </div>
                ) : msgThreads.map(t => (
                  <button key={t.id} onClick={() => setMsgActive(t)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${msgActive?.id === t.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${(t.unread_count || 0) > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{t.recipient_name}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{fmtMsg(t.updated_at)}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{t.subject}</p>
                        {t.last_message && <p className="text-xs text-gray-400 truncate mt-0.5">{t.last_message}</p>}
                      </div>
                      {(t.unread_count || 0) > 0 && (
                        <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message area */}
            <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
              {msgActive ? (
                <>
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{msgActive.recipient_name}</p>
                      <p className="text-xs text-gray-400">{msgActive.subject}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {msgMessages.map(msg => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                            {!isAdmin && <p className="text-xs text-gray-400 px-1 font-medium">Customer</p>}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isAdmin ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                            }`}>{msg.body}</div>
                            <div className="flex items-center gap-1.5 px-1">
                              <span className="text-xs text-gray-400">{fmtMsg(msg.created_at)}</span>
                              {isAdmin && (msg.is_read ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3 text-gray-400" />)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={msgBottomRef} />
                  </div>
                  <div className="px-3 py-3 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={msgReply} onChange={e => setMsgReply(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsgReply(); } }}
                        placeholder="Reply to customer..."
                        rows={2}
                        className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      />
                      <button onClick={sendMsgReply} disabled={msgSending || !msgReply.trim()}
                        className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 flex-shrink-0">
                        {msgSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-600 mb-1">Select a conversation</p>
                  <p className="text-gray-400 text-sm">Or start a new message with an individual</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Request Detail Modal ── */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Logistics Request</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedRequest.request_ref}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Customer info */}
              {selectedRequest.individual_profiles && (
                <div className="bg-orange-50 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedRequest.individual_profiles.full_name}</p>
                    <p className="text-xs text-gray-500">{selectedRequest.individual_profiles.email}</p>
                    {selectedRequest.individual_profiles.phone && <p className="text-xs text-gray-500">{selectedRequest.individual_profiles.phone}</p>}
                  </div>
                </div>
              )}

              {/* Request details */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Title</p>
                  <p className="text-sm text-gray-800 font-medium">{selectedRequest.title}</p>
                </div>
                {selectedRequest.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
                    <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Service Type</p><p className="text-sm text-gray-800">{cap(selectedRequest.service_type)}</p></div>
                  <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Budget</p><p className="text-sm text-gray-800">{selectedRequest.budget_range || '—'}</p></div>
                  <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Origin</p><p className="text-sm text-gray-800">{selectedRequest.origin}</p></div>
                  <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Destination</p><p className="text-sm text-gray-800">{selectedRequest.destination}</p></div>
                  {selectedRequest.weight_kg && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Weight</p><p className="text-sm text-gray-800">{selectedRequest.weight_kg} kg</p></div>}
                  {selectedRequest.quantity && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Quantity</p><p className="text-sm text-gray-800">{selectedRequest.quantity}</p></div>}
                  {selectedRequest.preferred_date && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Preferred Date</p><p className="text-sm text-gray-800">{fmtDate(selectedRequest.preferred_date)}</p></div>}
                </div>
              </div>

              {/* Status update */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Update Status</label>
                <div className="relative">
                  <select value={requestStatus} onChange={e => setRequestStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none">
                    {REQUEST_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Admin notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Admin Notes</label>
                <textarea value={requestNotes} onChange={e => setRequestNotes(e.target.value)} rows={3}
                  placeholder="Add internal notes or feedback to customer..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setSelectedRequest(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveRequestChanges} disabled={actionLoading === selectedRequest.id}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50">
                {actionLoading === selectedRequest.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compose Message Modal ── */}
      {composing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">New Message</h3>
              <button onClick={() => setComposing(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {composeError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{composeError}</p>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Recipient</label>
                <div className="relative">
                  <select value={composeRecipient?.id || ''} onChange={e => setComposeRecipient(individuals.find(i => i.id === e.target.value) || null)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none">
                    <option value="">Select individual...</option>
                    {individuals.map(ind => <option key={ind.id} value={ind.id}>{ind.full_name} ({ind.email})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Subject</label>
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Message subject..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Message</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={4}
                  placeholder="Write your message..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setComposing(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={sendNewThread} disabled={composeSending}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50">
                {composeSending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Detail Modal ── */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={(id, status) => updateBookingStatus(id, status)}
        />
      )}

      {/* ── Invoice Modal ── */}
      {invoiceData && <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />}
    </div>
  );
}
