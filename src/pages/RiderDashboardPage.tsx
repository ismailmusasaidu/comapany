import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bike, LogOut, MessageSquare, User, MapPin, Phone, Mail, CreditCard,
  Clock, CheckCircle, XCircle, ChevronRight, Menu, AlertCircle, RefreshCw,
  Navigation, Bell, Star, Package, Truck, ChevronDown, ChevronUp
} from 'lucide-react';
import { useRider, AssignedBooking } from '../contexts/RiderContext';
import { supabase } from '../lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VEHICLE_LABEL: Record<string, string> = {
  motorcycle: 'Motorcycle', bicycle: 'Bicycle', tricycle: 'Tricycle (Keke)', car: 'Car',
};

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function ago(d: string) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Status progression ────────────────────────────────────────────────────────

const NEXT_STATUS: Record<string, { label: string; next: string; color: string }> = {
  pending:    { label: 'Mark as Picked Up',  next: 'picked_up',  color: 'bg-orange-500 hover:bg-orange-600' },
  confirmed:  { label: 'Mark as Picked Up',  next: 'picked_up',  color: 'bg-orange-500 hover:bg-orange-600' },
  picked_up:  { label: 'Mark In Transit',    next: 'in_transit', color: 'bg-blue-500 hover:bg-blue-600' },
  in_transit: { label: 'Mark as Delivered',  next: 'delivered',  color: 'bg-green-600 hover:bg-green-700' },
};

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  picked_up:  'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
};

// ── Assignment card ───────────────────────────────────────────────────────────

