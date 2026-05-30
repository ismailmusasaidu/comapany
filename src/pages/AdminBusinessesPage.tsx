import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock,
  Search, Eye, Building2, MapPin, Phone, Mail, RefreshCw,
  ChevronDown, AlertCircle, TrendingUp, Target, Activity, Award,
  ArrowUpRight, ArrowDownRight, Minus, BarChart3, Zap, Globe, Users, Briefcase,
  MessageSquare, Send, Plus, X, Check, CheckCheck, FileDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import InvoiceModal, { type InvoiceData } from '../components/InvoiceModal';

type Tab = 'overview' | 'businesses' | 'bookings' | 'requests' | 'messages';
type BizStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface Business {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  industry: string;
  company_size: string;
  address: string;
  city: string;
  registration_number: string;
  tax_id: string;
  status: string;
  rejection_reason: string;
  created_at: string;
}

interface Booking {
  id: string;
  booking_ref: string;
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
  delivery_type?: string | null;
  vehicle_type?: string | null;
  created_at: string;
  updated_at: string;
  business_profiles: { company_name: string; contact_person: string; phone: string; email: string } | null;
}

interface Request {
  id: string;
  request_ref: string;
  title: string;
  service_type: string;
  origin: string;
  destination: string;
  status: string;
  created_at: string;
  admin_notes: string;
  vehicle_type?: string | null;
  business_profiles: { company_name: string; contact_person: string } | null;
}

