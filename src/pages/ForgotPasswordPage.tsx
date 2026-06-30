import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Truck, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const portal = (searchParams.get('portal') ?? 'individual') as 'agent' | 'business' | 'individual';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const loginPath = portal === 'agent'
    ? '/agent/login'
    : portal === 'business'
    ? '/business/login'
    : '/individual/login';

  const portalLabel = portal === 'agent'
    ? 'Agent Portal'
    : portal === 'business'
    ? 'Business Portal'
    : 'Individual Portal';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetErr) throw resetErr;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h2>
          <p className="text-gray-500 mb-2 leading-relaxed">We sent a password reset link to:</p>
          <p className="text-orange-500 font-semibold mb-6 text-sm">{email}</p>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-8 text-left">
            <p className="text-sm text-orange-700 font-medium">Next steps:</p>
            <ul className="mt-2 space-y-1 text-sm text-orange-600 list-disc list-inside">
              <li>Open the email from Danhausa Logistics</li>
              <li>Click the "Reset Password" link</li>
              <li>Enter your new password</li>
              <li>Sign in with your new credentials</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 mb-4">The link expires in 1 hour. Check your spam folder if not received.</p>
          <Link
            to={loginPath}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all hover:scale-105"
          >
            Back to Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2.5 rounded-xl">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Danhausa Logistics</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400 text-sm">{portalLabel} — enter your email and we'll send a reset link</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5">
            <p className="text-white font-semibold">Password Reset</p>
            <p className="text-orange-100 text-sm">Enter the email address linked to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
              ) : (
                <><ArrowRight className="h-5 w-5" /> Send Reset Link</>
              )}
            </button>

            <div className="text-center">
              <Link
                to={loginPath}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
