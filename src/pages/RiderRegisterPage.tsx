import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, User, Mail, Phone, MapPin, CreditCard, Lock, Eye, EyeOff, ArrowRight, Car, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'bicycle',    label: 'Bicycle',    icon: '🚲' },
  { value: 'tricycle',   label: 'Tricycle',   icon: '🛺' },
  { value: 'car',        label: 'Car',        icon: '🚗' },
];

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  nin: string;
  vehicle_type: string;
  vehicle_registration: string;
  guarantor_name: string;
  guarantor_phone: string;
  password: string;
  confirm_password: string;
}

const INITIAL: FormData = {
  full_name: '', email: '', phone: '', city: '', address: '',
  nin: '', vehicle_type: 'motorcycle', vehicle_registration: '',
  guarantor_name: '', guarantor_phone: '', password: '', confirm_password: '',
};

export default function RiderRegisterPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authErr) throw authErr;
      if (!data.user) throw new Error('Registration failed. Please try again.');

      const { error: profileErr } = await supabase.from('rider_profiles').insert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        address: form.address,
        nin: form.nin,
        vehicle_type: form.vehicle_type,
        vehicle_registration: form.vehicle_registration,
        guarantor_name: form.guarantor_name,
        guarantor_phone: form.guarantor_phone,
        status: 'pending',
      });
      if (profileErr) throw profileErr;

      await fetch(`${SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({
          email: form.email,
          name: form.full_name,
          portal: 'rider',
          confirmationUrl: `${window.location.origin}/auth/callback`,
        }),
      });

      setRegisteredEmail(form.email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-500 mb-2 leading-relaxed">We sent a verification link to:</p>
          <p className="text-green-600 font-semibold mb-6 text-sm">{registeredEmail}</p>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-8 text-left">
            <p className="text-sm text-green-700 font-medium">What happens next?</p>
            <ul className="mt-2 space-y-1 text-sm text-green-600 list-disc list-inside">
              <li>Click "Verify My Email Address" in the email</li>
              <li>Admin reviews your rider profile (24–48 hrs)</li>
              <li>You receive an approval notification</li>
              <li>Log in and start riding!</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 mb-4">Didn't receive it? Check your spam folder.</p>
          <Link
            to="/rider/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all hover:scale-105"
          >
            Go to Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2.5 rounded-xl">
              <Bike className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Danhausa Logistics</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Rider Registration</h1>
          <p className="text-gray-400">Join our delivery network. Earn on your own schedule.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-500 px-8 py-5">
            <p className="text-white font-semibold">Complete your application to get started</p>
            <p className="text-green-100 text-sm">All fields are required for verification</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Personal Info */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" required value={form.full_name} onChange={set('full_name')}
                    placeholder="Aminu Musa"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel" required value={form.phone} onChange={set('phone')}
                      placeholder="+234 800 000 0000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City / LGA</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text" required value={form.city} onChange={set('city')}
                      placeholder="Kano"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NIN (National ID Number)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text" required value={form.nin} onChange={set('nin')}
                      placeholder="12345678901"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Home Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text" required value={form.address} onChange={set('address')}
                    placeholder="No. 5 Kofar Mata Road, Kano"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Vehicle */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Car className="h-4 w-4" /> Vehicle Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {VEHICLE_TYPES.map(v => (
                      <button
                        key={v.value} type="button"
                        onClick={() => setForm(p => ({ ...p, vehicle_type: v.value }))}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          form.vehicle_type === v.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{v.icon}</span>
                        <span className={`text-xs font-semibold ${form.vehicle_type === v.value ? 'text-green-700' : 'text-gray-600'}`}>
                          {v.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Plate / Registration Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text" value={form.vehicle_registration} onChange={set('vehicle_registration')}
                    placeholder="e.g. ABC-123-XY"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Guarantor */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Guarantor Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Guarantor Full Name</label>
                  <input
                    type="text" required value={form.guarantor_name} onChange={set('guarantor_name')}
                    placeholder="Malam Ibrahim Yusuf"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Guarantor Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel" required value={form.guarantor_phone} onChange={set('guarantor_phone')}
                      placeholder="+234 800 000 0001"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Credentials */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Account Credentials
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email" required value={form.email} onChange={set('email')}
                      placeholder="rider@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required value={form.password} onChange={set('password')}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required value={form.confirm_password} onChange={set('confirm_password')}
                        placeholder="Repeat password"
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting Application...</>
              ) : (
                <><ArrowRight className="h-5 w-5" /> Submit Application</>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already registered?{' '}
              <Link to="/rider/login" className="text-green-600 hover:text-green-700 font-semibold">Sign in here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