const REQUEST_STATUS_OPTIONS = ['pending', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected'];
const BOOKING_STATUS_OPTIONS = [
  // General
  'pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled',
  // National (inter-state)
  'national_in_transit', 'national_at_hub', 'national_out_for_delivery',
  // International
  'international_in_transit', 'customs_clearance', 'customs_hold', 'international_out_for_delivery',
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-orange-50 text-orange-600 border-orange-200',
  out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  // National
  national_in_transit: 'bg-sky-50 text-sky-700 border-sky-200',
  national_at_hub: 'bg-sky-50 text-sky-800 border-sky-300',
  national_out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  // International
  international_in_transit: 'bg-blue-50 text-blue-700 border-blue-200',
  customs_clearance: 'bg-amber-50 text-amber-700 border-amber-200',
  customs_hold: 'bg-red-50 text-red-700 border-red-200',
  international_out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  // Logistics
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmt(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
function pct(n: number, d: number) { return d === 0 ? 0 : Math.round((n / d) * 100); }
function trend(curr: number, prev: number): { dir: 'up' | 'down' | 'flat'; pct: number } {
  if (prev === 0) return { dir: curr > 0 ? 'up' : 'flat', pct: 0 };
  const p = Math.round(((curr - prev) / prev) * 100);
  return { dir: p > 0 ? 'up' : p < 0 ? 'down' : 'flat', pct: Math.abs(p) };
}

function TrendBadge({ value }: { value: { dir: 'up' | 'down' | 'flat'; pct: number } }) {
  if (value.dir === 'flat') return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="h-3 w-3" /> 0%</span>;
  if (value.dir === 'up') return <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium"><ArrowUpRight className="h-3.5 w-3.5" /> {value.pct}%</span>;
  return <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium"><ArrowDownRight className="h-3.5 w-3.5" /> {value.pct}%</span>;
}

function Bar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const w = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${w}%` }} />
    </div>
  );
}

function GaugeChart({ value, color }: { value: number; color: string }) {
  const stroke = color;
  const dash = (value / 100) * 301.6;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="w-24 h-24">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#f3f4f6" strokeWidth="12" />
        <circle cx="60" cy="60" r="48" fill="none" stroke={stroke} strokeWidth="12"
          strokeDasharray={`${dash} 301.6`} strokeLinecap="round" transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">{value}%</span>
      </div>
    </div>
  );
}

interface MsgThread {
  id: string; recipient_type: string; recipient_id: string; subject: string;
  created_at: string; updated_at: string; recipient_name?: string;
  unread_count?: number; last_message?: string;
}
interface MsgMessage {
  id: string; thread_id: string; sender_role: string; sender_id: string;
  body: string; is_read: boolean; created_at: string;
}

export default function AdminBusinessesPage() {
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BizStatus>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [rejectionInput, setRejectionInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Messaging state ──
  const [msgThreads, setMsgThreads] = useState<MsgThread[]>([]);
  const [msgActive, setMsgActive] = useState<MsgThread | null>(null);
  const [msgMessages, setMsgMessages] = useState<MsgMessage[]>([]);
  const [msgReply, setMsgReply] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [composing, setComposing] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState<Business | null>(null);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState('');
  const msgBottomRef = useRef<HTMLDivElement>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  useEffect(() => { if (tab === 'messages') loadMsgThreads(); }, [tab]);
  useEffect(() => { if (msgActive) loadMsgMessages(msgActive.id); }, [msgActive]);
  useEffect(() => { msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgMessages]);

  const loadMsgThreads = async () => {
    setMsgLoading(true);
    const { data } = await supabase.from('message_threads').select('*').eq('recipient_type', 'business').order('updated_at', { ascending: false });
    if (!data) { setMsgLoading(false); return; }
    const enriched = await Promise.all(data.map(async (t) => {
      const { data: profile } = await supabase.from('business_profiles').select('company_name').eq('id', t.recipient_id).maybeSingle();
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('thread_id', t.id).eq('is_read', false).neq('sender_role', 'admin');
      const { data: last } = await supabase.from('messages').select('body').eq('thread_id', t.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return { ...t, recipient_name: profile?.company_name ?? 'Unknown Business', unread_count: count || 0, last_message: last?.body || '' };
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
    if (!composeRecipient || !composeSubject.trim() || !composeBody.trim() || !adminUser) { setComposeError('Fill in all fields.'); return; }
    setComposeSending(true); setComposeError('');
    const { data: thread, error: te } = await supabase.from('message_threads').insert({ recipient_type: 'business', recipient_id: composeRecipient.id, subject: composeSubject.trim() }).select().maybeSingle();
    if (te || !thread) { setComposeError('Failed to create thread.'); setComposeSending(false); return; }
    await supabase.from('messages').insert({ thread_id: thread.id, sender_role: 'admin', sender_id: adminUser.id, body: composeBody.trim(), is_read: false });
    setComposing(false); setComposeRecipient(null); setComposeSubject(''); setComposeBody(''); setComposeError('');
    await loadMsgThreads();
    setComposeSending(false);
  };

  const fmtMsg = (iso: string) => { const d = new Date(iso); const now = new Date(); return d.toDateString() === now.toDateString() ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' }); };
  const totalUnread = msgThreads.reduce((s, t) => s + (t.unread_count || 0), 0);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [bizRes, bRes, rRes] = await Promise.all([
      supabase.from('business_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('business_delivery_bookings')
        .select('*, business_profiles(company_name, contact_person, phone, email)')
        .order('created_at', { ascending: false }),
      supabase.from('business_logistics_requests')
        .select('*, business_profiles(company_name, contact_person)')
        .order('created_at', { ascending: false }),
    ]);
    setBusinesses(bizRes.data ?? []);
    setBookings(bRes.data ?? []);
    setRequests(rRes.data ?? []);
    setLoading(false);
  };

  const approveBusiness = async (id: string) => {
    setActionLoading(id);
    await supabase.from('business_profiles').update({ status: 'approved', rejection_reason: '' }).eq('id', id);
    await loadAll();
    setActionLoading(null);
    setSelectedBusiness(null);
  };

  const rejectBusiness = async (id: string, reason: string) => {
    if (!reason.trim()) return;
    setActionLoading(id);
    await supabase.from('business_profiles').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
    await loadAll();
    setActionLoading(null);
    setSelectedBusiness(null);
    setRejectionInput('');
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await supabase.from('business_delivery_bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from('business_logistics_requests').update({ status }).eq('id', id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const saveRequestNotes = async (id: string, notes: string) => {
    await supabase.from('business_logistics_requests').update({ admin_notes: notes }).eq('id', id);
  };

  // ─── Analytics ───────────────────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const totalBiz = businesses.length;
  const approvedBiz = businesses.filter(b => b.status === 'approved').length;
  const pendingBiz = businesses.filter(b => b.status === 'pending').length;
  const rejectedBiz = businesses.filter(b => b.status === 'rejected').length;

  const totalBookings = bookings.length;
  const bThisMonth = bookings.filter(b => b.created_at >= startOfMonth).length;
  const bLastMonth = bookings.filter(b => b.created_at >= startOfLastMonth && b.created_at <= endOfLastMonth).length;
  const deliveredBookings = bookings.filter(b => b.status === 'delivered').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const deliveryRate = pct(deliveredBookings, totalBookings - cancelledBookings);

  const totalRequests = requests.length;
  const rThisMonth = requests.filter(r => r.created_at >= startOfMonth).length;
  const rLastMonth = requests.filter(r => r.created_at >= startOfLastMonth && r.created_at <= endOfLastMonth).length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
  const rClosed = completedRequests + rejectedRequests;
  const requestSuccessRate = pct(completedRequests, rClosed);

  const bByStatus = BOOKING_STATUS_OPTIONS.reduce((acc, s) => { acc[s] = bookings.filter(b => b.status === s).length; return acc; }, {} as Record<string, number>);
  const rByStatus = REQUEST_STATUS_OPTIONS.reduce((acc, s) => { acc[s] = requests.filter(r => r.status === s).length; return acc; }, {} as Record<string, number>);

  const pkgCounts = bookings.reduce((acc, b) => { acc[b.package_type] = (acc[b.package_type] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const svcCounts = requests.reduce((acc, r) => { acc[r.service_type] = (acc[r.service_type] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const industryCounts = businesses.reduce((acc, b) => { acc[b.industry] = (acc[b.industry] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  const topBusinesses = businesses
    .filter(b => b.status === 'approved')
    .map(b => ({ ...b, bookingCount: bookings.filter(bk => bk.business_profiles?.company_name === b.company_name).length }))
    .sort((a, biz) => biz.bookingCount - a.bookingCount)
    .slice(0, 5);

  const bizTrend = trend(businesses.filter(b => b.created_at >= startOfMonth).length, businesses.filter(b => b.created_at >= startOfLastMonth && b.created_at <= endOfLastMonth).length);
  const bTrend = trend(bThisMonth, bLastMonth);
  const rTrend = trend(rThisMonth, rLastMonth);

  const filteredBusinesses = businesses.filter(b => {
    const matchSearch = b.company_name.toLowerCase().includes(search.toLowerCase()) ||
      b.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" /> Business Management
            </h1>
            <p className="text-gray-500 text-xs">Manage business accounts, bookings, and logistics requests</p>
          </div>
          <button onClick={loadAll} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex border-t border-gray-100">
          {([
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'businesses', label: 'Businesses', icon: Building2, badge: pendingBiz },
            { key: 'bookings', label: 'Bookings', icon: Package },
            { key: 'requests', label: 'Requests', icon: Truck },
            { key: 'messages', label: 'Messages', icon: MessageSquare, badge: totalUnread || undefined },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key as Tab)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all relative ${
                tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                  <span className="absolute w-5 h-5 rounded-full bg-red-400 animate-ping opacity-75" />
                  <span className="relative">{t.badge}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── OVERVIEW TAB ─────────────────────────────────────────────────── */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Hero KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: Building2, label: 'Total Businesses', value: totalBiz, sub: `${pendingBiz} pending`, color: 'bg-blue-50 text-blue-600', trend: bizTrend },
                    { icon: Package, label: 'Total Bookings', value: totalBookings, sub: `${bThisMonth} this month`, color: 'bg-orange-50 text-orange-600', trend: bTrend },
                    { icon: Target, label: 'Delivery Rate', value: `${deliveryRate}%`, sub: `${deliveredBookings} delivered`, color: 'bg-green-50 text-green-600', trend: null },
                    { icon: Truck, label: 'Total Requests', value: totalRequests, sub: `${rThisMonth} this month`, color: 'bg-teal-50 text-teal-600', trend: rTrend },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${card.color.split(' ')[0]} rounded-xl flex items-center justify-center`}>
                          <card.icon className={`h-5 w-5 ${card.color.split(' ')[1]}`} />
                        </div>
                        {card.trend && <TrendBadge value={card.trend} />}
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Business health row */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Business status breakdown */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Business Status</h3>
                    <p className="text-gray-400 text-xs mb-5">Account approval breakdown</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Approved', value: approvedBiz, color: 'bg-green-400' },
                        { label: 'Pending', value: pendingBiz, color: 'bg-yellow-400' },
                        { label: 'Rejected', value: rejectedBiz, color: 'bg-red-400' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-16 flex-shrink-0">{row.label}</span>
                          <div className="flex-1"><Bar value={row.value} max={totalBiz || 1} color={row.color} /></div>
                          <div className="flex items-center gap-1 flex-shrink-0 w-12 justify-end">
                            <span className="text-xs font-bold text-gray-800">{row.value}</span>
                            <span className="text-xs text-gray-400">({pct(row.value, totalBiz || 1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-500">{approvedBiz}</p>
                        <p className="text-xs text-gray-400">Active</p>
                      </div>
                      <div className="border-x border-gray-100">
                        <p className="text-lg font-bold text-yellow-500">{pendingBiz}</p>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-400">{rejectedBiz}</p>
                        <p className="text-xs text-gray-400">Rejected</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Rate Gauge */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                      <h3 className="font-bold text-gray-900">Delivery Rate</h3>
                      <p className="text-gray-400 text-xs">Successful deliveries vs. total</p>
                    </div>
                    <GaugeChart value={deliveryRate} color={deliveryRate >= 80 ? '#22c55e' : deliveryRate >= 50 ? '#f97316' : '#ef4444'} />
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      deliveryRate >= 80 ? 'bg-green-50 text-green-600' :
                      deliveryRate >= 50 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {deliveryRate >= 80 ? 'Excellent Performance' : deliveryRate >= 50 ? 'Good Progress' : 'Needs Attention'}
                    </span>
                  </div>

                  {/* Request Success Gauge */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                      <h3 className="font-bold text-gray-900">Request Success Rate</h3>
                      <p className="text-gray-400 text-xs">Completed vs. closed requests</p>
                    </div>
                    <GaugeChart value={requestSuccessRate} color={requestSuccessRate >= 80 ? '#14b8a6' : requestSuccessRate >= 50 ? '#f97316' : '#ef4444'} />
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      requestSuccessRate >= 80 ? 'bg-teal-50 text-teal-600' :
                      requestSuccessRate >= 50 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {completedRequests} completed
                    </span>
                  </div>
                </div>

                {/* Pipelines + Top Businesses */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Booking Pipeline */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-gray-900">Booking Pipeline</h3>
                        <p className="text-gray-400 text-xs mt-0.5">Status across all business bookings</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <Activity className="h-3 w-3" /> Live
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Pending', value: bByStatus.pending, color: 'bg-yellow-400' },
                        { label: 'Confirmed', value: bByStatus.confirmed, color: 'bg-blue-400' },
                        { label: 'In Transit', value: (bByStatus.in_transit ?? 0) + (bByStatus.picked_up ?? 0), color: 'bg-orange-400' },
                        { label: 'Delivered', value: bByStatus.delivered, color: 'bg-green-400' },
                        { label: 'Cancelled', value: bByStatus.cancelled, color: 'bg-red-400' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                          <div className="flex-1"><Bar value={row.value ?? 0} max={totalBookings || 1} color={row.color} /></div>
                          <span className="text-xs font-bold text-gray-800 w-8 text-right flex-shrink-0">{row.value ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Pipeline */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-gray-900">Request Pipeline</h3>
                        <p className="text-gray-400 text-xs mt-0.5">Status across all logistics requests</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-teal-50 text-teal-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <Zap className="h-3 w-3" /> Active
                      </div>
                    </div>
                    <div className="space-y-3">
                      {REQUEST_STATUS_OPTIONS.map((s, i) => {
                        const colors = ['bg-yellow-400', 'bg-blue-400', 'bg-teal-400', 'bg-orange-400', 'bg-green-400', 'bg-red-400'];
                        return (
                          <div key={s} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{cap(s)}</span>
                            <div className="flex-1"><Bar value={rByStatus[s] ?? 0} max={totalRequests || 1} color={colors[i]} /></div>
                            <span className="text-xs font-bold text-gray-800 w-8 text-right flex-shrink-0">{rByStatus[s] ?? 0}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Package Types + Service Types + Top Businesses */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Package types */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Package Types</h3>
                    <p className="text-gray-400 text-xs mb-5">Shipment categories</p>
                    {Object.keys(pkgCounts).length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No data</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(pkgCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{cap(k)}</span>
                            <div className="flex-1"><Bar value={v} max={totalBookings || 1} color="bg-blue-400" /></div>
                            <span className="text-xs font-bold text-gray-800 flex-shrink-0">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Service types */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Service Types</h3>
                    <p className="text-gray-400 text-xs mb-5">Requested logistics services</p>
                    {Object.keys(svcCounts).length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No data</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(svcCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{cap(k)}</span>
                            <div className="flex-1"><Bar value={v} max={totalRequests || 1} color="bg-teal-400" /></div>
                            <span className="text-xs font-bold text-gray-800 flex-shrink-0">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Industries */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Top Industries</h3>
                    <p className="text-gray-400 text-xs mb-5">Business sectors served</p>
                    {Object.keys(industryCounts).length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No data</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-24 flex-shrink-0 truncate">{k}</span>
                            <div className="flex-1"><Bar value={v} max={totalBiz || 1} color="bg-orange-400" /></div>
                            <span className="text-xs font-bold text-gray-800 flex-shrink-0">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Businesses */}
                {topBusinesses.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Top Businesses by Bookings</h3>
                    <p className="text-gray-400 text-xs mb-5">Most active business accounts</p>
                    <div className="space-y-3">
                      {topBusinesses.map((b, i) => (
                        <div key={b.id} className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            i === 0 ? 'bg-yellow-50 text-yellow-600' : i === 1 ? 'bg-gray-50 text-gray-500' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
                          }`}>#{i + 1}</div>
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {b.company_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{b.company_name}</p>
                            <p className="text-xs text-gray-400 truncate">{b.industry} · {b.city}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-900 text-sm">{b.bookingCount}</p>
                            <p className="text-xs text-gray-400">bookings</p>
                          </div>
                          <div className="w-32 hidden sm:block">
                            <Bar value={b.bookingCount} max={topBusinesses[0].bookingCount || 1} color="bg-blue-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secondary KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: CheckCircle, label: 'Approved Businesses', value: approvedBiz, color: 'text-green-600 bg-green-50' },
                    { icon: Award, label: 'Cancellation Rate', value: `${pct(cancelledBookings, totalBookings)}%`, color: 'text-orange-500 bg-orange-50' },
                    { icon: TrendingUp, label: 'Req. Success Rate', value: `${requestSuccessRate}%`, color: 'text-teal-600 bg-teal-50' },
                    { icon: Clock, label: 'Pending Approvals', value: pendingBiz, color: 'text-yellow-600 bg-yellow-50' },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 ${card.color.split(' ')[1]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <card.icon className={`h-5 w-5 ${card.color.split(' ')[0]}`} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-500">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── BUSINESSES TAB ───────────────────────────────────────────────── */}
            {tab === 'businesses' && (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search businesses..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div className="flex gap-1.5">
                    {(['all', 'pending', 'approved', 'rejected'] as BizStatus[]).map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                        }`}>
                        {cap(s)} {s === 'all' ? `(${businesses.length})` : `(${businesses.filter(b => b.status === s).length})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {filteredBusinesses.length === 0 ? (
                    <div className="p-12 text-center">
                      <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400">No businesses found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filteredBusinesses.map(b => (
                        <div key={b.id} className="p-4 sm:p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                              {b.company_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{b.company_name}</h4>
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[b.status] ?? ''}`}>
                                  {cap(b.status)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {b.industry}</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {cap(b.company_size)}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.city}</span>
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {b.phone}</span>
                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {b.email}</span>
                              </div>
                              {b.status === 'rejected' && b.rejection_reason && (
                                <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Reason: {b.rejection_reason}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">Registered {fmt(b.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => { setSelectedBusiness(b); setRejectionInput(''); }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-700">
                                <Eye className="h-4 w-4" />
                              </button>
                              {b.status === 'pending' && (
                                <>
                                  <button onClick={() => approveBusiness(b.id)} disabled={actionLoading === b.id}
                                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60">
                                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                                  </button>
                                  <button onClick={() => setSelectedBusiness(b)}
                                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all">
                                    <XCircle className="h-3.5 w-3.5" /> Reject
                                  </button>
                                </>
                              )}
                              {b.status === 'approved' && (
                                <button onClick={() => setSelectedBusiness(b)}
                                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border border-red-200">
                                  <XCircle className="h-3.5 w-3.5" /> Revoke
                                </button>
                              )}
                              {b.status === 'rejected' && (
                                <button onClick={() => approveBusiness(b.id)} disabled={actionLoading === b.id}
                                  className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border border-green-200">
                                  <CheckCircle className="h-3.5 w-3.5" /> Re-approve
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── BOOKINGS TAB ─────────────────────────────────────────────────── */}
            {tab === 'bookings' && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {bookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No bookings yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Reference</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Business</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Package</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bookings.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-gray-900 text-xs">{b.booking_ref}</p>
                              <p className="text-xs text-gray-400">{b.recipient_name}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-xs text-gray-800">{b.business_profiles?.company_name ?? '—'}</p>
                              <p className="text-xs text-gray-400">{b.business_profiles?.contact_person ?? ''}</p>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-600">
                              <span className="font-medium">{b.pickup_city}</span>
                              <span className="mx-1 text-gray-300">→</span>
                              <span className="font-medium">{b.delivery_city}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-lg font-medium">{cap(b.package_type)}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <select
                                value={b.status}
                                onChange={e => updateBookingStatus(b.id, e.target.value)}
                                className={`text-xs font-medium px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${STATUS_BADGE[b.status] ?? ''}`}
                              >
                                {BOOKING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                              </select>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-400">
                              <div className="flex items-center gap-2">
                                <span>{fmt(b.created_at)}</span>
                                <button onClick={() => setInvoiceData({ type: 'booking', ...b, business_name: b.business_profiles?.company_name, business_contact: b.business_profiles?.contact_person, business_phone: b.business_profiles?.phone, business_email: b.business_profiles?.email })}
                                  title="Generate Invoice"
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200">
                                  <FileDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ─── REQUESTS TAB ─────────────────────────────────────────────────── */}
            {tab === 'requests' && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {requests.length === 0 ? (
                  <div className="p-12 text-center">
                    <Truck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No requests yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {requests.map(r => (
                      <div key={r.id} className="p-5">
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900 text-sm">{r.title}</p>
                              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[r.status] ?? ''}`}>
                                {cap(r.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-2">
                              <span>{r.request_ref}</span>
                              <span className="font-medium text-gray-700">{cap(r.service_type)}</span>
                              {(r as Request).vehicle_type && <span className="text-gray-400"> · {cap((r as Request).vehicle_type!)}</span>}
                              <span>{r.business_profiles?.company_name ?? '—'}</span>
                              <span>{r.origin} → {r.destination}</span>
                              <span>{fmt(r.created_at)}</span>
                            </div>
                            <input
                              type="text"
                              defaultValue={r.admin_notes}
                              placeholder="Admin notes..."
                              onBlur={e => saveRequestNotes(r.id, e.target.value)}
                              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-300 bg-gray-50"
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <select value={r.status} onChange={e => updateRequestStatus(r.id, e.target.value)}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${STATUS_BADGE[r.status] ?? ''}`}>
                              {REQUEST_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                            </select>
                            <button onClick={() => setInvoiceData({ type: 'request', ...r, business_name: r.business_profiles?.company_name, business_contact: r.business_profiles?.contact_person, vehicle_type: r.vehicle_type ?? undefined })}
                              title="Generate Invoice"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-gray-200">
                              <FileDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* ─── MESSAGES TAB ─────────────────────────────────────────────────── */}
            {tab === 'messages' && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">Business Conversations</p>
                  <button onClick={() => setComposing(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all">
                    <Plus className="h-3.5 w-3.5" /> New Message
                  </button>
                </div>
                <div className="flex h-[520px]">
                  {/* Thread list */}
                  <div className="w-64 border-r border-gray-100 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="px-3 py-2 border-b border-gray-50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search..."
                          className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg border-0 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                      {msgLoading ? (
                        <div className="flex items-center justify-center h-24"><span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
                      ) : msgThreads.filter(t => (t.recipient_name || '').toLowerCase().includes(msgSearch.toLowerCase()) || t.subject.toLowerCase().includes(msgSearch.toLowerCase())).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                          <MessageSquare className="h-6 w-6 text-gray-200 mb-2" />
                          <p className="text-gray-400 text-xs">No conversations yet</p>
                        </div>
                      ) : msgThreads.filter(t => (t.recipient_name || '').toLowerCase().includes(msgSearch.toLowerCase()) || t.subject.toLowerCase().includes(msgSearch.toLowerCase())).map(t => (
                        <button key={t.id} onClick={() => setMsgActive(t)}
                          className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors ${msgActive?.id === t.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''}`}>
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Building2 className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-900 truncate">{t.recipient_name}</p>
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{fmtMsg(t.updated_at)}</span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{t.subject}</p>
                              {t.last_message && <p className="text-xs text-gray-400 truncate">{t.last_message}</p>}
                            </div>
                            {(t.unread_count || 0) > 0 && (
                              <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">{t.unread_count}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {msgActive ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{msgActive.recipient_name}</p>
                            <p className="text-xs text-gray-400">{msgActive.subject}</p>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                          {msgMessages.map(msg => {
                            const isAdmin = msg.sender_role === 'admin';
                            return (
                              <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[72%] flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                                  {!isAdmin && <p className="text-xs text-gray-400 px-1">Business</p>}
                                  <div className={`px-3 py-2.5 rounded-xl text-xs leading-relaxed ${isAdmin ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                                    {msg.body}
                                  </div>
                                  <div className="flex items-center gap-1 px-1">
                                    <span className="text-xs text-gray-400">{fmtMsg(msg.created_at)}</span>
                                    {isAdmin && (msg.is_read ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3 text-gray-400" />)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={msgBottomRef} />
                        </div>
                        <div className="px-3 py-2.5 border-t border-gray-100 flex items-end gap-2">
                          <textarea value={msgReply} onChange={e => setMsgReply(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsgReply(); } }}
                            placeholder="Reply... (Enter to send)" rows={2}
                            className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border-0 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                          <button onClick={sendMsgReply} disabled={msgSending || !msgReply.trim()}
                            className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50">
                            {msgSending ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                        <MessageSquare className="h-10 w-10 text-gray-200 mb-3" />
                        <p className="text-sm font-semibold text-gray-500 mb-1">Select a conversation</p>
                        <p className="text-xs text-gray-400 mb-4">Or start a new message to a business</p>
                        <button onClick={() => setComposing(true)}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all">
                          <Plus className="h-3.5 w-3.5" /> New Message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compose Modal */}
      {composing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Message to Business</h2>
              <button onClick={() => { setComposing(false); setComposeRecipient(null); setComposeSubject(''); setComposeBody(''); setComposeError(''); }}
                className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {composeError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">{composeError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">To (Business)</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select value={composeRecipient?.id || ''} onChange={e => setComposeRecipient(businesses.find(b => b.id === e.target.value) || null)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
                    <option value="">Select a business...</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.company_name} — {b.city}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Message subject..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message..." rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setComposing(false); setComposeRecipient(null); setComposeSubject(''); setComposeBody(''); setComposeError(''); }}
                className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">Cancel</button>
              <button onClick={sendNewThread} disabled={composeSending}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50">
                {composeSending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full my-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {selectedBusiness.company_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{selectedBusiness.company_name}</h3>
                  <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[selectedBusiness.status] ?? ''}`}>
                    {cap(selectedBusiness.status)}
                  </span>
                </div>
              </div>
              <button onClick={() => { setSelectedBusiness(null); setRejectionInput(''); }}
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { icon: Building2, label: 'Company', value: selectedBusiness.company_name },
                  { icon: Users, label: 'Contact Person', value: selectedBusiness.contact_person },
                  { icon: Mail, label: 'Email', value: selectedBusiness.email },
                  { icon: Phone, label: 'Phone', value: selectedBusiness.phone },
                  { icon: Globe, label: 'Industry', value: selectedBusiness.industry },
                  { icon: Briefcase, label: 'Company Size', value: cap(selectedBusiness.company_size) },
                  { icon: MapPin, label: 'City', value: selectedBusiness.city },
                  { icon: MapPin, label: 'Address', value: selectedBusiness.address },
                  { icon: AlertCircle, label: 'CAC / Reg No.', value: selectedBusiness.registration_number },
                  { icon: TrendingUp, label: 'TIN', value: selectedBusiness.tax_id || '—' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <item.icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="font-medium text-gray-800 text-xs">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedBusiness.status === 'rejected' && selectedBusiness.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-700">Rejection Reason</p>
                  <p className="text-sm text-red-600 mt-1">{selectedBusiness.rejection_reason}</p>
                </div>
              )}

              {(selectedBusiness.status === 'pending' || selectedBusiness.status === 'approved') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Rejection Reason (required for rejection)</label>
                  <input type="text" value={rejectionInput} onChange={e => setRejectionInput(e.target.value)}
                    placeholder="Explain why this business is being rejected..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setSelectedBusiness(null); setRejectionInput(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
                  Close
                </button>
                {selectedBusiness.status !== 'approved' && (
                  <button onClick={() => approveBusiness(selectedBusiness.id)} disabled={actionLoading === selectedBusiness.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60">
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                )}
                {selectedBusiness.status !== 'rejected' && (
                  <button onClick={() => rejectBusiness(selectedBusiness.id, rejectionInput)} disabled={!rejectionInput.trim() || actionLoading === selectedBusiness.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {invoiceData && <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />}
    </div>
  );
}
