import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck, Package, BarChart3, Clock, CheckCircle, XCircle,
  LogOut, Plus, ChevronRight, User, MapPin, Phone, Mail,
  TrendingUp, Activity, FileText, Target, ArrowUpRight, ArrowDownRight,
  Minus, Award, Zap, MessageSquare, FileDown, SlidersHorizontal,
  Menu, X
} from 'lucide-react';
import { useIndividual } from '../contexts/IndividualContext';
import { supabase } from '../lib/supabase';
import BookingDetailModal from '../components/BookingDetailModal';
import InvoiceModal, { type InvoiceData } from '../components/InvoiceModal';

interface RecentBooking {
  id: string;
  booking_ref: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  pickup_city: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_city: string;
  package_type: string;
  package_description: string;
  weight_kg: number | null;
  declared_value: number | null;
  special_instructions: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface RecentRequest {
  id: string;
  request_ref: string;
  title: string;
  description: string;
  service_type: string;
  origin: string;
  destination: string;
  quantity: number | null;
  weight_kg: number | null;
  preferred_date: string | null;
  budget_range: string;
  status: string;
  created_at: string;
}

interface Analytics {
  totalBookings: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  pendingBookings: number;
  confirmedBookings: number;
  inTransitBookings: number;
  deliveredBookings: number;
  cancelledBookings: number;
  deliveryRate: number;
  cancellationRate: number;
  totalRequests: number;
  requestsThisMonth: number;
  requestsLastMonth: number;
  pendingRequests: number;
  approvedRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  requestSuccessRate: number;
  packageTypeCounts: Record<string, number>;
  serviceTypeCounts: Record<string, number>;
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-orange-50 text-orange-600 border-orange-200',
  out_for_delivery: 'bg-teal-50 text-teal-700 border-teal-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const SERVICE_COLORS: Record<string, string> = {
  freight: 'bg-blue-500', warehousing: 'bg-teal-500', express: 'bg-yellow-500',
  bulk: 'bg-green-500', customs: 'bg-orange-500', last_mile: 'bg-red-500',
};

const PACKAGE_COLORS: Record<string, string> = {
  document: 'bg-blue-400', parcel: 'bg-orange-400', fragile: 'bg-yellow-400', heavy: 'bg-slate-500',
};

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function pct(n: number, d: number) { return d === 0 ? 0 : Math.round((n / d) * 100); }
function trend(curr: number, prev: number): { dir: 'up' | 'down' | 'flat'; pct: number } {
  if (prev === 0) return { dir: curr > 0 ? 'up' : 'flat', pct: 0 };
  const p = Math.round(((curr - prev) / prev) * 100);
  return { dir: p > 0 ? 'up' : p < 0 ? 'down' : 'flat', pct: Math.abs(p) };
}

const EMPTY_ANALYTICS: Analytics = {
  totalBookings: 0, bookingsThisMonth: 0, bookingsLastMonth: 0,
  pendingBookings: 0, confirmedBookings: 0, inTransitBookings: 0,
  deliveredBookings: 0, cancelledBookings: 0, deliveryRate: 0, cancellationRate: 0,
  totalRequests: 0, requestsThisMonth: 0, requestsLastMonth: 0,
  pendingRequests: 0, approvedRequests: 0, completedRequests: 0,
  rejectedRequests: 0, requestSuccessRate: 0,
  packageTypeCounts: {}, serviceTypeCounts: {},
};

function TrendBadge({ value }: { value: { dir: 'up' | 'down' | 'flat'; pct: number } }) {
  if (value.dir === 'flat') return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="h-3 w-3" /> 0%</span>;
  if (value.dir === 'up') return <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium"><ArrowUpRight className="h-3.5 w-3.5" /> {value.pct}%</span>;
  return <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium"><ArrowDownRight className="h-3.5 w-3.5" /> {value.pct}%</span>;
}

function ProgressBar({ value, max, color = 'bg-orange-500' }: { value: number; max: number; color?: string }) {
  const w = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${w}%` }} />
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return (
    <div className="w-28 h-28 rounded-full border-8 border-gray-100 flex items-center justify-center">
      <p className="text-xs text-gray-400 text-center">No data</p>
    </div>
  );
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const colorMap: Record<string, string> = {
    'bg-blue-400': '#60a5fa', 'bg-orange-400': '#fb923c',
    'bg-yellow-400': '#facc15', 'bg-slate-500': '#64748b',
    'bg-blue-500': '#3b82f6', 'bg-teal-500': '#14b8a6',
    'bg-yellow-500': '#eab308', 'bg-green-500': '#22c55e',
    'bg-orange-500': '#f97316', 'bg-red-500': '#ef4444',
  };
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
      {segments.map((seg, i) => {
        if (seg.value === 0) return null;
        const frac = seg.value / total;
        const dash = frac * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx="50" cy="50" r={r}
            fill="none"
            stroke={colorMap[seg.color] ?? '#94a3b8'}
            strokeWidth="18"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
          />
        );
        offset += frac;
        return el;
      })}
    </svg>
  );
}

export default function IndividualDashboardPage() {
  const { user, profile, signOut, refreshProfile } = useIndividual();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY_ANALYTICS);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<RecentBooking | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { refreshProfile(); }, []);
  useEffect(() => {
    if (!user || !profile) { setDataLoading(false); return; }
    fetchData();
  }, [user, profile]);
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { data: threads } = await supabase.from('message_threads').select('id').eq('recipient_id', user.id).eq('recipient_type', 'individual');
      if (!threads?.length) return;
      const ids = threads.map(t => t.id);
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).in('thread_id', ids).eq('is_read', false).eq('sender_role', 'admin');
      setUnreadMessages(count || 0);
    };
    fetchUnread();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setDataLoading(true);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [bookingsRes, requestsRes, recentBRes, recentRRes] = await Promise.all([
      supabase.from('delivery_bookings').select('status, package_type, created_at').eq('individual_id', user.id),
      supabase.from('logistics_requests').select('status, service_type, created_at').eq('individual_id', user.id),
      supabase.from('delivery_bookings').select('*').eq('individual_id', user.id).order('created_at', { ascending: false }).limit(6),
      supabase.from('logistics_requests').select('id, request_ref, title, description, service_type, vehicle_type, origin, destination, quantity, weight_kg, preferred_date, budget_range, status, created_at').eq('individual_id', user.id).order('created_at', { ascending: false }).limit(6),
    ]);

    const bAll = bookingsRes.data ?? [];
    const rAll = requestsRes.data ?? [];

    const bThisMonth = bAll.filter(b => b.created_at >= startOfMonth).length;
    const bLastMonth = bAll.filter(b => b.created_at >= startOfLastMonth && b.created_at <= endOfLastMonth).length;
    const rThisMonth = rAll.filter(r => r.created_at >= startOfMonth).length;
    const rLastMonth = rAll.filter(r => r.created_at >= startOfLastMonth && r.created_at <= endOfLastMonth).length;

    const bByStatus = bAll.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const rByStatus = rAll.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const pkgCounts = bAll.reduce((acc, b) => { acc[b.package_type] = (acc[b.package_type] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const svcCounts = rAll.reduce((acc, r) => { acc[r.service_type] = (acc[r.service_type] ?? 0) + 1; return acc; }, {} as Record<string, number>);

    const delivered = bByStatus.delivered ?? 0;
    const cancelled = bByStatus.cancelled ?? 0;
    const activable = bAll.length - cancelled;
    const completed = rByStatus.completed ?? 0;
    const rejected = rByStatus.rejected ?? 0;
    const rClosed = completed + rejected;

    setAnalytics({
      totalBookings: bAll.length,
      bookingsThisMonth: bThisMonth,
      bookingsLastMonth: bLastMonth,
      pendingBookings: bByStatus.pending ?? 0,
      confirmedBookings: bByStatus.confirmed ?? 0,
      inTransitBookings: (bByStatus.in_transit ?? 0) + (bByStatus.picked_up ?? 0),
      deliveredBookings: delivered,
      cancelledBookings: cancelled,
      deliveryRate: pct(delivered, activable),
      cancellationRate: pct(cancelled, bAll.length),
      totalRequests: rAll.length,
      requestsThisMonth: rThisMonth,
      requestsLastMonth: rLastMonth,
      pendingRequests: rByStatus.pending ?? 0,
      approvedRequests: (rByStatus.approved ?? 0) + (rByStatus.in_progress ?? 0),
      completedRequests: completed,
      rejectedRequests: rejected,
      requestSuccessRate: pct(completed, rClosed),
      packageTypeCounts: pkgCounts,
      serviceTypeCounts: svcCounts,
    });

    setRecentBookings(recentBRes.data ?? []);
    setRecentRequests(recentRRes.data ?? []);
    setDataLoading(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/individual/login');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const bTrend = trend(analytics.bookingsThisMonth, analytics.bookingsLastMonth);
  const rTrend = trend(analytics.requestsThisMonth, analytics.requestsLastMonth);

  const pkgSegments = Object.entries(analytics.packageTypeCounts).map(([k, v]) => ({
    label: cap(k), value: v, color: PACKAGE_COLORS[k] ?? 'bg-slate-400',
  }));
  const svcSegments = Object.entries(analytics.serviceTypeCounts).map(([k, v]) => ({
    label: cap(k), value: v, color: SERVICE_COLORS[k] ?? 'bg-slate-400',
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        {/* Sidebar */}
        <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-30 overflow-hidden transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-6 border-b border-white/10 flex-shrink-0 relative">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-sm">Danhausa Logistics</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-5 right-4 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{profile.full_name}</p>
                  <p className="text-gray-400 text-xs truncate">{profile.email}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/20 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Individual
              </span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider px-3 mb-2">Navigation</p>
            <Link to="/individual/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link to="/individual/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
              <SlidersHorizontal className="h-4 w-4" /> Orders & Requests
            </Link>
            <Link to="/individual/booking/new" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
              <Package className="h-4 w-4" /> New Booking
            </Link>
            <Link to="/individual/logistics/new" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
              <Truck className="h-4 w-4" /> New Logistics Request
            </Link>
            <Link to="/individual/messages" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm relative">
              <MessageSquare className="h-4 w-4" /> Messages
              {unreadMessages > 0 && (
                <span className="ml-auto w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadMessages}</span>
              )}
            </Link>
          </nav>

          <div className="p-4 border-t border-white/10 space-y-3 flex-shrink-0">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Delivery Rate</span>
                <span className="text-green-400 font-semibold">{analytics.deliveryRate}%</span>
              </div>
              <ProgressBar value={analytics.deliveryRate} max={100} color="bg-green-500" />
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Request Success</span>
                <span className="text-blue-400 font-semibold">{analytics.requestSuccessRate}%</span>
              </div>
              <ProgressBar value={analytics.requestSuccessRate} max={100} color="bg-blue-500" />
            </div>
          </div>

          <div className="p-4 border-t border-white/10 flex-shrink-0">
            <button onClick={handleLogout} disabled={loggingOut}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-gray-500 text-sm">{profile.city}{profile.state ? `, ${profile.state}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleLogout} disabled={loggingOut} className="lg:hidden flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium">
                <LogOut className="h-4 w-4" />
              </button>
              <Link to="/individual/booking/new"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-md hover:shadow-orange-500/20">
                <Plus className="h-4 w-4" /> New Booking
              </Link>
            </div>
          </header>

