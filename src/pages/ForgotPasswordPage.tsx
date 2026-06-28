import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Mail, ArrowRight, ArrowLeft, CheckCircle, KeyRound, ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Stage = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setStage('sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setResent(false);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setResent(true);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/25">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Danhausa Logistics</span>
          </Link>

          {stage === 'form' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 ring-1 ring-white/20">
                <KeyRound className="h-8 w-8 text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                No worries — enter your email and we'll send you a secure reset link.
              </p>
            </>
          )}

          {stage === 'sent' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 ring-1 ring-white/20">
                <Mail className="h-8 w-8 text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Check your inbox</h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                We sent a password reset link to your email address.
              </p>
            </>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card header strip */}
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-400" />

          <div className="p-8">
            {stage === 'form' && (
              <form onSubmit={submit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 pl-1">
                    Enter the email address linked to your account.
                  </p>
                </div>

                {/* Security note */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600 leading-relaxed">
                    The reset link expires in <span className="font-semibold">1 hour</span>. For security, you can only request one link at a time.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            )}

            {stage === 'sent' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-xs text-gray-500 mb-1">Reset link sent to</p>
                  <p className="text-sm font-semibold text-gray-800 break-all">{email}</p>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-left mb-6">
                  <p className="text-sm font-semibold text-orange-800 mb-2">What to do next:</p>
                  <ol className="space-y-1.5 text-sm text-orange-700 list-decimal list-inside">
                    <li>Open the email we sent you</li>
                    <li>Click "Reset password"</li>
                    <li>Choose a strong new password</li>
                  </ol>
                </div>

                <p className="text-xs text-gray-400 mb-5">
                  Can't find the email? Check your spam or junk folder.
                </p>

                {resent && (
                  <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                    <CheckCircle className="h-4 w-4" /> Email resent successfully!
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={resend}
                  disabled={resending}
                  className="w-full border-2 border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
                >
                  {resending ? (
                    <><span className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" /> Sending...</>
                  ) : (
                    'Resend reset email'
                  )}
                </button>

                <button
                  onClick={() => { setStage('form'); setResent(false); setError(''); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Use a different email address
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-7 pt-6 border-t border-gray-100 flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <Link to="/individual/login" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Portal links */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-500">
          <Link to="/individual/login" className="hover:text-gray-300 transition-colors">Individual</Link>
          <span className="text-gray-700">·</span>
          <Link to="/agent/login" className="hover:text-gray-300 transition-colors">Agent</Link>
          <span className="text-gray-700">·</span>
          <Link to="/business/login" className="hover:text-gray-300 transition-colors">Business</Link>
        </div>
      </div>
    </div>
  );
}
