import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function BusinessLoginPage() {
  const { signIn } = useBusiness();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/business/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('email_not_confirmed')) {
        setUnverified(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    await fetch(`${SUPABASE_URL}/functions/v1/send-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({
        email,
        name: email,
        portal: 'business',
        confirmationUrl: `${window.location.origin}/auth/callback`,
      }),
    });
    setResendLoading(false);
    setResendDone(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2.5 rounded-xl">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Danhausa Logistics</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-6 w-6 text-orange-400" />
            <h1 className="text-2xl font-bold text-white">Business Portal</h1>
          </div>
          <p className="text-gray-400 text-sm">Sign in to your business account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5">
            <p className="text-white font-semibold">Welcome back</p>
            <p className="text-orange-100 text-sm">Enter your business credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {unverified && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 font-semibold text-sm mb-1">Email not verified</p>
                <p className="text-amber-700 text-sm mb-3">Please check your inbox and click the verification link before signing in.</p>
                {resendDone ? (
                  <p className="text-green-600 text-sm font-medium">Verification email resent!</p>
                ) : (
                  <button onClick={handleResend} disabled={resendLoading || !email} className="text-sm font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2 disabled:opacity-50">
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="logistics@company.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign In to Business Portal'}
            </button>

            <div className="space-y-2 text-center text-sm text-gray-500">
              <p>
                New business?{' '}
                <Link to="/business/register" className="text-orange-500 hover:text-orange-600 font-semibold">
                  Register here
                </Link>
              </p>
              <p>
                Agent?{' '}
                <Link to="/agent/login" className="text-gray-500 hover:text-gray-700 font-medium underline underline-offset-2">
                  Agent login
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Admin?{' '}
          <Link to="/admin/login" className="text-gray-400 hover:text-white transition-colors">
            Admin login
          </Link>
        </p>
      </div>
    </div>
  );
}
