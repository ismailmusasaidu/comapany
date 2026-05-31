import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Package, Truck, Users, Building2, User,
  Calendar, TrendingUp, TrendingDown, Minus, BarChart3, Filter,
  ChevronDown, Activity, CheckCircle, XCircle, Clock, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'all';
type SectionFilter = 'all' | 'individual' | 'agent' | 'business';

interface RawBooking {
  id: string;
  status: string;
  created_at: string;
  delivery_type?: string | null;
}

interface RawRequest {
  id: string;
  status: string;
  created_at: string;
  service_type: string;
}

interface AllData {
  individualBookings: RawBooking[];
  individualRequests: RawRequest[];
  agentBookings: RawBooking[];
  agentRequests: RawRequest[];
  businessBookings: RawBooking[];
  businessRequests: RawRequest[];
}

function getStartDate(range: TimeRange): string | null {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  if (range === 'quarter') {
    return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  }
  return null;
}

function filterByRange<T extends { created_at: string }>(items: T[], range: TimeRange): T[] {
  const start = getStartDate(range);
  if (!start) return items;
  return items.filter(i => i.created_at >= start);
}

function cap(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDay(items: { created_at: string }[], range: TimeRange): { label: string; count: number }[] {
  if (items.length === 0) return [];

  const buckets: Record<string, number> = {};

  if (range === 'today') {
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      buckets[label] = 0;
    }
    items.forEach(i => {
      const h = new Date(i.created_at).getHours();
      const label = `${h.toString().padStart(2, '0')}:00`;
      buckets[label] = (buckets[label] ?? 0) + 1;
    });
  } else if (range === 'week') {
    const now = new Date();
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const label = date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' });
      buckets[label] = 0;
    }
    items.forEach(i => {
      const date = new Date(i.created_at);
      const label = date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' });
      if (buckets[label] !== undefined) buckets[label]++;
    });
  } else {
    items.forEach(i => {
      const date = new Date(i.created_at);
      const label = date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
      buckets[label] = (buckets[label] ?? 0) + 1;
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

function MiniBarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  if (data.length === 0) return <p className="text-xs text-gray-400 text-center py-4">No data</p>;
  return (
    <div className="flex items-end gap-0.5 h-16 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full bg-orange-400 rounded-t-sm transition-all duration-500 min-h-[2px]"
            style={{ height: `${Math.max(2, (d.count / max) * 56)}px` }}
          />
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {d.label}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, color, iconBg,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBreakdown({ items, type }: { items: { status: string }[]; type: 'booking' | 'request' }) {
  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...sorted.map(s => s[1]), 1);

  if (sorted.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-6">No data for this period</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map(([status, count]) => (
        <div key={status} className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 w-28 text-center ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {cap(status)}
          </span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${type === 'booking' ? 'bg-orange-400' : 'bg-blue-400'}`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-800 w-6 text-right flex-shrink-0">{count}</span>
        </div>
      ))}
    </div>
  );
}

function SectionPanel({
  title, icon: Icon, iconColor, iconBg, accentColor,
  bookings, requests, range,
}: {
  title: string;
  icon: React.FC<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  accentColor: string;
  bookings: RawBooking[];
  requests: RawRequest[];
  range: TimeRange;
}) {
  const filteredBookings = filterByRange(bookings, range);
  const filteredRequests = filterByRange(requests, range);

  const deliveredBookings = filteredBookings.filter(b => b.status === 'delivered').length;
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
  const activeBookings = filteredBookings.filter(b => !['delivered', 'cancelled'].includes(b.status)).length;
  const completedRequests = filteredRequests.filter(r => r.status === 'completed').length;

  const bookingChartData = groupByDay(filteredBookings, range);
  const requestChartData = groupByDay(filteredRequests, range);

  const deliveryTypeBreakdown = filteredBookings.reduce((acc, b) => {
    const key = b.delivery_type ?? 'unspecified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceTypeBreakdown = filteredRequests.reduce((acc, r) => {
    acc[r.service_type] = (acc[r.service_type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3`}>
        <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">
            {filteredBookings.length} deliveries · {filteredRequests.length} logistics requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accentColor}`}>
            {filteredBookings.length + filteredRequests.length} total
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Package, label: 'Deliveries', value: filteredBookings.length, color: 'text-orange-600', bg: 'bg-orange-50' },
            { icon: CheckCircle, label: 'Delivered', value: deliveredBookings, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: Activity, label: 'Active', value: activeBookings, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: XCircle, label: 'Cancelled', value: cancelledBookings, color: 'text-red-500', bg: 'bg-red-50' },
          ].map(k => (
            <div key={k.label} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
              <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Delivery bookings chart */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Delivery Bookings</p>
                <p className="text-xs text-gray-400">{filteredBookings.length} total</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
                <Package className="h-3 w-3" /> Deliveries
              </div>
            </div>
            <MiniBarChart data={bookingChartData} />
          </div>

          {/* Logistics requests chart */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-800">Logistics Requests</p>
                <p className="text-xs text-gray-400">{filteredRequests.length} total · {completedRequests} completed</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                <Truck className="h-3 w-3" /> Requests
              </div>
            </div>
            <MiniBarChart data={requestChartData.map(d => ({ ...d }))} />
          </div>
        </div>

        {/* Status breakdowns */}
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Booking Status Breakdown</p>
            <StatusBreakdown items={filteredBookings} type="booking" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">Request Status Breakdown</p>
            <StatusBreakdown items={filteredRequests} type="request" />
          </div>
        </div>

        {/* Delivery type + service type */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Delivery type breakdown */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-800 mb-3">Delivery Types</p>
            {Object.keys(deliveryTypeBreakdown).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No deliveries</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(deliveryTypeBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const colors: Record<string, string> = {
                      same_state: 'bg-green-100 text-green-700',
                      inter_state: 'bg-orange-100 text-orange-700',
                      international: 'bg-blue-100 text-blue-700',
                      unspecified: 'bg-gray-100 text-gray-600',
                    };
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {cap(type)}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{count}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Service type breakdown */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-bold text-gray-800 mb-3">Service Types Requested</p>
            {Object.keys(serviceTypeBreakdown).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No requests</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(serviceTypeBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([svc, count]) => (
                    <div key={svc} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-medium">{cap(svc)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${(count / Math.max(...Object.values(serviceTypeBreakdown))) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-800 w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Last 3 Months' },
  { key: 'all', label: 'All Time' },
];

const SECTION_FILTERS: { key: SectionFilter; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { key: 'all', label: 'All', icon: BarChart3, color: 'text-gray-600' },
  { key: 'individual', label: 'Individual', icon: User, color: 'text-teal-600' },
  { key: 'agent', label: 'Agent', icon: Users, color: 'text-orange-600' },
  { key: 'business', label: 'Business', icon: Building2, color: 'text-blue-600' },
];

export default function AdminOrdersAnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [data, setData] = useState<AllData>({
    individualBookings: [],
    individualRequests: [],
    agentBookings: [],
    agentRequests: [],
    businessBookings: [],
    businessRequests: [],
  });

  const fetchAll = async () => {
    setLoading(true);
    const [
      indBookRes, indReqRes,
      agentBookRes, agentReqRes,
      bizBookRes, bizReqRes,
    ] = await Promise.all([
      supabase.from('delivery_bookings')
        .select('id, status, created_at, delivery_type')
        .not('individual_id', 'is', null)
        .order('created_at', { ascending: false }),
      supabase.from('logistics_requests')
        .select('id, status, created_at, service_type')
        .not('individual_id', 'is', null)
        .order('created_at', { ascending: false }),
      supabase.from('delivery_bookings')
        .select('id, status, created_at, delivery_type')
        .not('agent_id', 'is', null)
        .order('created_at', { ascending: false }),
      supabase.from('logistics_requests')
        .select('id, status, created_at, service_type')
        .not('agent_id', 'is', null)
        .order('created_at', { ascending: false }),
      supabase.from('business_delivery_bookings')
        .select('id, status, created_at, delivery_type')
        .order('created_at', { ascending: false }),
      supabase.from('business_logistics_requests')
        .select('id, status, created_at, service_type')
        .order('created_at', { ascending: false }),
    ]);

    setData({
      individualBookings: (indBookRes.data ?? []) as RawBooking[],
      individualRequests: (indReqRes.data ?? []) as RawRequest[],
      agentBookings: (agentBookRes.data ?? []) as RawBooking[],
      agentRequests: (agentReqRes.data ?? []) as RawRequest[],
      businessBookings: (bizBookRes.data ?? []) as RawBooking[],
      businessRequests: (bizReqRes.data ?? []) as RawRequest[],
    });
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const totals = useMemo(() => {
    const allBookings = [
      ...filterByRange(data.individualBookings, timeRange),
      ...filterByRange(data.agentBookings, timeRange),
      ...filterByRange(data.businessBookings, timeRange),
    ];
    const allRequests = [
      ...filterByRange(data.individualRequests, timeRange),
      ...filterByRange(data.agentRequests, timeRange),
      ...filterByRange(data.businessRequests, timeRange),
    ];
    return {
      bookings: allBookings.length,
      requests: allRequests.length,
      delivered: allBookings.filter(b => b.status === 'delivered').length,
      completed: allRequests.filter(r => r.status === 'completed').length,
      cancelled: allBookings.filter(b => b.status === 'cancelled').length,
      pending: allBookings.filter(b => b.status === 'pending').length + allRequests.filter(r => r.status === 'pending').length,
    };
  }, [data, timeRange]);

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
              <p className="text-gray-500 text-sm">Delivery and logistics stats across Individual, Agent, and Business portals</p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            className={`p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          {/* Time range */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
            <Calendar className="h-4 w-4 text-gray-400 ml-2" />
            {TIME_RANGES.map(t => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === t.key
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Section filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
            <Filter className="h-4 w-4 text-gray-400 ml-2" />
            {SECTION_FILTERS.map(s => (
              <button
                key={s.key}
                onClick={() => setSectionFilter(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sectionFilter === s.key
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ─── Global KPI row ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: Package, label: 'Total Deliveries', value: totals.bookings, color: 'text-orange-600', bg: 'bg-orange-50' },
                { icon: Truck, label: 'Logistics Requests', value: totals.requests, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: CheckCircle, label: 'Delivered', value: totals.delivered, color: 'text-green-600', bg: 'bg-green-50' },
                { icon: Zap, label: 'Completed Reqs', value: totals.completed, color: 'text-teal-600', bg: 'bg-teal-50' },
                { icon: Clock, label: 'Pending', value: totals.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { icon: XCircle, label: 'Cancelled', value: totals.cancelled, color: 'text-red-500', bg: 'bg-red-50' },
              ].map(k => (
                <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <k.icon className={`h-4.5 w-4.5 ${k.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* ─── Section panels ─── */}
            <div className="space-y-6">
              {(sectionFilter === 'all' || sectionFilter === 'individual') && (
                <SectionPanel
                  title="Individual Users"
                  icon={User}
                  iconColor="text-teal-600"
                  iconBg="bg-teal-50"
                  accentColor="bg-teal-50 text-teal-700"
                  bookings={data.individualBookings}
                  requests={data.individualRequests}
                  range={timeRange}
                />
              )}

              {(sectionFilter === 'all' || sectionFilter === 'agent') && (
                <SectionPanel
                  title="Agents"
                  icon={Users}
                  iconColor="text-orange-600"
                  iconBg="bg-orange-50"
                  accentColor="bg-orange-50 text-orange-700"
                  bookings={data.agentBookings}
                  requests={data.agentRequests}
                  range={timeRange}
                />
              )}

              {(sectionFilter === 'all' || sectionFilter === 'business') && (
                <SectionPanel
                  title="Businesses"
                  icon={Building2}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-50"
                  accentColor="bg-blue-50 text-blue-700"
                  bookings={data.businessBookings}
                  requests={data.businessRequests}
                  range={timeRange}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
