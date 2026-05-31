import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Package, Truck, Users, Building2, User,
  Calendar, CheckCircle, XCircle, Clock, Zap, Activity,
  ChevronRight, Search, Filter, BarChart3,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'all';
type SectionKey = 'overview' | 'individual' | 'agent' | 'business';

interface RawBooking {
  id: string;
  status: string;
  created_at: string;
  delivery_type?: string | null;
  individual_id?: string | null;
  agent_id?: string | null;
}

interface RawRequest {
  id: string;
  status: string;
  created_at: string;
  service_type: string;
  individual_id?: string | null;
  agent_id?: string | null;
}

interface IndividualProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
}

interface AgentProfile {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  city: string;
  status: string;
}

interface BusinessProfile {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  city: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStartDate(range: TimeRange): string | null {
  const now = new Date();
  if (range === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  if (range === 'week') { const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  if (range === 'quarter') return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  return null;
}

function filterByRange<T extends { created_at: string }>(items: T[], range: TimeRange): T[] {
  const start = getStartDate(range);
  return start ? items.filter(i => i.created_at >= start) : items;
}

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

function groupByDay(items: { created_at: string }[], range: TimeRange): { label: string; count: number }[] {
  const buckets: Record<string, number> = {};
  if (range === 'today') {
    for (let h = 0; h < 24; h++) buckets[`${h.toString().padStart(2, '0')}:00`] = 0;
    items.forEach(i => { const key = `${new Date(i.created_at).getHours().toString().padStart(2, '0')}:00`; buckets[key]++; });
  } else if (range === 'week') {
    const now = new Date();
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now); date.setDate(date.getDate() - d); date.setHours(0, 0, 0, 0);
      buckets[date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' })] = 0;
    }
    items.forEach(i => {
      const key = new Date(i.created_at).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' });
      if (buckets[key] !== undefined) buckets[key]++;
    });
  } else {
    items.forEach(i => {
      const key = new Date(i.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      buckets[key] = (buckets[key] ?? 0) + 1;
    });
  }
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  picked_up: 'bg-orange-100 text-orange-700 border-orange-200',
  in_transit: 'bg-orange-100 text-orange-600 border-orange-200',
  out_for_delivery: 'bg-teal-100 text-teal-700 border-teal-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-teal-100 text-teal-700 border-teal-200',
  in_progress: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function MiniBarChart({ data, color = 'bg-orange-400' }: { data: { label: string; count: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  if (data.length === 0) return <p className="text-xs text-gray-400 text-center py-4">No data</p>;
  return (
    <div className="flex items-end gap-0.5 h-14 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <div className={`w-full ${color} rounded-t-sm transition-all duration-500 min-h-[2px]`}
            style={{ height: `${Math.max(2, (d.count / max) * 52)}px` }} />
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {d.label}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBreakdown({ items, barColor }: { items: { status: string }[]; barColor: string }) {
  const counts = items.reduce((acc, i) => { acc[i.status] = (acc[i.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...sorted.map(s => s[1]), 1);
  if (sorted.length === 0) return <p className="text-xs text-gray-400 text-center py-4">No data for this period</p>;
  return (
    <div className="space-y-2">
      {sorted.map(([status, count]) => (
        <div key={status} className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 w-28 text-center truncate ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{cap(status)}</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="text-xs font-bold text-gray-800 w-5 text-right flex-shrink-0">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── User detail modal/panel ──────────────────────────────────────────────────

function UserDetailPanel({
  name, subtitle, avatar, avatarColor,
  bookings, requests, timeRange, onTimeRangeChange, onClose,
}: {
  name: string;
  subtitle: string;
  avatar: string;
  avatarColor: string;
  bookings: RawBooking[];
  requests: RawRequest[];
  timeRange: TimeRange;
  onTimeRangeChange: (r: TimeRange) => void;
  onClose: () => void;
}) {
  const filteredB = filterByRange(bookings, timeRange);
  const filteredR = filterByRange(requests, timeRange);

  const deliveredB = filteredB.filter(b => b.status === 'delivered').length;
  const cancelledB = filteredB.filter(b => b.status === 'cancelled').length;
  const activeB = filteredB.filter(b => !['delivered', 'cancelled'].includes(b.status)).length;
  const completedR = filteredR.filter(r => r.status === 'completed').length;

  const bChart = groupByDay(filteredB, timeRange);
  const rChart = groupByDay(filteredR, timeRange);

  const dtBreakdown = filteredB.reduce((acc, b) => {
    const k = b.delivery_type ?? 'unspecified'; acc[k] = (acc[k] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  const svcBreakdown = filteredR.reduce((acc, r) => {
    acc[r.service_type] = (acc[r.service_type] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  const TIME_RANGES: { key: TimeRange; label: string }[] = [
    { key: 'today', label: 'Today' }, { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' }, { key: 'quarter', label: 'Quarter' }, { key: 'all', label: 'All' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 rounded-t-3xl z-10">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className={`w-10 h-10 ${avatarColor} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
          </div>
          {/* Time range filter inside modal */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
            {TIME_RANGES.map(t => (
              <button key={t.key} onClick={() => onTimeRangeChange(t.key)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${timeRange === t.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Package, label: 'Deliveries', value: filteredB.length, color: 'text-orange-600', bg: 'bg-orange-50' },
              { icon: CheckCircle, label: 'Delivered', value: deliveredB, color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Activity, label: 'Active', value: activeB, color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Truck, label: 'Requests', value: filteredR.length, color: 'text-teal-600', bg: 'bg-teal-50' },
            ].map(k => (
              <div key={k.label} className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-2.5">
                <div className={`w-9 h-9 ${k.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{k.value}</p>
                  <p className="text-xs text-gray-500">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-800">Delivery Bookings</p>
                <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">{filteredB.length}</span>
              </div>
              <MiniBarChart data={bChart} color="bg-orange-400" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-800">Logistics Requests</p>
                <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">{filteredR.length} · {completedR} done</span>
              </div>
              <MiniBarChart data={rChart} color="bg-blue-400" />
            </div>
          </div>

          {/* Status breakdown */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-800 mb-3">Booking Status</p>
              <StatusBreakdown items={filteredB} barColor="bg-orange-400" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-800 mb-3">Request Status</p>
              <StatusBreakdown items={filteredR} barColor="bg-blue-400" />
            </div>
          </div>

          {/* Delivery type + Service type */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-800 mb-3">Delivery Types</p>
              {Object.keys(dtBreakdown).length === 0 ? <p className="text-xs text-gray-400 text-center py-2">No deliveries</p> : (
                <div className="space-y-2">
                  {Object.entries(dtBreakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const colors: Record<string, string> = { same_state: 'bg-green-100 text-green-700', inter_state: 'bg-orange-100 text-orange-700', international: 'bg-blue-100 text-blue-700', unspecified: 'bg-gray-100 text-gray-600' };
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[type] ?? 'bg-gray-100 text-gray-600'}`}>{cap(type)}</span>
                        <span className="text-sm font-bold text-gray-800">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-800 mb-3">Services Requested</p>
              {Object.keys(svcBreakdown).length === 0 ? <p className="text-xs text-gray-400 text-center py-2">No requests</p> : (
                <div className="space-y-2">
                  {Object.entries(svcBreakdown).sort((a, b) => b[1] - a[1]).map(([svc, count]) => {
                    const maxVal = Math.max(...Object.values(svcBreakdown));
                    return (
                      <div key={svc} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{cap(svc)}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(count / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-800 w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User list row component ───────────────────────────────────────────────────

function UserRow({
  avatar, avatarColor, name, subtitle, badgeLabel, badgeColor,
  bookingCount, requestCount, onSelect,
}: {
  avatar: string; avatarColor: string; name: string; subtitle: string;
  badgeLabel?: string; badgeColor?: string;
  bookingCount: number; requestCount: number; onSelect: () => void;
}) {
  return (
    <button onClick={onSelect}
      className="w-full text-left px-5 py-4 hover:bg-gray-50/70 transition-colors flex items-center gap-4 group">
      <div className={`w-10 h-10 ${avatarColor} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
          {badgeLabel && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badgeColor ?? 'bg-gray-100 text-gray-500'}`}>{badgeLabel}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">{bookingCount}</p>
          <p className="text-xs text-gray-400">deliveries</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">{requestCount}</p>
          <p className="text-xs text-gray-400">requests</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors ml-1" />
      </div>
    </button>
  );
}

// ─── TIME_RANGES constant ─────────────────────────────────────────────────────

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' }, { key: 'quarter', label: 'Last 3 Months' }, { key: 'all', label: 'All Time' },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrdersAnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [section, setSection] = useState<SectionKey>('overview');
  const [search, setSearch] = useState('');
  const [modalTimeRange, setModalTimeRange] = useState<TimeRange>('month');

  // Raw data
  const [individualBookings, setIndividualBookings] = useState<RawBooking[]>([]);
  const [individualRequests, setIndividualRequests] = useState<RawRequest[]>([]);
  const [agentBookings, setAgentBookings] = useState<RawBooking[]>([]);
  const [agentRequests, setAgentRequests] = useState<RawRequest[]>([]);
  const [businessBookings, setBusinessBookings] = useState<RawBooking[]>([]);
  const [businessRequests, setBusinessRequests] = useState<RawRequest[]>([]);

  // Profile lists
  const [individuals, setIndividuals] = useState<IndividualProfile[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);

  // Selected user for detail modal
  const [selectedUser, setSelectedUser] = useState<{
    type: 'individual' | 'agent' | 'business';
    id: string;
    name: string;
    subtitle: string;
    avatar: string;
    avatarColor: string;
  } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [
      indProfileRes, agentProfileRes, bizProfileRes,
      indBookRes, indReqRes,
      agentBookRes, agentReqRes,
      bizBookRes, bizReqRes,
    ] = await Promise.all([
      supabase.from('individual_profiles').select('id, full_name, email, phone, city').order('full_name'),
      supabase.from('agent_profiles').select('id, full_name, email, company_name, city, status').order('full_name'),
      supabase.from('business_profiles').select('id, company_name, contact_person, email, city, status').order('company_name'),
      supabase.from('delivery_bookings').select('id, status, created_at, delivery_type, individual_id, agent_id').order('created_at', { ascending: false }),
      supabase.from('logistics_requests').select('id, status, created_at, service_type, individual_id, agent_id').order('created_at', { ascending: false }),
      supabase.from('delivery_bookings').select('id, status, created_at, delivery_type, agent_id').not('agent_id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('logistics_requests').select('id, status, created_at, service_type, agent_id').not('agent_id', 'is', null).order('created_at', { ascending: false }),
      supabase.from('business_delivery_bookings').select('id, status, created_at, delivery_type, business_id').order('created_at', { ascending: false }),
      supabase.from('business_logistics_requests').select('id, status, created_at, service_type, business_id').order('created_at', { ascending: false }),
    ]);

    setIndividuals((indProfileRes.data ?? []) as IndividualProfile[]);
    setAgents((agentProfileRes.data ?? []) as AgentProfile[]);
    setBusinesses((bizProfileRes.data ?? []) as BusinessProfile[]);

    // Individual bookings/requests = those with individual_id set
    const allDeliveries = (indBookRes.data ?? []) as (RawBooking & { individual_id?: string | null; agent_id?: string | null })[];
    const allLogistics = (indReqRes.data ?? []) as (RawRequest & { individual_id?: string | null; agent_id?: string | null })[];
    setIndividualBookings(allDeliveries.filter(b => b.individual_id));
    setIndividualRequests(allLogistics.filter(r => r.individual_id));
    setAgentBookings((agentBookRes.data ?? []) as RawBooking[]);
    setAgentRequests((agentReqRes.data ?? []) as RawRequest[]);
    setBusinessBookings((bizBookRes.data ?? []) as (RawBooking & { business_id?: string })[]);
    setBusinessRequests((bizReqRes.data ?? []) as (RawRequest & { business_id?: string })[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Overview aggregates ──────────────────────────────────────────────────────
  const overviewTotals = useMemo(() => {
    const allB = [...filterByRange(individualBookings, timeRange), ...filterByRange(agentBookings, timeRange), ...filterByRange(businessBookings, timeRange)];
    const allR = [...filterByRange(individualRequests, timeRange), ...filterByRange(agentRequests, timeRange), ...filterByRange(businessRequests, timeRange)];
    return {
      bookings: allB.length, requests: allR.length,
      delivered: allB.filter(b => b.status === 'delivered').length,
      completed: allR.filter(r => r.status === 'completed').length,
      cancelled: allB.filter(b => b.status === 'cancelled').length,
      pending: allB.filter(b => b.status === 'pending').length + allR.filter(r => r.status === 'pending').length,
    };
  }, [individualBookings, individualRequests, agentBookings, agentRequests, businessBookings, businessRequests, timeRange]);

  // ── Per-user booking/request lookup ─────────────────────────────────────────
  function getUserBookings(type: 'individual' | 'agent' | 'business', id: string): RawBooking[] {
    if (type === 'individual') return individualBookings.filter(b => (b as RawBooking & { individual_id?: string }).individual_id === id);
    if (type === 'agent') return agentBookings.filter(b => (b as RawBooking & { agent_id?: string }).agent_id === id);
    return businessBookings.filter(b => (b as RawBooking & { business_id?: string }).business_id === id);
  }
  function getUserRequests(type: 'individual' | 'agent' | 'business', id: string): RawRequest[] {
    if (type === 'individual') return individualRequests.filter(r => (r as RawRequest & { individual_id?: string }).individual_id === id);
    if (type === 'agent') return agentRequests.filter(r => (r as RawRequest & { agent_id?: string }).agent_id === id);
    return businessRequests.filter(r => (r as RawRequest & { business_id?: string }).business_id === id);
  }

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredIndividuals = useMemo(() => individuals.filter(i =>
    search === '' || i.full_name.toLowerCase().includes(search.toLowerCase()) || i.email.toLowerCase().includes(search.toLowerCase()) || i.city.toLowerCase().includes(search.toLowerCase())
  ), [individuals, search]);

  const filteredAgents = useMemo(() => agents.filter(a =>
    search === '' || a.full_name.toLowerCase().includes(search.toLowerCase()) || a.company_name.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase())
  ), [agents, search]);

  const filteredBusinesses = useMemo(() => businesses.filter(b =>
    search === '' || b.company_name.toLowerCase().includes(search.toLowerCase()) || b.contact_person.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase())
  ), [businesses, search]);

  const SECTIONS: { key: SectionKey; label: string; icon: React.FC<{ className?: string }>; color: string; active: string }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3, color: 'text-gray-600', active: 'bg-slate-800 text-white' },
    { key: 'individual', label: 'Individual', icon: User, color: 'text-teal-600', active: 'bg-teal-600 text-white' },
    { key: 'agent', label: 'Agent', icon: Users, color: 'text-orange-600', active: 'bg-orange-500 text-white' },
    { key: 'business', label: 'Business', icon: Building2, color: 'text-blue-600', active: 'bg-blue-600 text-white' },
  ];

  const selectedUserBookings = selectedUser ? getUserBookings(selectedUser.type, selectedUser.id) : [];
  const selectedUserRequests = selectedUser ? getUserRequests(selectedUser.type, selectedUser.id) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Orders & Logistics Analytics</h1>
              <p className="text-gray-500 text-sm">Delivery and logistics stats across all portals</p>
            </div>
          </div>
          <button onClick={fetchAll} className={`p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Section tabs + time range */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          {/* Section tabs */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => { setSection(s.key); setSearch(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${section === s.key ? s.active : `text-gray-500 hover:text-gray-700 hover:bg-gray-50`}`}>
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>

          {/* Time range (shown on overview) */}
          {section === 'overview' && (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
              <Calendar className="h-4 w-4 text-gray-400 ml-2" />
              {TIME_RANGES.map(t => (
                <button key={t.key} onClick={() => setTimeRange(t.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeRange === t.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ══ OVERVIEW ══ */}
            {section === 'overview' && (
              <div className="space-y-6">
                {/* Global KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { icon: Package, label: 'Total Deliveries', value: overviewTotals.bookings, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { icon: Truck, label: 'Logistics Requests', value: overviewTotals.requests, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { icon: CheckCircle, label: 'Delivered', value: overviewTotals.delivered, color: 'text-green-600', bg: 'bg-green-50' },
                    { icon: Zap, label: 'Completed Reqs', value: overviewTotals.completed, color: 'text-teal-600', bg: 'bg-teal-50' },
                    { icon: Clock, label: 'Pending', value: overviewTotals.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { icon: XCircle, label: 'Cancelled', value: overviewTotals.cancelled, color: 'text-red-500', bg: 'bg-red-50' },
                  ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                        <k.icon className={`h-4 w-4 ${k.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* Per-portal summary cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      key: 'individual' as SectionKey, label: 'Individual Users', icon: User,
                      iconColor: 'text-teal-600', iconBg: 'bg-teal-50', border: 'border-teal-100',
                      count: individuals.length, countLabel: 'registered',
                      bookings: filterByRange(individualBookings, timeRange).length,
                      requests: filterByRange(individualRequests, timeRange).length,
                      delivered: filterByRange(individualBookings, timeRange).filter(b => b.status === 'delivered').length,
                    },
                    {
                      key: 'agent' as SectionKey, label: 'Agents', icon: Users,
                      iconColor: 'text-orange-600', iconBg: 'bg-orange-50', border: 'border-orange-100',
                      count: agents.length, countLabel: 'registered',
                      bookings: filterByRange(agentBookings, timeRange).length,
                      requests: filterByRange(agentRequests, timeRange).length,
                      delivered: filterByRange(agentBookings, timeRange).filter(b => b.status === 'delivered').length,
                    },
                    {
                      key: 'business' as SectionKey, label: 'Businesses', icon: Building2,
                      iconColor: 'text-blue-600', iconBg: 'bg-blue-50', border: 'border-blue-100',
                      count: businesses.length, countLabel: 'registered',
                      bookings: filterByRange(businessBookings, timeRange).length,
                      requests: filterByRange(businessRequests, timeRange).length,
                      delivered: filterByRange(businessBookings, timeRange).filter(b => b.status === 'delivered').length,
                    },
                  ].map(card => (
                    <button key={card.key} onClick={() => setSection(card.key)}
                      className={`bg-white rounded-2xl border ${card.border} p-5 text-left hover:shadow-md transition-all group`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                          <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.iconBg} ${card.iconColor} flex items-center gap-1`}>
                          {card.count} {card.countLabel} <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                      <p className="font-bold text-gray-900 mb-3">{card.label}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-gray-900">{card.bookings}</p>
                          <p className="text-xs text-gray-400">Deliveries</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-gray-900">{card.requests}</p>
                          <p className="text-xs text-gray-400">Requests</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-green-600">{card.delivered}</p>
                          <p className="text-xs text-gray-400">Delivered</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══ INDIVIDUAL LIST ══ */}
            {section === 'individual' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search individuals..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">{filteredIndividuals.length} users</span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {filteredIndividuals.length === 0 ? (
                    <div className="p-12 text-center">
                      <User className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400">No individuals found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filteredIndividuals.map(ind => {
                        const bCount = individualBookings.filter(b => (b as RawBooking & { individual_id?: string }).individual_id === ind.id).length;
                        const rCount = individualRequests.filter(r => (r as RawRequest & { individual_id?: string }).individual_id === ind.id).length;
                        return (
                          <UserRow key={ind.id}
                            avatar={ind.full_name.charAt(0).toUpperCase()}
                            avatarColor="bg-gradient-to-br from-teal-400 to-teal-600"
                            name={ind.full_name}
                            subtitle={`${ind.email} · ${ind.city}`}
                            bookingCount={bCount}
                            requestCount={rCount}
                            onSelect={() => {
                              setSelectedUser({ type: 'individual', id: ind.id, name: ind.full_name, subtitle: `${ind.email} · ${ind.city}`, avatar: ind.full_name.charAt(0).toUpperCase(), avatarColor: 'bg-gradient-to-br from-teal-400 to-teal-600' });
                              setModalTimeRange('month');
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ AGENT LIST ══ */}
            {section === 'agent' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">{filteredAgents.length} agents</span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {filteredAgents.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400">No agents found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filteredAgents.map(agent => {
                        const bCount = agentBookings.filter(b => (b as RawBooking & { agent_id?: string }).agent_id === agent.id).length;
                        const rCount = agentRequests.filter(r => (r as RawRequest & { agent_id?: string }).agent_id === agent.id).length;
                        const statusColor: Record<string, string> = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-600' };
                        return (
                          <UserRow key={agent.id}
                            avatar={agent.full_name.charAt(0).toUpperCase()}
                            avatarColor="bg-gradient-to-br from-orange-400 to-red-500"
                            name={agent.full_name}
                            subtitle={`${agent.company_name} · ${agent.city}`}
                            badgeLabel={cap(agent.status)}
                            badgeColor={statusColor[agent.status] ?? 'bg-gray-100 text-gray-500'}
                            bookingCount={bCount}
                            requestCount={rCount}
                            onSelect={() => {
                              setSelectedUser({ type: 'agent', id: agent.id, name: agent.full_name, subtitle: `${agent.company_name} · ${agent.city}`, avatar: agent.full_name.charAt(0).toUpperCase(), avatarColor: 'bg-gradient-to-br from-orange-400 to-red-500' });
                              setModalTimeRange('month');
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ BUSINESS LIST ══ */}
            {section === 'business' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search businesses..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">{filteredBusinesses.length} businesses</span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {filteredBusinesses.length === 0 ? (
                    <div className="p-12 text-center">
                      <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400">No businesses found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {filteredBusinesses.map(biz => {
                        const bCount = businessBookings.filter(b => (b as RawBooking & { business_id?: string }).business_id === biz.id).length;
                        const rCount = businessRequests.filter(r => (r as RawRequest & { business_id?: string }).business_id === biz.id).length;
                        const statusColor: Record<string, string> = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-600' };
                        return (
                          <UserRow key={biz.id}
                            avatar={biz.company_name.charAt(0).toUpperCase()}
                            avatarColor="bg-gradient-to-br from-blue-500 to-blue-700"
                            name={biz.company_name}
                            subtitle={`${biz.contact_person} · ${biz.city}`}
                            badgeLabel={cap(biz.status)}
                            badgeColor={statusColor[biz.status] ?? 'bg-gray-100 text-gray-500'}
                            bookingCount={bCount}
                            requestCount={rCount}
                            onSelect={() => {
                              setSelectedUser({ type: 'business', id: biz.id, name: biz.company_name, subtitle: `${biz.contact_person} · ${biz.city}`, avatar: biz.company_name.charAt(0).toUpperCase(), avatarColor: 'bg-gradient-to-br from-blue-500 to-blue-700' });
                              setModalTimeRange('month');
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── User detail modal ── */}
      {selectedUser && (
        <UserDetailPanel
          name={selectedUser.name}
          subtitle={selectedUser.subtitle}
          avatar={selectedUser.avatar}
          avatarColor={selectedUser.avatarColor}
          bookings={selectedUserBookings}
          requests={selectedUserRequests}
          timeRange={modalTimeRange}
          onTimeRangeChange={setModalTimeRange}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
