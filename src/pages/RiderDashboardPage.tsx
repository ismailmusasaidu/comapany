import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bike, LogOut, User, Phone, MapPin, CreditCard, Shield, Car,
  Clock, CheckCircle, XCircle, AlertTriangle, Mail, RefreshCw,
} from 'lucide-react';
import { useRider } from '../contexts/RiderContext';

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: '🏍️ Motorcycle',
  bicycle:    '🚲 Bicycle',
  tricycle:   '🛺 Tricycle',
  car:        '🚗 Car',
};

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badgeBg: 'bg-yellow-100',
    label: 'Pending Review',
    title: 'Application Under Review',
    message: 'Your rider application has been received and is being reviewed by our team. This typically takes 24–48 hours. You will be notified once a decision is made.',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badgeBg: 'bg-green-100',
    label: 'Approved',
    title: 'You are Approved!',
    message: 'Congratulations! Your rider account is active. Welcome to the Danhausa delivery network. Our operations team will contact you with your first assignments.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badgeBg: 'bg-red-100',
    label: 'Not Approved',
    title: 'Application Not Approved',
    message: 'Unfortunately your application was not approved at this time. Please review the reason below and contact us if you have questions.',
  },
};

export default function RiderDashboardPage() {
  const { user, profile, isLoading, signOut, refreshProfile } = useRider();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate('/rider/login');
  }, [isLoading, user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/rider/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="font-bold text-gray-800 text-xl mb-2">Profile Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">We could not load your rider profile. Please try signing out and back in.</p>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 text-red-500 font-semibold hover:text-red-600 text-sm">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[profile.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Bike className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base hidden sm:block">Rider Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </span>
            <button
              onClick={() => refreshProfile()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Status Banner */}
        <div className={`rounded-2xl border-2 p-6 ${statusCfg.bg} ${statusCfg.border}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusCfg.badgeBg}`}>
              <StatusIcon className={`h-6 w-6 ${statusCfg.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-bold mb-1 ${statusCfg.color}`}>{statusCfg.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{statusCfg.message}</p>

              {profile.status === 'rejected' && profile.rejection_reason && (
                <div className="mt-3 bg-red-100 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Reason:</p>
                  <p className="text-sm text-red-700">{profile.rejection_reason}</p>
                </div>
              )}

              {profile.status === 'approved' && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-green-200 shadow-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">Active Rider</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                    <Bike className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{VEHICLE_LABELS[profile.vehicle_type] ?? profile.vehicle_type}</span>
                  </div>
                </div>
              )}

              {profile.status === 'pending' && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-xs text-yellow-700 font-medium">Estimated review time: 24–48 hours</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Steps — only for pending */}
        {profile.status === 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">What happens next?</h3>
            <div className="space-y-3">
              {[
                { step: '1', label: 'Application Received', done: true,  desc: 'Your details have been saved successfully.' },
                { step: '2', label: 'Admin Review',         done: false, desc: 'Our team is reviewing your profile and documents.' },
                { step: '3', label: 'Decision Sent',        done: false, desc: 'You will be notified by email of the outcome.' },
                { step: '4', label: 'Start Riding!',        done: false, desc: 'Approved riders receive their first assignment brief.' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${s.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {s.done ? <CheckCircle className="h-4 w-4" /> : s.step}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${s.done ? 'text-green-700' : 'text-gray-700'}`}>{s.label}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <User className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Your Profile</h3>
              <p className="text-xs text-gray-500">Submitted application details</p>
            </div>
          </div>

          <div className="p-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green-200">
                <span className="text-white font-bold text-2xl">{profile.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <span className={`inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                  <StatusIcon className="h-3 w-3" /> {statusCfg.label}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <ProfileField icon={Phone}      label="Phone"          value={profile.phone} />
              <ProfileField icon={MapPin}     label="City"           value={profile.city} />
              <ProfileField icon={MapPin}     label="Address"        value={profile.address} />
              <ProfileField icon={CreditCard} label="NIN"            value={profile.nin} />
              <ProfileField icon={Car}        label="Vehicle"        value={VEHICLE_LABELS[profile.vehicle_type] ?? profile.vehicle_type} />
              {profile.vehicle_registration && (
                <ProfileField icon={Car}      label="Plate Number"   value={profile.vehicle_registration} />
              )}
              <ProfileField icon={Shield}     label="Guarantor"      value={profile.guarantor_name} />
              <ProfileField icon={Phone}      label="Guarantor Phone" value={profile.guarantor_phone} />
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Application submitted on{' '}
                <span className="font-medium text-gray-500">
                  {new Date(profile.created_at).toLocaleDateString('en-NG', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
          <Mail className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Need help?</p>
            <p className="text-sm text-blue-700">
              Questions about your application?{' '}
              <a href="mailto:support@danhausa.com" className="underline font-medium">support@danhausa.com</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function ProfileField({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}
