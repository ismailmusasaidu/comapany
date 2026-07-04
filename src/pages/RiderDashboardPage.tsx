import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, LogOut, MessageSquare, User, MapPin, Phone, Mail, CreditCard, Clock, CheckCircle, XCircle, ChevronRight, Menu, AlertCircle, RefreshCw } from 'lucide-react';
import { useRider } from '../contexts/RiderContext';
import { supabase } from '../lib/supabase';

const VEHICLE_LABEL: Record<string, string> = {
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
  tricycle: 'Tricycle (Keke)',
  car: 'Car',
};

export default function RiderDashboardPage() {
  const { user, profile, isLoading, signOut, refreshProfile } = useRider();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('sender_role', 'admin')
        .in('thread_id',
          supabase
            .from('message_threads')
            .select('id')
            .eq('recipient_id', user.id)
            .eq('recipient_type', 'rider')
        );
      setUnreadMessages(count || 0);
    };
    fetchUnread();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/rider/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoading && !profile) {
    const emailConfirmed = !!user?.email_confirmed_at;

    const handleRefresh = async () => {
      setRefreshing(true);
      await refreshProfile();
      setRefreshing(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${emailConfirmed ? 'bg-orange-50' : 'bg-amber-50'}`}>
            {emailConfirmed
              ? <AlertCircle className="h-8 w-8 text-orange-500" />
              : <Mail className="h-8 w-8 text-amber-500" />}
          </div>

          {!emailConfirmed ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Your Email</h2>
              <p className="text-gray-500 text-sm mb-2 leading-relaxed">
                We sent a verification link to:
              </p>
              <p className="text-orange-500 font-semibold text-sm mb-4">{user?.email}</p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-amber-700 font-medium mb-1">Next steps:</p>
                <ul className="text-sm text-amber-600 list-disc list-inside space-y-1">
                  <li>Open your email inbox</li>
                  <li>Click the verification link</li>
                  <li>Come back here and refresh</li>
                </ul>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-60 mb-3"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking...' : 'I have verified my email'}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Incomplete</h2>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                Your account exists but your rider profile was not saved. This can happen if the form was submitted twice or there was a network error.
              </p>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-orange-700 font-medium mb-1">What to do:</p>
                <ul className="text-sm text-orange-600 list-disc list-inside space-y-1">
                  <li>Sign out and register again with the same email</li>
                  <li>Or contact support if the issue persists</li>
                </ul>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-60 mb-3"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking...' : 'Retry'}
              </button>
            </>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      label: 'Pending Review',
      message: 'Your application is under review. Admin will contact you within 1–2 business days.',
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-700',
      label: 'Approved',
      message: 'Your account is active. You are ready to receive delivery assignments.',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      label: 'Rejected',
      message: profile.rejection_reason || 'Your application was not approved. Please contact support for details.',
    },
  };

  const sc = statusConfig[profile.status];
  const StatusIcon = sc.icon;

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
            <p className="font-bold text-white text-sm truncate">{profile.full_name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.badge}`}>{sc.label}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <button key={item.label} onClick={() => { item.onClick(); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              item.active ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}>
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge !== undefined && (
              <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-4 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Rider Dashboard</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Welcome back, {profile.full_name}</p>
            </div>
            <Link to="/rider/messages" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadMessages}</span>
              )}
            </Link>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors" title="Sign out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
          {/* Application Status Card */}
          <div className={`rounded-2xl border p-6 ${sc.bg} ${sc.border}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`h-6 w-6 ${sc.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-gray-900">Application Status</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sc.badge}`}>{sc.label}</span>
                </div>
                <p className="text-sm text-gray-600">{sc.message}</p>
                {profile.admin_notes && profile.status !== 'rejected' && (
                  <p className="text-sm text-gray-500 mt-2 italic">Note from admin: {profile.admin_notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Message CTA */}
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

          {/* Profile Info */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Rider Profile</h3>
              <span className="text-xs text-gray-400">Registered {new Date(profile.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-5">
              <ProfileField icon={User} label="Full Name" value={profile.full_name} />
              <ProfileField icon={Mail} label="Email" value={profile.email} />
              <ProfileField icon={Phone} label="Phone" value={profile.phone} />
              <ProfileField icon={MapPin} label="City" value={profile.city} />
              <ProfileField icon={MapPin} label="Address" value={profile.address} />
              <ProfileField icon={Bike} label="Vehicle Type" value={VEHICLE_LABEL[profile.vehicle_type] || profile.vehicle_type} />
              <ProfileField icon={CreditCard} label="License Number" value={profile.license_number} />
              <ProfileField icon={CreditCard} label="NIN" value={profile.nin} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/rider/messages"
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-orange-200 transition-all flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 relative">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadMessages}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Messages</p>
                <p className="text-xs text-gray-500">View messages from admin</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center gap-4 opacity-60">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bike className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-500">Delivery Assignments</p>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
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