function AssignmentCard({ booking, onAccept, onReject, onStatusUpdate, accepting, rejecting, updatingStatus }: {
  booking: AssignedBooking;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onStatusUpdate: (newStatus: string) => void;
  accepting: boolean;
  rejecting: boolean;
  updatingStatus: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const statusBadge = {
    pending:  { cls: 'bg-yellow-100 text-yellow-700', label: 'Awaiting Response' },
    accepted: { cls: 'bg-green-100 text-green-700',  label: 'Accepted' },
    rejected: { cls: 'bg-red-100 text-red-700',      label: 'Rejected' },
  }[booking.assignment_status];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            booking.assignment_status === 'accepted' ? 'bg-green-50' :
            booking.assignment_status === 'rejected' ? 'bg-red-50' : 'bg-orange-50'
          }`}>
            <Bike className={`h-5 w-5 ${
              booking.assignment_status === 'accepted' ? 'text-green-600' :
              booking.assignment_status === 'rejected' ? 'text-red-400' : 'text-orange-500'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-gray-900 text-sm">{booking.booking_ref}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
              {booking.assignment_status === 'accepted' && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_BADGE[booking.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {cap(booking.status)}
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">{ago(booking.assigned_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <MapPin className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
              <span className="font-medium">{booking.pickup_city}</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium">{booking.delivery_city}</span>
            </div>
            <p className="text-xs text-gray-500">{cap(booking.package_type)} · {booking.sender_name} → {booking.recipient_name}</p>
          </div>

          <button onClick={() => setExpanded(e => !e)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded details — shown for all, extra info for accepted */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Pickup</p>
                <p className="font-medium text-gray-800">{booking.sender_name}</p>
                <p className="text-gray-500">{booking.sender_phone}</p>
                <p className="text-gray-500">{booking.pickup_city}</p>
                {booking.assignment_status === 'accepted' && <p className="text-gray-500">{booking.sender_address}</p>}
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Dropoff</p>
                <p className="font-medium text-gray-800">{booking.recipient_name}</p>
                <p className="text-gray-500">{booking.recipient_phone}</p>
                <p className="text-gray-500">{booking.delivery_city}</p>
                {booking.assignment_status === 'accepted' && <p className="text-gray-500">{booking.recipient_address}</p>}
              </div>
            </div>
            {booking.assignment_status === 'accepted' && (
              <>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400 mb-0.5">Package</p>
                    <p className="font-medium text-gray-700">{cap(booking.package_type)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400 mb-0.5">Payment</p>
                    <p className="font-medium text-gray-700">{cap(booking.payment_method)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-gray-400 mb-0.5">Delivery</p>
                    <p className="font-medium text-gray-700">{cap(booking.delivery_type)}</p>
                  </div>
                </div>
                {booking.special_instructions && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                    <span className="font-semibold">Note: </span>{booking.special_instructions}
                  </div>
                )}
                {/* Status progression */}
                {NEXT_STATUS[booking.status] && (
                  <button onClick={() => onStatusUpdate(NEXT_STATUS[booking.status].next)} disabled={updatingStatus}
                    className={`w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${NEXT_STATUS[booking.status].color}`}>
                    {updatingStatus
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Truck className="h-4 w-4" />}
                    {NEXT_STATUS[booking.status].label}
                  </button>
                )}
                {booking.status === 'delivered' && (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-green-50 rounded-xl text-sm font-semibold text-green-700">
                    <CheckCircle className="h-4 w-4" /> Delivery Completed
                  </div>
                )}
              </>
            )}
            {booking.assignment_note && booking.assignment_status === 'rejected' && (
              <p className="text-xs text-red-600 italic">Rejection reason: {booking.assignment_note}</p>
            )}
          </div>
        )}

        {/* Actions for pending assignments */}
        {booking.assignment_status === 'pending' && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            {!rejectOpen ? (
              <div className="flex gap-2">
                <button onClick={onAccept} disabled={accepting}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                  {accepting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Accept
                </button>
                <button onClick={() => setRejectOpen(true)} disabled={rejecting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-semibold transition-all">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  placeholder="Reason for rejection (required)..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => setRejectOpen(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                    Back
                  </button>
                  <button onClick={() => { if (reason.trim()) { onReject(reason.trim()); setRejectOpen(false); } }}
                    disabled={!reason.trim() || rejecting}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 rounded-xl text-sm font-semibold transition-all">
                    {rejecting ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RiderDashboardPage() {
  const { user, profile, assignments, notifications, unreadNotifications, ratings, avgRating, location, isLoading,
    signOut, refreshProfile, acceptAssignment, rejectAssignment, updateBookingStatus, markAllNotificationsRead, updateLocation } = useRider();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'history'>('pending');
  const [notifOpen, setNotifOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('is_read', false).eq('sender_role', 'admin')
        .in('thread_id', supabase.from('message_threads').select('id').eq('recipient_id', user.id).eq('recipient_type', 'rider'));
      setUnreadMessages(count || 0);
    };
    fetchUnread();
  }, [user]);

  const handleLogout = async () => { await signOut(); navigate('/rider/login'); };

  const handleShareLocation = () => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported by your browser.'); return; }
    setGpsLoading(true); setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        } catch { setGpsError('Failed to save location.'); }
        setGpsLoading(false);
      },
      () => { setGpsError('Location access denied. Please allow it in browser settings.'); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleAccept = async (booking: AssignedBooking) => {
    setActionLoading(`accept-${booking.id}`);
    try { await acceptAssignment(booking.id, booking.source_table); }
    catch { /* silently handled */ }
    finally { setActionLoading(null); }
  };

  const handleReject = async (booking: AssignedBooking, reason: string) => {
    setActionLoading(`reject-${booking.id}`);
    try { await rejectAssignment(booking.id, booking.source_table, reason); }
    catch { /* silently handled */ }
    finally { setActionLoading(null); }
  };

  const handleStatusUpdate = async (booking: AssignedBooking, newStatus: string) => {
    setActionLoading(`status-${booking.id}`);
    try { await updateBookingStatus(booking.id, booking.source_table, newStatus); }
    catch { /* silently handled */ }
    finally { setActionLoading(null); }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ── No profile (email not confirmed or profile missing) ───────────────────────
  if (!isLoading && !profile) {
    const emailConfirmed = !!user?.email_confirmed_at;
    const handleRefresh = async () => { setRefreshing(true); await refreshProfile(); setRefreshing(false); };
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${emailConfirmed ? 'bg-orange-50' : 'bg-amber-50'}`}>
            {emailConfirmed ? <AlertCircle className="h-8 w-8 text-orange-500" /> : <Mail className="h-8 w-8 text-amber-500" />}
          </div>
          {!emailConfirmed ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Email</h2>
              <p className="text-gray-500 text-sm mb-2 leading-relaxed">We sent a verification link to:</p>
              <p className="text-orange-500 font-semibold text-sm mb-4">{user?.email}</p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-amber-700 font-medium mb-1">Next steps:</p>
                <ul className="text-sm text-amber-600 list-disc list-inside space-y-1">
                  <li>Open your email inbox</li><li>Click the verification link</li><li>Come back here and refresh</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Incomplete</h2>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">Your account exists but your rider profile was not saved.</p>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-orange-700 font-medium mb-1">What to do:</p>
                <ul className="text-sm text-orange-600 list-disc list-inside space-y-1">
                  <li>Sign out and register again with the same email</li><li>Or contact support if the issue persists</li>
                </ul>
              </div>
            </>
          )}
          <button onClick={handleRefresh} disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-60 mb-3">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : emailConfirmed ? 'Retry' : 'I have verified my email'}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // ── Status config ─────────────────────────────────────────────────────────────
  const statusConfig = {
    pending:  { icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  label: 'Pending Review',  message: 'Your application is under review. Admin will contact you within 1–2 business days.' },
    approved: { icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  label: 'Approved',        message: 'Your account is active. You are ready to receive delivery assignments.' },
    rejected: { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',      label: 'Rejected',        message: profile!.rejection_reason || 'Your application was not approved.' },
  };
  const sc = statusConfig[profile!.status];
  const StatusIcon = sc.icon;

  const pendingAssignments  = assignments.filter(a => a.assignment_status === 'pending');
  const acceptedAssignments = assignments.filter(a => a.assignment_status === 'accepted');
  const historyAssignments  = assignments.filter(a => a.assignment_status === 'rejected');

  const tabItems = [
    { key: 'pending' as const,  label: `Pending (${pendingAssignments.length})` },
    { key: 'accepted' as const, label: `Active (${acceptedAssignments.length})` },
    { key: 'history' as const,  label: `Rejected (${historyAssignments.length})` },
  ];

  const tabBookings = activeTab === 'pending' ? pendingAssignments : activeTab === 'accepted' ? acceptedAssignments : historyAssignments;

  const locationFresh = location && (Date.now() - new Date(location.updated_at).getTime()) < 30 * 60 * 1000;

  const navItems = [
    { icon: Bike, label: 'Dashboard', active: true, onClick: () => {} },
    { icon: MessageSquare, label: 'Messages', badge: unreadMessages > 0 ? unreadMessages : undefined, onClick: () => navigate('/rider/messages') },
    { icon: User, label: 'Profile', onClick: () => {} },
  ];

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'block' : 'hidden lg:flex'} flex-col bg-slate-900 text-white ${mobile ? 'w-full h-full' : 'w-64 min-h-screen'}`}>
      <div className="px-6 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bike className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{profile!.full_name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.badge}`}>{sc.label}</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <button key={item.label} onClick={() => { item.onClick(); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${item.active ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge !== undefined && <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{item.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex"><Sidebar /></div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72"><Sidebar mobile /></div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-4 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Rider Dashboard</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Welcome back, {profile!.full_name}</p>
            </div>

            {/* Notification bell */}
            {profile!.status === 'approved' && (
              <div className="relative">
                <button onClick={() => { setNotifOpen(o => !o); if (!notifOpen && unreadNotifications > 0) markAllNotificationsRead(); }}
                  className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadNotifications}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-sm">Notifications</p>
                      <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">Close</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
                      ) : notifications.slice(0, 15).map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.is_read ? 'bg-orange-50/50' : ''}`}>
                          <p className="font-semibold text-gray-800 text-xs">{n.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                          <p className="text-gray-400 text-xs mt-1">{ago(n.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link to="/rider/messages" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              {unreadMessages > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadMessages}</span>}
            </Link>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors" title="Sign out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
          {/* Application status */}
          <div className={`rounded-2xl border p-5 ${sc.bg} ${sc.border}`}>
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`h-6 w-6 ${sc.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-gray-900">Application Status</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sc.badge}`}>{sc.label}</span>
                </div>
                <p className="text-sm text-gray-600">{sc.message}</p>
                {profile!.admin_notes && profile!.status !== 'rejected' && (
                  <p className="text-sm text-gray-500 mt-1.5 italic">Note from admin: {profile!.admin_notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Messages CTA */}
          {unreadMessages > 0 && (
            <button onClick={() => navigate('/rider/messages')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center gap-4 hover:from-orange-600 hover:to-red-600 transition-all text-left">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">You have {unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}</p>
                <p className="text-orange-100 text-sm">Admin has sent you a message</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </button>
          )}

          {/* ── Assignments (approved riders only) ──────────────────────────── */}
          {profile!.status === 'approved' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-gray-900">Delivery Assignments</h3>
                  {pendingAssignments.length > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingAssignments.length} new</span>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                {tabItems.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`flex-1 py-3 text-xs font-semibold transition-all ${activeTab === t.key ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-3">
                {tabBookings.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {activeTab === 'pending' ? 'No pending assignments' :
                       activeTab === 'accepted' ? 'No active deliveries' : 'No rejected assignments'}
                    </p>
                  </div>
                ) : (
                  tabBookings.map(booking => (
                    <AssignmentCard key={booking.id} booking={booking}
                      onAccept={() => handleAccept(booking)}
                      onReject={(reason) => handleReject(booking, reason)}
                      onStatusUpdate={(newStatus) => handleStatusUpdate(booking, newStatus)}
                      accepting={actionLoading === `accept-${booking.id}`}
                      rejecting={actionLoading === `reject-${booking.id}`}
                      updatingStatus={actionLoading === `status-${booking.id}`}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── GPS Location sharing ──────────────────────────────────────── */}
          {profile!.status === 'approved' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${locationFresh ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <Navigation className={`h-5 w-5 ${locationFresh ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">GPS Location</p>
                    {location ? (
                      <p className="text-xs text-gray-500">
                        Last updated {ago(location.updated_at)}
                        {location.city && ` · near ${location.city}`}
                        {locationFresh && <span className="text-green-600 font-medium"> · Active</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Not shared — admin uses your city for assignments</p>
                    )}
                    {gpsError && <p className="text-xs text-red-500 mt-0.5">{gpsError}</p>}
                  </div>
                </div>
                <button onClick={handleShareLocation} disabled={gpsLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${locationFresh ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' : 'bg-orange-500 text-white hover:bg-orange-600'} disabled:opacity-60`}>
                  {gpsLoading ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Navigation className="h-4 w-4" />}
                  {gpsLoading ? 'Locating...' : locationFresh ? 'Update Location' : 'Share Location'}
                </button>
              </div>
            </div>
          )}

          {/* ── Ratings ───────────────────────────────────────────────────── */}
          {profile!.status === 'approved' && ratings.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <h3 className="font-bold text-gray-900">Performance Rating</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`h-4 w-4 ${n <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                  <span className="text-sm font-bold text-gray-900 ml-1">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({ratings.length})</span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {ratings.slice(0, 5).map(r => (
                  <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    {r.comment && <p className="text-xs text-gray-600 flex-1 truncate italic">"{r.comment}"</p>}
                    <p className="text-xs text-gray-400 flex-shrink-0">{ago(r.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Profile ────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Rider Profile</h3>
              <span className="text-xs text-gray-400">Registered {new Date(profile!.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-5">
              <ProfileField icon={User} label="Full Name" value={profile!.full_name} />
              <ProfileField icon={Mail} label="Email" value={profile!.email} />
              <ProfileField icon={Phone} label="Phone" value={profile!.phone} />
              <ProfileField icon={MapPin} label="City" value={profile!.city} />
              <ProfileField icon={MapPin} label="Address" value={profile!.address} />
              <ProfileField icon={Bike} label="Vehicle Type" value={VEHICLE_LABEL[profile!.vehicle_type] || profile!.vehicle_type} />
              <ProfileField icon={CreditCard} label="License Number" value={profile!.license_number} />
              <ProfileField icon={CreditCard} label="NIN" value={profile!.nin} />
            </div>
          </div>

          {/* Messages link */}
          <Link to="/rider/messages"
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-orange-200 transition-all flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 relative">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              {unreadMessages > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadMessages}</span>}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Messages</p>
              <p className="text-xs text-gray-500">View messages from admin</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}