          <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
            {dataLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ─── KPI Row 1 ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Package className="h-5 w-5 text-orange-500" />
                      </div>
                      <TrendBadge value={bTrend} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Total Bookings</p>
                    <p className="text-xs text-gray-400 mt-0.5">{analytics.bookingsThisMonth} this month</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <Target className="h-5 w-5 text-green-500" />
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        analytics.deliveryRate >= 80 ? 'bg-green-50 text-green-600' :
                        analytics.deliveryRate >= 50 ? 'bg-yellow-50 text-yellow-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {analytics.deliveryRate >= 80 ? 'Excellent' : analytics.deliveryRate >= 50 ? 'Good' : 'Low'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analytics.deliveryRate}%</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Delivery Rate</p>
                    <div className="mt-2"><ProgressBar value={analytics.deliveryRate} max={100} color="bg-green-500" /></div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <TrendBadge value={rTrend} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalRequests}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Logistics Requests</p>
                    <p className="text-xs text-gray-400 mt-0.5">{analytics.requestsThisMonth} this month</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        <Award className="h-5 w-5 text-teal-500" />
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        analytics.requestSuccessRate >= 80 ? 'bg-teal-50 text-teal-600' :
                        analytics.requestSuccessRate >= 50 ? 'bg-yellow-50 text-yellow-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {analytics.completedRequests} done
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analytics.requestSuccessRate}%</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Request Success Rate</p>
                    <div className="mt-2"><ProgressBar value={analytics.requestSuccessRate} max={100} color="bg-teal-500" /></div>
                  </div>
                </div>

                {/* ─── Booking Pipeline + Cancellation ─── */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-gray-900">Booking Pipeline</h3>
                        <p className="text-gray-400 text-xs mt-0.5">Status distribution across all bookings</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Activity className="h-3.5 w-3.5" /> Live
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Pending',    value: analytics.pendingBookings,   total: analytics.totalBookings, color: 'bg-yellow-400' },
                        { label: 'Confirmed',  value: analytics.confirmedBookings, total: analytics.totalBookings, color: 'bg-blue-400' },
                        { label: 'In Transit', value: analytics.inTransitBookings, total: analytics.totalBookings, color: 'bg-orange-400' },
                        { label: 'Delivered',  value: analytics.deliveredBookings, total: analytics.totalBookings, color: 'bg-green-400' },
                        { label: 'Cancelled',  value: analytics.cancelledBookings, total: analytics.totalBookings, color: 'bg-red-400' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                          <div className="flex-1"><ProgressBar value={row.value} max={row.total || 1} color={row.color} /></div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 w-14 justify-end">
                            <span className="text-xs font-bold text-gray-800">{row.value}</span>
                            <span className="text-xs text-gray-400">({pct(row.value, row.total || 1)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-50 grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xl font-bold text-yellow-500">{analytics.pendingBookings}</p>
                        <p className="text-xs text-gray-400">Awaiting</p>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <p className="text-xl font-bold text-orange-500">{analytics.inTransitBookings}</p>
                        <p className="text-xs text-gray-400">In Motion</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-500">{analytics.deliveredBookings}</p>
                        <p className="text-xs text-gray-400">Delivered</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-1">Cancellation Rate</h3>
                    <p className="text-gray-400 text-xs mb-5">% of bookings cancelled</p>
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <div className="relative">
                        <svg viewBox="0 0 120 120" className="w-32 h-32">
                          <circle cx="60" cy="60" r="48" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                          <circle cx="60" cy="60" r="48" fill="none"
                            stroke={analytics.cancellationRate > 20 ? '#ef4444' : analytics.cancellationRate > 10 ? '#f97316' : '#22c55e'}
                            strokeWidth="14"
                            strokeDasharray={`${(analytics.cancellationRate / 100) * 301.6} 301.6`}
                            strokeLinecap="round"
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-2xl font-bold text-gray-900">{analytics.cancellationRate}%</p>
                          <p className="text-xs text-gray-400">cancelled</p>
                        </div>
                      </div>
                      <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        analytics.cancellationRate > 20 ? 'bg-red-50 text-red-600' :
                        analytics.cancellationRate > 10 ? 'bg-orange-50 text-orange-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {analytics.cancellationRate > 20 ? 'High — needs attention' :
                         analytics.cancellationRate > 10 ? 'Moderate' : 'Low — great!'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Breakdowns + Requests pipeline ─── */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Package Types</h3>
                    <p className="text-gray-400 text-xs mb-5">Breakdown by shipment category</p>
                    {pkgSegments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-gray-300">
                        <Package className="h-10 w-10 mb-2" />
                        <p className="text-sm">No data yet</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5">
                        <DonutChart segments={pkgSegments} />
                        <div className="flex-1 space-y-2">
                          {pkgSegments.map(s => (
                            <div key={s.label} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                                <span className="text-xs text-gray-600 truncate">{s.label}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-800 flex-shrink-0">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Service Types</h3>
                    <p className="text-gray-400 text-xs mb-5">Requested logistics services</p>
                    {svcSegments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-gray-300">
                        <Truck className="h-10 w-10 mb-2" />
                        <p className="text-sm">No data yet</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5">
                        <DonutChart segments={svcSegments} />
                        <div className="flex-1 space-y-2">
                          {svcSegments.map(s => (
                            <div key={s.label} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                                <span className="text-xs text-gray-600 truncate">{s.label}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-800 flex-shrink-0">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-1">Requests Pipeline</h3>
                    <p className="text-gray-400 text-xs mb-5">Current status of logistics requests</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Pending',   value: analytics.pendingRequests,   color: 'bg-yellow-400' },
                        { label: 'Approved',  value: analytics.approvedRequests,  color: 'bg-teal-400' },
                        { label: 'Completed', value: analytics.completedRequests, color: 'bg-green-400' },
                        { label: 'Rejected',  value: analytics.rejectedRequests,  color: 'bg-red-400' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0">{row.label}</span>
                          <div className="flex-1"><ProgressBar value={row.value} max={analytics.totalRequests || 1} color={row.color} /></div>
                          <span className="text-xs font-bold text-gray-800 w-5 text-right flex-shrink-0">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-teal-500" />
                      <p className="text-xs text-gray-500">
                        <span className="font-bold text-gray-800">{analytics.requestSuccessRate}%</span> completion rate
                      </p>
                    </div>
                  </div>
                </div>

                {/* ─── Quick Actions ─── */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link to="/individual/booking/new"
                    className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white group hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-3 rounded-xl"><Package className="h-6 w-6" /></div>
                      <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">New Delivery Booking</h3>
                    <p className="text-orange-100 text-sm">Create a delivery order for your shipment</p>
                  </Link>
                  <Link to="/individual/logistics/new"
                    className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl p-6 text-white group hover:shadow-xl hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-3 rounded-xl"><Truck className="h-6 w-6" /></div>
                      <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Request Logistics Service</h3>
                    <p className="text-blue-200 text-sm">Freight, warehousing, express, customs and more</p>
                  </Link>
                </div>

                {/* ─── Recent Activity ─── */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">Recent Bookings</h3>
                        <p className="text-gray-400 text-xs">Click any row to view full details</p>
                      </div>
                      <Link to="/individual/booking/new" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
                        New <Plus className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recentBookings.length === 0 ? (
                      <div className="p-8 text-center">
                        <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No bookings yet</p>
                        <Link to="/individual/booking/new" className="text-orange-500 text-sm font-medium hover:underline mt-2 inline-block">Create your first booking</Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {recentBookings.map(b => (
                          <div key={b.id} className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors">
                            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                              <p className="font-semibold text-sm text-gray-900 truncate">{b.booking_ref}</p>
                              <p className="text-xs text-gray-500 truncate">{b.recipient_name} · {b.delivery_city}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {cap(b.status)}
                              </span>
                              <span className="text-xs text-gray-400 hidden sm:block">{timeAgo(b.created_at)}</span>
                              <button
                                onClick={() => setInvoiceData({ type: 'booking', ...b, agent_company: profile?.full_name, agent_name: profile?.full_name, agent_phone: profile?.phone, agent_email: profile?.email })}
                                title="Generate Invoice"
                                className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                <FileDown className="h-3.5 w-3.5" />
                              </button>
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300 cursor-pointer" onClick={() => setSelectedBooking(b)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">Recent Requests</h3>
                        <p className="text-gray-400 text-xs">Latest logistics service requests</p>
                      </div>
                      <Link to="/individual/logistics/new" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
                        New <Plus className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recentRequests.length === 0 ? (
                      <div className="p-8 text-center">
                        <Truck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No requests yet</p>
                        <Link to="/individual/logistics/new" className="text-orange-500 text-sm font-medium hover:underline mt-2 inline-block">Submit your first request</Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {recentRequests.map(r => (
                          <div key={r.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-gray-900 truncate">{r.title}</p>
                              <p className="text-xs text-gray-500 truncate">{r.request_ref} · {cap(r.service_type)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${REQUEST_STATUS_STYLES[r.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {cap(r.status)}
                              </span>
                              <span className="text-xs text-gray-400 hidden sm:block">{timeAgo(r.created_at)}</span>
                              <button
                                onClick={() => setInvoiceData({ type: 'request', ...r, agent_company: profile?.full_name, agent_name: profile?.full_name, agent_phone: profile?.phone, agent_email: profile?.email })}
                                title="Generate Invoice"
                                className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                <FileDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" /> My Profile
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {[
                  { icon: User,  label: 'Full Name', value: profile.full_name },
                  { icon: Mail,  label: 'Email',     value: profile.email },
                  { icon: Phone, label: 'Phone',     value: profile.phone },
                  { icon: MapPin, label: 'Address',  value: profile.address },
                  { icon: MapPin, label: 'City',     value: profile.city },
                  { icon: MapPin, label: 'State',    value: profile.state },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <item.icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="font-medium text-gray-800">{item.value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isAdmin={false}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={(id, newStatus) => {
            setRecentBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}

      {invoiceData && <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />}
    </div>
  );
}
