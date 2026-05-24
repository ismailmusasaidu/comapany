import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck, Package, BarChart3, Clock, CheckCircle, XCircle,
  LogOut, Plus, ChevronRight, AlertTriangle, User, Building2,
  MapPin, Phone, Mail, TrendingUp, Activity, FileText
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { supabase } from '../lib/supabase';
import BookingDetailModal from '../components/BookingDetailModal';

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  deliveredBookings: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
}

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
  service_type: string;
  status: string;
  created_at: string;
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-orange-50 text-orange-600 border-orange-200',
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

function capitalize(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentDashboardPage() {
  const { user, profile, signOut, refreshProfile } = useAgent();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalBookings: 0, pendingBookings: 0, deliveredBookings: 0, totalRequests: 0, pendingRequests: 0, completedRequests: 0 });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<RecentBooking | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    if (!user || !profile || profile.status !== 'approved') return;
    fetchData();
  }, [user, profile]);

  const fetchData = async () => {
    if (!user) return;

    const [
      { data: bookings },
      { data: requests },
    ] = await Promise.all([
      supabase.from('delivery_bookings').select('*').eq('agent_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('logistics_requests').select('id, request_ref, title, service_type, status, created_at').eq('agent_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]);

    setRecentBookings(bookings ?? []);
    setRecentRequests(requests ?? []);

    const [
      { count: totalBookings },
      { count: pendingBookings },
      { count: deliveredBookings },
      { count: totalRequests },
      { count: pendingRequests },
      { count: completedRequests },
    ] = await Promise.all([
      supabase.from('delivery_bookings').select('id', { count: 'exact', head: true }).eq('agent_id', user.id),
      supabase.from('delivery_bookings').select('id', { count: 'exact', head: true }).eq('agent_id', user.id).eq('status', 'pending'),
      supabase.from('delivery_bookings').select('id', { count: 'exact', head: true }).eq('agent_id', user.id).eq('status', 'delivered'),
      supabase.from('logistics_requests').select('id', { count: 'exact', head: true }).eq('agent_id', user.id),
      supabase.from('logistics_requests').select('id', { count: 'exact', head: true }).eq('agent_id', user.id).eq('status', 'pending'),
      supabase.from('logistics_requests').select('id', { count: 'exact', head: true }).eq('agent_id', user.id).eq('status', 'completed'),
    ]);

    setStats({
      totalBookings: totalBookings ?? 0,
      pendingBookings: pendingBookings ?? 0,
      deliveredBookings: deliveredBookings ?? 0,
      totalRequests: totalRequests ?? 0,
      pendingRequests: pendingRequests ?? 0,
      completedRequests: completedRequests ?? 0,
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/agent/login');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar + content layout */}
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
                profile.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  profile.status === 'approved' ? 'bg-green-400' :
                  profile.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                }`} />
                {capitalize(profile.status)}
              </span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider px-3 mb-2">Navigation</p>
            <Link to="/agent/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            {profile.status === 'approved' && (
              <>
                <Link to="/agent/booking/new" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
                  <Package className="h-4 w-4" /> Delivery Bookings
                </Link>
                <Link to="/agent/logistics/new" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm">
                  <Truck className="h-4 w-4" /> Logistics Requests
                </Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-gray-500 text-sm">{profile.company_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleLogout} disabled={loggingOut} className="lg:hidden flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium">
                <LogOut className="h-4 w-4" />
              </button>
              {profile.status === 'approved' && (
                <Link
                  to="/agent/booking/new"
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-md hover:shadow-orange-500/20"
                >
                  <Plus className="h-4 w-4" /> New Booking
                </Link>
              )}
            </div>
          </header>

          <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Pending/Rejected banners */}
            {profile.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-yellow-800 text-lg mb-1">Application Under Review</h3>
                  <p className="text-yellow-700 text-sm leading-relaxed">
                    Your agent registration is pending admin approval. We'll notify you by email once your account is activated. This usually takes 24–48 hours.
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-yellow-600">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {profile.full_name}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {profile.company_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.city}</span>
                  </div>
                </div>
              </div>
            )}

            {profile.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg mb-1">Application Rejected</h3>
                  {profile.rejection_reason && (
                    <p className="text-red-700 text-sm mb-2">Reason: {profile.rejection_reason}</p>
                  )}
                  <p className="text-red-600 text-sm">Please contact support if you believe this is an error.</p>
                </div>
              </div>
            )}

            {profile.status === 'approved' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Bookings', value: stats.totalBookings, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Pending Bookings', value: stats.pendingBookings, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Delivered', value: stats.deliveredBookings, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Total Requests', value: stats.totalRequests, icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Pending Requests', value: stats.pendingRequests, icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Completed', value: stats.completedRequests, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link
                    to="/agent/booking/new"
                    className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white group hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Package className="h-6 w-6" />
                      </div>
                      <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">New Delivery Booking</h3>
                    <p className="text-orange-100 text-sm">Create a delivery order for a customer shipment</p>
                  </Link>

                  <Link
                    to="/agent/logistics/new"
                    className="bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl p-6 text-white group hover:shadow-xl hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <Truck className="h-6 w-6" />
                      </div>
                      <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Request Logistics Service</h3>
                    <p className="text-blue-200 text-sm">Freight, warehousing, express, customs and more</p>
                  </Link>
                </div>

                {/* Recent activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Bookings */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Recent Bookings</h3>
                      <Link to="/agent/booking/new" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
                        New <Plus className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recentBookings.length === 0 ? (
                      <div className="p-8 text-center">
                        <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No bookings yet</p>
                        <Link to="/agent/booking/new" className="text-orange-500 text-sm font-medium hover:underline mt-2 inline-block">Create your first booking</Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {recentBookings.map(b => (
                          <div key={b.id} className="px-6 py-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => setSelectedBooking(b)}>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{b.booking_ref}</p>
                              <p className="text-xs text-gray-500 truncate">{b.recipient_name} · {b.delivery_city}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {capitalize(b.status)}
                              </span>
                              <span className="text-xs text-gray-400">{timeAgo(b.created_at)}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Requests */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">Recent Requests</h3>
                      <Link to="/agent/logistics/new" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
                        New <Plus className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {recentRequests.length === 0 ? (
                      <div className="p-8 text-center">
                        <Truck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No requests yet</p>
                        <Link to="/agent/logistics/new" className="text-orange-500 text-sm font-medium hover:underline mt-2 inline-block">Submit your first request</Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {recentRequests.map(r => (
                          <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{r.title}</p>
                              <p className="text-xs text-gray-500 truncate">{r.request_ref} · {capitalize(r.service_type)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${REQUEST_STATUS_STYLES[r.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {capitalize(r.status)}
                              </span>
                              <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Profile card always visible */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" /> Agent Profile
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {[
                  { icon: User, label: 'Full Name', value: profile.full_name },
                  { icon: Building2, label: 'Company', value: profile.company_name },
                  { icon: Mail, label: 'Email', value: profile.email },
                  { icon: Phone, label: 'Phone', value: profile.phone },
                  { icon: MapPin, label: 'City', value: profile.city },
                  { icon: AlertTriangle, label: 'ID Number', value: profile.id_number },
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
    </div>
  );
}
