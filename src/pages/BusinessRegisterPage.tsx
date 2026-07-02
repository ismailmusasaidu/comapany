import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Building2, Mail, Phone, MapPin, CreditCard,
  Lock, Eye, EyeOff, ArrowRight, Briefcase, Users, Globe
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface FormData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  industry: string;
  company_size: string;
  address: string;
  city: string;
  registration_number: string;
  tax_id: string;
  password: string;
  confirm_password: string;
}

const INITIAL: FormData = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  industry: '',
  company_size: 'small',
  address: '',
  city: '',
  registration_number: '',
  tax_id: '',
  password: '',
  confirm_password: '',
};

const INDUSTRIES = [
  'Agriculture', 'Automotive', 'Construction', 'Education', 'Energy',
  'Fashion & Retail', 'Food & Beverage', 'Healthcare', 'Manufacturing',
  'Mining', 'Oil & Gas', 'Technology', 'Telecommunications', 'Other',
];

const COMPANY_SIZES = [
  { value: 'small', label: 'Small', desc: '1–50 employees' },
  { value: 'medium', label: 'Medium', desc: '51–200 employees' },
  { value: 'large', label: 'Large', desc: '201–1000 employees' },
  { value: 'enterprise', label: 'Enterprise', desc: '1000+ employees' },
];

export default function BusinessRegisterPage() {
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({
          portal: 'business',
          email: form.email,
          password: form.password,
          redirectTo: `${window.location.origin}/auth/callback`,
          profile: {
            company_name: form.company_name,
            contact_person: form.contact_person,
            phone: form.phone,
            industry: form.industry,
            company_size: form.company_size,
            address: form.address,
            city: form.city,
            registration_number: form.registration_number,
            tax_id: form.tax_id,
            status: 'pending',
          },
        }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Registration failed.');

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
          <p className="text-gray-500 mb-2 leading-relaxed">We sent a verification link to:</p>
          <p className="text-orange-500 font-semibold mb-6 text-sm">{registeredEmail}</p>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-8 text-left">
            <p className="text-sm text-orange-700 font-medium">What happens next?</p>
            <ul className="mt-2 space-y-1 text-sm text-orange-600 list-disc list-inside">
              <li>Open the email and click "Verify My Email Address"</li>
              <li>Admin reviews your business profile</li>
              <li>You receive approval notification</li>
              <li>Log in to access your business dashboard</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 mb-4">Didn't receive it? Check your spam folder or try registering again.</p>
          <Link
            to="/business/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all hover:scale-105"
          >
            Go to Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2.5 rounded-xl">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Danhausa Logistics</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Business Registration</h1>
          <p className="text-gray-400">Register your company to access enterprise logistics solutions.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5">
            <p className="text-white font-semibold">Complete your company profile</p>
            <p className="text-orange-100 text-sm">All fields are required for business verification</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Company Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text" required value={form.company_name} onChange={set('company_name')}
                      placeholder="Acme Nigeria Ltd."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select
                        required value={form.industry} onChange={set('industry')}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all bg-white appearance-none"
                      >
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text" required value={form.city} onChange={set('city')}
                        placeholder="Lagos"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Company Size</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COMPANY_SIZES.map(s => (
                      <button key={s.value} type="button" onClick={() => setForm(p => ({ ...p, company_size: s.value }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.company_size === s.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className={`h-3.5 w-3.5 ${form.company_size === s.value ? 'text-orange-500' : 'text-gray-400'}`} />
                          <p className={`font-semibold text-xs ${form.company_size === s.value ? 'text-orange-700' : 'text-gray-800'}`}>{s.label}</p>
                        </div>
                        <p className="text-xs text-gray-400">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text" required value={form.address} onChange={set('address')}
                      placeholder="12 Commerce Street, Lagos Island"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">CAC / Registration Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text" required value={form.registration_number} onChange={set('registration_number')}
                        placeholder="RC123456"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax ID / TIN (optional)</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text" value={form.tax_id} onChange={set('tax_id')}
                        placeholder="TIN number"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4" /> Primary Contact
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person Name</label>
                  <input
                    type="text" required value={form.contact_person} onChange={set('contact_person')}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel" required value={form.phone} onChange={set('phone')}
                      placeholder="+234 800 000 0000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Credentials */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Account Credentials
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email" required value={form.email} onChange={set('email')}
                      placeholder="logistics@company.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
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
                        type={showConfirm ? 'text' : 'password'} required value={form.confirm_password} onChange={set('confirm_password')}
                        placeholder="Repeat password"
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting Application...</>
              ) : (
                <><ArrowRight className="h-5 w-5" /> Submit Business Registration</>
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/business/login" className="text-orange-500 hover:text-orange-600 font-semibold">
                Sign in here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
