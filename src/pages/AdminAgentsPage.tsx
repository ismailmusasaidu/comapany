import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Package, Truck, CheckCircle, XCircle, Clock,
  Search, Filter, Eye, Building2, MapPin, Phone, Mail, RefreshCw,
  ChevronDown, AlertCircle, TrendingUp, Target, Activity, Award,
  ArrowUpRight, ArrowDownRight, Minus, UserCheck, UserX, BarChart3, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BookingDetailModal from '../components/BookingDetailModal';

type Tab = 'overview' | 'agents' | 'bookings' | 'requests';
type AgentStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface Agent {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  city: string;
  id_number: string;
  address: string;
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
  created_at: string;
  updated_at: string;
  agent_profiles: { full_name: string; company_name: string; phone: string; email: string } | null;
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
  agent_profiles: { full_name: string; company_name: string } | null;
}

const BOOKING_STATUS_OPTIONS = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];
const REQUEST_STATUS_OPTIONS = ['pending', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-orange-50 text-orange-600 border-orange-200',
  out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function pct(n: number, d: number) { return d === 0 ? 0 : Math.round((n / d) * 100); }
function trend(curr: number, prev: number) {
  if (prev === 0) return { dir: curr > 0 ? 'up' : 'flat' as const, pct: 0 };
  const p = Math.round(((curr - prev) / prev) * 100);
  return { dir: (p > 0 ? 'up' : p < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat', pct: Math.abs(p) };
}

function TrendBadge({ value }: { value: { dir: 'up' | 'down' | 'flat'; pct: number } }) {
  if (value.dir === 'flat') return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="h-3 w-3" /> 0%</span>;
  if (value.dir === 'up') return <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium"><ArrowUpRight className="h-3.5 w-3.5" /> {value.pct}%</span>;
  return <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium"><ArrowDownRight className="h-3.5 w-3.5" /> {value.pct}%</span>;
}

function Bar({ value, max, color = 'bg-orange-500' }: { value: number; max: number; color?: string }) {
  const w = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${w}%` }} />
    </div>
  );
}

function GaugeChart({ value, color }: { value: number; color: string }) {
  const colorMap: Record<string, string> = {
    'text-green-500': '#22c55e', 'text-blue-500': '#3b82f6',
    'text-orange-500': '#f97316', 'text-red-500': '#ef4444',
    'text-teal-500': '#14b8a6',
  };
  const stroke = colorMap[color] ?? '#f97316';
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <circle cx="60" cy="60" r="48" fill="none" stroke="#f3f4f6" strokeWidth="14" />
      <circle cx="60" cy="60" r="48" fill="none" stroke={stroke}
        strokeWidth="14" strokeDasharray={`${(value / 100) * 301.6} 301.6`}
        strokeLinecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="64" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#111827">{value}%</text>
    </svg>
  );
}

function TopAgentsTable({ bookings }: { bookings: Booking[] }) {
  const agentMap: Record<string, { name: string; company: string; total: number; delivered: number }> = {};
  bookings.forEach(b => {
    const key = b.agent_profiles?.full_name ?? 'Unknown';
    if (!agentMap[key]) agentMap[key] = { name: key, company: b.agent_profiles?.company_name ?? '', total: 0, delivered: 0 };
    agentMap[key].total += 1;
    if (b.status === 'delivered') agentMap[key].delivered += 1;
  });
  const sorted = Object.values(agentMap).sort((a, b) => b.total - a.total).slice(0, 5);
  if (sorted.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No data yet</p>;
  return (
    <div className="space-y-3">
      {sorted.map((a, i) => (
        <div key={a.name} className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
            i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-500'
          }`}>{i + 1}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{a.name}</p>
            <p className="text-xs text-gray-400 truncate">{a.company}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-gray-900">{a.total}</p>
            <p className="text-xs text-gray-400">{pct(a.delivered, a.total)}% delivered</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAgentsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [agentsRes, bookingsRes, requestsRes] = await Promise.all([
      supabase.from('agent_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('delivery_bookings').select('*, agent_profiles(full_name, company_name, phone, email)').order('created_at', { ascending: false }),
      supabase.from('logistics_requests').select('*, agent_profiles(full_name, company_name)').order('created_at', { ascending: false }),
    ]);
    setAgents(agentsRes.data ?? []);
    setBookings(bookingsRes.data as Booking[] ?? []);
    setRequests(requestsRes.data as Request[] ?? []);
    setLoading(false);
  };

  const approveAgent = async (id: string) => {
    setActionLoading(id);
    await supabase.from('agent_profiles').update({ status: 'approved', rejection_reason: '' }).eq('id', id);
    await fetchAll();
    setSelectedAgent(null);
    setActionLoading(null);
  };

  const rejectAgent = async (id: string) => {
    setActionLoading(id);
    await supabase.from('agent_profiles').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id);
    await fetchAll();
    setSelectedAgent(null);
    setRejectReason('');
    setActionLoading(null);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await supabase.from('delivery_bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updateRequestStatus = async (id: string, status: string, notes?: string) => {
    await supabase.from('logistics_requests').update({ status, ...(notes !== undefined ? { admin_notes: notes } : {}) }).eq('id', id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, ...(notes !== undefined ? { admin_notes: notes } : {}) } : r));
  };

  const filteredAgents = agents.filter(a => {
    const matchSearch = search === '' || a.full_name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.company_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Derived analytics ──
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const approvedAgents = agents.filter(a => a.status === 'approved').length;
  const pendingAgents = agents.filter(a => a.status === 'pending').length;
  const rejectedAgents = agents.filter(a => a.status === 'rejected').length;
  const newAgentsThisMonth = agents.filter(a => a.created_at >= startOfMonth).length;
  const newAgentsLastMonth = agents.filter(a => a.created_at >= startOfLastMonth && a.created_at <= endOfLastMonth).length;

  const bByStatus = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const rByStatus = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const bByPkg = bookings.reduce((acc, b) => { acc[b.package_type] = (acc[b.package_type] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const rBySvc = requests.reduce((acc, r) => { acc[r.service_type] = (acc[r.service_type] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  const bThisMonth = bookings.filter(b => b.created_at >= startOfMonth).length;
  const bLastMonth = bookings.filter(b => b.created_at >= startOfLastMonth && b.created_at <= endOfLastMonth).length;
  const rThisMonth = requests.filter(r => r.created_at >= startOfMonth).length;
  const rLastMonth = requests.filter(r => r.created_at >= startOfLastMonth && r.created_at <= endOfLastMonth).length;

  const delivered = bByStatus.delivered ?? 0;
  const cancelled = bByStatus.cancelled ?? 0;
  const activable = bookings.length - cancelled;
  const completedReq = rByStatus.completed ?? 0;
  const rejectedReq = rByStatus.rejected ?? 0;
  const deliveryRate = pct(delivered, activable);
  const cancellationRate = pct(cancelled, bookings.length);
  const requestSuccessRate = pct(completedReq, completedReq + rejectedReq);

  const agentTrend = trend(newAgentsThisMonth, newAgentsLastMonth);
  const bTrend = trend(bThisMonth, bLastMonth);
  const rTrend = trend(rThisMonth, rLastMonth);

  const PKG_COLORS: Record<string, string> = { document: 'bg-blue-400', parcel: 'bg-orange-400', fragile: 'bg-yellow-400', heavy: 'bg-slate-500' };
  const SVC_COLORS: Record<string, string> = { freight: 'bg-blue-500', warehousing: 'bg-purple-500', express: 'bg-yellow-500', bulk: 'bg-green-500', customs: 'bg-orange-500', last_mile: 'bg-red-500' };

  const TABS = [
    { key: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { key: 'agents' as Tab, label: 'Agents', icon: Users, count: agents.length, alert: pendingAgents > 0 },
    { key: 'bookings' as Tab, label: 'Bookings', icon: Package, count: bookings.length },
    { key: 'requests' as Tab, label: 'Requests', icon: Truck, count: requests.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Agent Management</h1>
              <p className="text-gray-500 text-sm">Analytics, agents, bookings & logistics</p>
            </div>
          </div>
          <button onClick={fetchAll} className={`p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ─── Hero KPI cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`bg-white rounded-2xl border p-5 ${pendingAgents > 0 ? 'border-yellow-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <TrendBadge value={agentTrend} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{agents.length}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Total Agents</p>
            <div className="flex items-center gap-2 mt-2">
              {pendingAgents > 0 && (
                <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
                  {pendingAgents} pending
                </span>
              )}
              <span className="text-xs text-gray-400">{approvedAgents} active</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-orange-500" />
              </div>
              <TrendBadge value={bTrend} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Total Bookings</p>
            <p className="text-xs text-gray-400 mt-2">{bThisMonth} this month</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${deliveryRate >= 80 ? 'bg-green-50 text-green-600' : deliveryRate >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                {deliveryRate >= 80 ? 'Excellent' : deliveryRate >= 50 ? 'Good' : 'Low'}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{deliveryRate}%</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Delivery Rate</p>
            <div className="mt-2"><Bar value={deliveryRate} max={100} color="bg-green-500" /></div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <Truck className="h-5 w-5 text-teal-500" />
              </div>
              <TrendBadge value={rTrend} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Logistics Requests</p>
            <p className="text-xs text-gray-400 mt-2">{rThisMonth} this month</p>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  tab === t.key ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tab === t.key ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.count}
                  </span>
                )}
                {t.alert && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW TAB ══ */}
          {tab === 'overview' && (
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Agent health */}
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Agent status breakdown */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-1">Agent Status</h3>
                      <p className="text-gray-400 text-xs mb-5">Registration & approval breakdown</p>
                      <div className="space-y-3">
                        {[
                          { label: 'Approved', value: approvedAgents, color: 'bg-green-500', text: 'text-green-700' },
                          { label: 'Pending',  value: pendingAgents,  color: 'bg-yellow-400', text: 'text-yellow-700' },
                          { label: 'Rejected', value: rejectedAgents, color: 'bg-red-400', text: 'text-red-700' },
                        ].map(row => (
                          <div key={row.label} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-16 flex-shrink-0">{row.label}</span>
                            <div className="flex-1"><Bar value={row.value} max={agents.length || 1} color={row.color} /></div>
                            <span className={`text-xs font-bold w-8 text-right flex-shrink-0 ${row.text}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 text-center gap-2">
                        <div><p className="text-lg font-bold text-green-600">{pct(approvedAgents, agents.length)}%</p><p className="text-xs text-gray-400">Approved</p></div>
                        <div className="border-x border-gray-200"><p className="text-lg font-bold text-yellow-600">{pct(pendingAgents, agents.length)}%</p><p className="text-xs text-gray-400">Pending</p></div>
                        <div><p className="text-lg font-bold text-red-500">{pct(rejectedAgents, agents.length)}%</p><p className="text-xs text-gray-400">Rejected</p></div>
                      </div>
                    </div>

                    {/* Delivery rate gauge */}
                    <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center justify-center gap-3">
                      <div className="text-center">
                        <h3 className="font-bold text-gray-900">Delivery Rate</h3>
                        <p className="text-gray-400 text-xs">Delivered vs. active bookings</p>
                      </div>
                      <GaugeChart value={deliveryRate} color="text-green-500" />
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full" /> {delivered} delivered</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> {cancelled} cancelled</span>
                      </div>
                    </div>

                    {/* Request success rate gauge */}
                    <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center justify-center gap-3">
                      <div className="text-center">
                        <h3 className="font-bold text-gray-900">Request Success</h3>
                        <p className="text-gray-400 text-xs">Completed vs. closed requests</p>
                      </div>
                      <GaugeChart value={requestSuccessRate} color="text-teal-500" />
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-teal-400 rounded-full" /> {completedReq} completed</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> {rejectedReq} rejected</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking pipeline + requests pipeline */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Booking pipeline */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-bold text-gray-900">Booking Pipeline</h3>
                          <p className="text-gray-400 text-xs mt-0.5">All {bookings.length} bookings by status</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                          <Activity className="h-3.5 w-3.5" /> Live
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Pending',    value: bByStatus.pending ?? 0,    color: 'bg-yellow-400' },
                          { label: 'Confirmed',  value: bByStatus.confirmed ?? 0,  color: 'bg-blue-400' },
                          { label: 'In Transit', value: (bByStatus.in_transit ?? 0) + (bByStatus.picked_up ?? 0), color: 'bg-orange-400' },
                          { label: 'Delivered',  value: delivered,                 color: 'bg-green-400' },
                          { label: 'Cancelled',  value: cancelled,                 color: 'bg-red-400' },
                        ].map(row => (
                          <div key={row.label} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                            <div className="flex-1"><Bar value={row.value} max={bookings.length || 1} color={row.color} /></div>
                            <div className="flex items-center gap-1 flex-shrink-0 w-16 justify-end">
                              <span className="text-xs font-bold text-gray-800">{row.value}</span>
                              <span className="text-xs text-gray-400">({pct(row.value, bookings.length || 1)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Requests pipeline */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="font-bold text-gray-900">Request Pipeline</h3>
                          <p className="text-gray-400 text-xs mt-0.5">All {requests.length} requests by status</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-teal-50 text-teal-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                          <Zap className="h-3.5 w-3.5" /> Live
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Pending',   value: rByStatus.pending ?? 0,     color: 'bg-yellow-400' },
                          { label: 'Reviewing', value: rByStatus.reviewing ?? 0,   color: 'bg-blue-400' },
                          { label: 'Approved',  value: (rByStatus.approved ?? 0) + (rByStatus.in_progress ?? 0), color: 'bg-teal-400' },
                          { label: 'Completed', value: completedReq,               color: 'bg-green-400' },
                          { label: 'Rejected',  value: rejectedReq,                color: 'bg-red-400' },
                        ].map(row => (
                          <div key={row.label} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                            <div className="flex-1"><Bar value={row.value} max={requests.length || 1} color={row.color} /></div>
                            <div className="flex items-center gap-1 flex-shrink-0 w-16 justify-end">
                              <span className="text-xs font-bold text-gray-800">{row.value}</span>
                              <span className="text-xs text-gray-400">({pct(row.value, requests.length || 1)}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Package breakdown, service breakdown, top agents */}
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Package types */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-1">Package Types</h3>
                      <p className="text-gray-400 text-xs mb-4">Shipment categories</p>
                      <div className="space-y-2.5">
                        {Object.entries(bByPkg).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PKG_COLORS[k] ?? 'bg-gray-400'}`} />
                            <span className="text-xs text-gray-600 flex-1">{cap(k)}</span>
                            <div className="flex-1"><Bar value={v} max={bookings.length || 1} color={PKG_COLORS[k] ?? 'bg-gray-400'} /></div>
                            <span className="text-xs font-bold text-gray-800 w-6 text-right">{v}</span>
                          </div>
                        ))}
                        {Object.keys(bByPkg).length === 0 && <p className="text-xs text-gray-400 text-center py-4">No data yet</p>}
                      </div>
                    </div>

                    {/* Service types */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-1">Service Types</h3>
                      <p className="text-gray-400 text-xs mb-4">Requested logistics services</p>
                      <div className="space-y-2.5">
                        {Object.entries(rBySvc).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SVC_COLORS[k] ?? 'bg-gray-400'}`} />
                            <span className="text-xs text-gray-600 flex-1">{cap(k)}</span>
                            <div className="flex-1"><Bar value={v} max={requests.length || 1} color={SVC_COLORS[k] ?? 'bg-gray-400'} /></div>
                            <span className="text-xs font-bold text-gray-800 w-6 text-right">{v}</span>
                          </div>
                        ))}
                        {Object.keys(rBySvc).length === 0 && <p className="text-xs text-gray-400 text-center py-4">No data yet</p>}
                      </div>
                    </div>

                    {/* Top agents by bookings */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" /> Top Agents
                      </h3>
                      <p className="text-gray-400 text-xs mb-4">By total bookings created</p>
                      <TopAgentsTable bookings={bookings} />
                    </div>
                  </div>

                  {/* Secondary KPIs row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Approved Agents', value: approvedAgents, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Cancellation Rate', value: `${cancellationRate}%`, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
                      { label: 'Req. Success Rate', value: `${requestSuccessRate}%`, icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
                      { label: 'Pending Approvals', value: pendingAgents, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', alert: pendingAgents > 0 },
                    ].map(s => (
                      <div key={s.label} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${s.alert ? 'border-yellow-200' : 'border-gray-100'}`}>
                        <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <s.icon className={`h-5 w-5 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900">{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ AGENTS TAB ══ */}
          {tab === 'agents' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as AgentStatus)}
                    className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : filteredAgents.length === 0 ? (
                <div className="p-12 text-center"><Users className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No agents found</p></div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredAgents.map(agent => (
                    <div key={agent.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {agent.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{agent.full_name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[agent.status] ?? ''}`}>{cap(agent.status)}</span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                            <Building2 className="h-3 w-3" /> {agent.company_name} · <MapPin className="h-3 w-3" /> {agent.city}
                          </p>
                          <p className="text-xs text-gray-400">{agent.email} · Registered {fmtDate(agent.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setSelectedAgent(agent)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs font-medium transition-all">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {agent.status === 'pending' && (
                          <>
                            <button onClick={() => approveAgent(agent.id)} disabled={actionLoading === agent.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50">
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button onClick={() => setSelectedAgent(agent)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-all">
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {agent.status === 'approved' && (
                          <button onClick={() => rejectAgent(agent.id)} disabled={actionLoading === agent.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-medium transition-all">
                            <XCircle className="h-3.5 w-3.5" /> Revoke
                          </button>
                        )}
                        {agent.status === 'rejected' && (
                          <button onClick={() => approveAgent(agent.id)} disabled={actionLoading === agent.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg text-xs font-medium transition-all">
                            <CheckCircle className="h-3.5 w-3.5" /> Re-approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ BOOKINGS TAB ══ */}
          {tab === 'bookings' && (
            <div>
              {loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : bookings.length === 0 ? (
                <div className="p-12 text-center"><Package className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No bookings yet</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="text-left px-6 py-3 font-semibold">Booking Ref</th>
                        <th className="text-left px-6 py-3 font-semibold">Agent</th>
                        <th className="text-left px-6 py-3 font-semibold">Route</th>
                        <th className="text-left px-6 py-3 font-semibold">Package</th>
                        <th className="text-left px-6 py-3 font-semibold">Status</th>
                        <th className="text-left px-6 py-3 font-semibold">Date</th>
                        <th className="text-left px-6 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-orange-600">{b.booking_ref}</p>
                            <p className="text-xs text-gray-400">{b.sender_name} → {b.recipient_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800 text-xs">{b.agent_profiles?.full_name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{b.agent_profiles?.company_name ?? ''}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-700 font-medium">{b.pickup_city} → {b.delivery_city}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-xs text-gray-600">{b.package_type}</span>
                          </td>
                          <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                            <select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${STATUS_BADGE[b.status] ?? ''}`}>
                              {BOOKING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">{fmtDate(b.created_at)}</td>
                          <td className="px-6 py-4">
                            <button onClick={e => { e.stopPropagation(); setSelectedBooking(b); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs font-medium transition-all">
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ REQUESTS TAB ══ */}
          {tab === 'requests' && (
            <div>
              {loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center"><Truck className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No logistics requests yet</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="text-left px-6 py-3 font-semibold">Request</th>
                        <th className="text-left px-6 py-3 font-semibold">Agent</th>
                        <th className="text-left px-6 py-3 font-semibold">Service</th>
                        <th className="text-left px-6 py-3 font-semibold">Route</th>
                        <th className="text-left px-6 py-3 font-semibold">Status</th>
                        <th className="text-left px-6 py-3 font-semibold">Date</th>
                        <th className="text-left px-6 py-3 font-semibold">Admin Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {requests.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-blue-600">{r.request_ref}</p>
                            <p className="text-xs text-gray-700 font-medium">{r.title}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800 text-xs">{r.agent_profiles?.full_name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{r.agent_profiles?.company_name ?? ''}</p>
                          </td>
                          <td className="px-6 py-4"><span className="capitalize text-xs text-gray-600">{cap(r.service_type)}</span></td>
                          <td className="px-6 py-4"><p className="text-xs text-gray-700">{r.origin} → {r.destination}</p></td>
                          <td className="px-6 py-4">
                            <select value={r.status} onChange={e => updateRequestStatus(r.id, e.target.value)}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${STATUS_BADGE[r.status] ?? ''}`}>
                              {REQUEST_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">{fmtDate(r.created_at)}</td>
                          <td className="px-6 py-4">
                            <input type="text" placeholder="Add notes..." defaultValue={r.admin_notes}
                              onBlur={e => updateRequestStatus(r.id, r.status, e.target.value)}
                              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg w-36 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Agent Profile</h2>
              <button onClick={() => { setSelectedAgent(null); setRejectReason(''); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                  {selectedAgent.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selectedAgent.full_name}</p>
                  <p className="text-gray-500 text-sm">{selectedAgent.company_name}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium mt-1 inline-block ${STATUS_BADGE[selectedAgent.status] ?? ''}`}>{cap(selectedAgent.status)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: Mail, label: 'Email', value: selectedAgent.email },
                  { icon: Phone, label: 'Phone', value: selectedAgent.phone },
                  { icon: MapPin, label: 'City', value: selectedAgent.city },
                  { icon: Building2, label: 'ID Number', value: selectedAgent.id_number },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><item.icon className="h-3.5 w-3.5 text-gray-400" /><span className="text-xs text-gray-400">{item.label}</span></div>
                    <p className="font-medium text-gray-800 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Address</p>
                <p className="font-medium text-gray-800 text-sm">{selectedAgent.address}</p>
              </div>
              {selectedAgent.rejection_reason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-600 font-medium">Rejection Reason</p>
                    <p className="text-sm text-red-700">{selectedAgent.rejection_reason}</p>
                  </div>
                </div>
              )}
              {selectedAgent.status === 'pending' && (
                <div className="border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Rejection reason (if rejecting):</p>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain why the application is rejected..." rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                </div>
              )}
            </div>
            {selectedAgent.status === 'pending' && (
              <div className="p-6 pt-0 flex gap-3">
                <button onClick={() => approveAgent(selectedAgent.id)} disabled={actionLoading === selectedAgent.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                  <CheckCircle className="h-4 w-4" /> Approve Agent
                </button>
                <button onClick={() => rejectAgent(selectedAgent.id)} disabled={actionLoading === selectedAgent.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                  <XCircle className="h-4 w-4" /> Reject Agent
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} isAdmin={true} onClose={() => setSelectedBooking(null)}
          onStatusChange={(id, newStatus) => {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
          }} />
      )}
    </div>
  );
}
