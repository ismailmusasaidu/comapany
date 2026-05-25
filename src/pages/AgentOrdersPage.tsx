import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck, Package, BarChart3, LogOut, Plus, Search, Filter,
  ChevronUp, ChevronDown, ChevronsUpDown, MessageSquare,
  ArrowLeft, Calendar, SlidersHorizontal, X, FileDown, Eye,
  RefreshCw
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { supabase } from '../lib/supabase';
import BookingDetailModal from '../components/BookingDetailModal';
import InvoiceModal, { type InvoiceData } from '../components/InvoiceModal';

interface Booking {
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

interface LogisticsRequest {
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

type Tab = 'bookings' | 'requests';
type SortField = 'created_at' | 'status' | 'ref' | 'destination' | 'type';
type SortDir = 'asc' | 'desc';

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

const BOOKING_STATUSES = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];
const REQUEST_STATUSES = ['pending', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected'];
const PACKAGE_TYPES = ['document', 'parcel', 'fragile', 'heavy'];
const SERVICE_TYPES = ['freight', 'warehousing', 'express', 'bulk', 'customs', 'last_mile'];

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

function SortIcon({ field, active, dir }: { field: string; active: string; dir: SortDir }) {
  if (active !== field) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-300" />;
  return dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-orange-500" /> : <ChevronDown className="h-3.5 w-3.5 text-orange-500" />;
}

export default function AgentOrdersPage() {
  const { user, profile, signOut } = useAgent();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<LogisticsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    if (!user || !profile || profile.status !== 'approved') { setLoading(false); return; }
    fetchAll();
    fetchUnread();
  }, [user, profile]);

  // Reset page when filters/tab change
  useEffect(() => { setPage(1); }, [tab, search, statusFilter, typeFilter, dateFrom, dateTo]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [bRes, rRes] = await Promise.all([
      supabase.from('delivery_bookings').select('*').eq('agent_id', user.id).order('created_at', { ascending: false }),
      supabase.from('logistics_requests').select('id, request_ref, title, description, service_type, origin, destination, quantity, weight_kg, preferred_date, budget_range, status, created_at').eq('agent_id', user.id).order('created_at', { ascending: false }),
    ]);
    setBookings(bRes.data ?? []);
    setRequests(rRes.data ?? []);
    setLoading(false);
  };

  const fetchUnread = async () => {
    if (!user) return;
    const { data: threads } = await supabase.from('message_threads').select('id').eq('recipient_id', user.id).eq('recipient_type', 'agent');
    if (!threads?.length) return;
    const ids = threads.map(t => t.id);
    const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).in('thread_id', ids).eq('is_read', false).eq('sender_role', 'admin');
    setUnreadMessages(count || 0);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/agent/login');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortDir('desc'); }
  };

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setTypeFilter('');
    setDateFrom(''); setDateTo('');
  };
  const hasActiveFilters = search || statusFilter || typeFilter || dateFrom || dateTo;

  // Filtered + sorted bookings
  const filteredBookings = useMemo(() => {
    let list = bookings.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        if (!b.booking_ref.toLowerCase().includes(q) &&
            !b.sender_name.toLowerCase().includes(q) &&
            !b.recipient_name.toLowerCase().includes(q) &&
            !b.pickup_city.toLowerCase().includes(q) &&
            !b.delivery_city.toLowerCase().includes(q)) return false;
      }
      if (statusFilter && b.status !== statusFilter) return false;
      if (typeFilter && b.package_type !== typeFilter) return false;
      if (dateFrom && b.created_at < dateFrom) return false;
      if (dateTo && b.created_at > dateTo + 'T23:59:59') return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let av = '', bv = '';
      if (sortField === 'created_at') { av = a.created_at; bv = b.created_at; }
      else if (sortField === 'status') { av = a.status; bv = b.status; }
      else if (sortField === 'ref') { av = a.booking_ref; bv = b.booking_ref; }
      else if (sortField === 'destination') { av = a.delivery_city; bv = b.delivery_city; }
      else if (sortField === 'type') { av = a.package_type; bv = b.package_type; }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [bookings, search, statusFilter, typeFilter, dateFrom, dateTo, sortField, sortDir]);

  // Filtered + sorted requests
  const filteredRequests = useMemo(() => {
    let list = requests.filter(r => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.request_ref.toLowerCase().includes(q) &&
            !r.title.toLowerCase().includes(q) &&
            !r.origin.toLowerCase().includes(q) &&
            !r.destination.toLowerCase().includes(q)) return false;
      }
      if (statusFilter && r.status !== statusFilter) return false;
      if (typeFilter && r.service_type !== typeFilter) return false;
      if (dateFrom && r.created_at < dateFrom) return false;
      if (dateTo && r.created_at > dateTo + 'T23:59:59') return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let av = '', bv = '';
      if (sortField === 'created_at') { av = a.created_at; bv = b.created_at; }
      else if (sortField === 'status') { av = a.status; bv = b.status; }
      else if (sortField === 'ref') { av = a.request_ref; bv = b.request_ref; }
      else if (sortField === 'destination') { av = a.destination; bv = b.destination; }
      else if (sortField === 'type') { av = a.service_type; bv = b.service_type; }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [requests, search, statusFilter, typeFilter, dateFrom, dateTo, sortField, sortDir]);

  const activeList = tab === 'bookings' ? filteredBookings : filteredRequests;
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const pageSlice = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-30 hidden lg:flex">
          <div className="p-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-sm">Danhausa Logistics</span>
            </Link>
          </div>

          <div className="p-4 border-b border-white/10">
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
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                profile.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                profile.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  profile.status === 'approved' ? 'bg-green-400' :
                  profile.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                }`} />
                {cap(profile.status)}
              </span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider px-3 mb-2">Navigation</p>
            <Link to="/agent/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            {profile.status === 'approved' && (
              <>
                <Link to="/agent/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm">
                  <SlidersHorizontal className="h-4 w-4" /> Orders & Requests
                </Link>
                <Link to="/agent/booking/new" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
                  <Package className="h-4 w-4" /> New Booking
                </Link>
                <Link to="/agent/logistics/new" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
                  <Truck className="h-4 w-4" /> New Logistics Request
                </Link>
                <Link to="/agent/messages" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm relative">
                  <MessageSquare className="h-4 w-4" /> Messages
                  {unreadMessages > 0 && (
                    <span className="ml-auto w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadMessages}</span>
                  )}
                </Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} disabled={loggingOut}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64">
          {/* Header */}
          <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <Link to="/agent/dashboard" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Orders & Requests</h1>
                <p className="text-gray-500 text-sm">{profile.company_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAll} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link to="/agent/booking/new"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-md hover:shadow-orange-500/20">
                <Plus className="h-4 w-4" /> New Booking
              </Link>
            </div>
          </header>

          <div className="p-6 max-w-7xl mx-auto space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Bookings', value: bookings.length, color: 'text-orange-600', bg: 'bg-orange-50', icon: Package },
                { label: 'Pending Bookings', value: bookings.filter(b => b.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Package },
                { label: 'Total Requests', value: requests.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Truck },
                { label: 'Pending Requests', value: requests.filter(r => r.status === 'pending').length, color: 'text-teal-600', bg: 'bg-teal-50', icon: Truck },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <card.icon className={`h-4.5 w-4.5 ${card.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs + Search + Filter bar */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 pt-4 pb-0 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTab('bookings')}
                      className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition-colors border-b-2 ${
                        tab === 'bookings'
                          ? 'text-orange-600 border-orange-500 bg-orange-50/50'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Delivery Bookings
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'bookings' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {filteredBookings.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setTab('requests')}
                      className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition-colors border-b-2 ${
                        tab === 'requests'
                          ? 'text-blue-600 border-blue-500 bg-blue-50/50'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Logistics Requests
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'requests' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {filteredRequests.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter bar */}
              <div className="px-5 py-3 border-b border-gray-50 flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={tab === 'bookings' ? 'Search ref, sender, recipient, city...' : 'Search ref, title, origin, destination...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                  />
                </div>

                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border transition-colors ${showFilters ? 'bg-orange-50 text-orange-600 border-orange-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </button>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
                    >
                      <option value="">All statuses</option>
                      {(tab === 'bookings' ? BOOKING_STATUSES : REQUEST_STATUSES).map(s => (
                        <option key={s} value={s}>{cap(s)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {tab === 'bookings' ? 'Package Type' : 'Service Type'}
                    </label>
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
                    >
                      <option value="">All types</option>
                      {(tab === 'bookings' ? PACKAGE_TYPES : SERVICE_TYPES).map(t => (
                        <option key={t} value={t}>{cap(t)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">From Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Table */}
              {loading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {tab === 'bookings' ? (
                    <div className="overflow-x-auto">
                      {filteredBookings.length === 0 ? (
                        <div className="py-16 text-center">
                          <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium">No bookings found</p>
                          {hasActiveFilters && <button onClick={clearFilters} className="text-orange-500 text-sm hover:underline mt-1">Clear filters</button>}
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr>
                              <th className={thClass} onClick={() => handleSort('ref')}>
                                <span className="flex items-center gap-1">Ref <SortIcon field="ref" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</th>
                              <th className={thClass} onClick={() => handleSort('destination')}>
                                <span className="flex items-center gap-1">Route <SortIcon field="destination" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className={thClass} onClick={() => handleSort('type')}>
                                <span className="flex items-center gap-1">Type <SortIcon field="type" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className={thClass} onClick={() => handleSort('status')}>
                                <span className="flex items-center gap-1">Status <SortIcon field="status" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className={thClass} onClick={() => handleSort('created_at')}>
                                <span className="flex items-center gap-1">Date <SortIcon field="created_at" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(pageSlice as Booking[]).map(b => (
                              <tr key={b.id} className="hover:bg-orange-50/30 transition-colors group">
                                <td className="px-4 py-3.5">
                                  <span className="font-mono font-semibold text-gray-900 text-xs">{b.booking_ref}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="font-medium text-gray-900 truncate max-w-28">{b.sender_name}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-28">{b.pickup_city}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="font-medium text-gray-900 truncate max-w-28">{b.recipient_name}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-28">{b.recipient_phone}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="text-gray-700 text-xs">{b.pickup_city}</p>
                                  <p className="text-gray-400 text-xs">→ {b.delivery_city}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{cap(b.package_type)}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {cap(b.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(b.created_at).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedBooking(b)}
                                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="View details"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setInvoiceData({ type: 'booking', ...b, agent_company: profile?.company_name, agent_name: profile?.full_name, agent_phone: profile?.phone, agent_email: profile?.email })}
                                      className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                      title="Generate invoice"
                                    >
                                      <FileDown className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {filteredRequests.length === 0 ? (
                        <div className="py-16 text-center">
                          <Truck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-400 font-medium">No requests found</p>
                          {hasActiveFilters && <button onClick={clearFilters} className="text-orange-500 text-sm hover:underline mt-1">Clear filters</button>}
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr>
                              <th className={thClass} onClick={() => handleSort('ref')}>
                                <span className="flex items-center gap-1">Ref <SortIcon field="ref" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                              <th className={thClass} onClick={() => handleSort('type')}>
                                <span className="flex items-center gap-1">Service <SortIcon field="type" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className={thClass} onClick={() => handleSort('destination')}>
                                <span className="flex items-center gap-1">Route <SortIcon field="destination" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</th>
                              <th className={thClass} onClick={() => handleSort('status')}>
                                <span className="flex items-center gap-1">Status <SortIcon field="status" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className={thClass} onClick={() => handleSort('created_at')}>
                                <span className="flex items-center gap-1">Date <SortIcon field="created_at" active={sortField} dir={sortDir} /></span>
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(pageSlice as LogisticsRequest[]).map(r => (
                              <tr key={r.id} className="hover:bg-blue-50/20 transition-colors group">
                                <td className="px-4 py-3.5">
                                  <span className="font-mono font-semibold text-gray-900 text-xs">{r.request_ref}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="font-medium text-gray-900 truncate max-w-40">{r.title}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-40">{r.description}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{cap(r.service_type)}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="text-gray-700 text-xs truncate max-w-28">{r.origin}</p>
                                  <p className="text-gray-400 text-xs truncate max-w-28">→ {r.destination}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="text-xs text-gray-600">{cap(r.budget_range)}</span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${REQUEST_STATUS_STYLES[r.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {cap(r.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(r.created_at).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <button
                                    onClick={() => setInvoiceData({ type: 'request', ...r, agent_company: profile?.company_name, agent_name: profile?.full_name, agent_phone: profile?.phone, agent_email: profile?.email })}
                                    className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Generate invoice"
                                  >
                                    <FileDown className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Pagination */}
                  {activeList.length > PAGE_SIZE && (
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, activeList.length)} of {activeList.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                          Prev
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                          return (
                            <button
                              key={pg}
                              onClick={() => setPage(pg)}
                              className={`w-8 h-8 text-xs rounded-lg transition-colors ${pg === page ? 'bg-orange-500 text-white font-semibold' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                            >
                              {pg}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
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
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}

      {invoiceData && <InvoiceModal data={invoiceData} onClose={() => setInvoiceData(null)} />}
    </div>
  );
}
