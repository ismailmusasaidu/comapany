import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck, Lock, Eye, EyeOff, ArrowRight, CheckCircle, XCircle,
  ShieldCheck, KeyRound,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Stage = 'loading' | 'form' | 'success' | 'error';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-yellow-600' : score === 3 ? 'text-yellow-500' : 'text-green-600'}`}>
        {labels[score]}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.pass ? 'bg-green-500' : 'bg-gray-300'}`} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Supabase auto-processes the recovery code/token from the URL via detectSessionInUrl
    // Listen for the PASSWORD_RECOVERY event which fires when the token is valid
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setStage('form');
      }
      if (event === 'SIGNED_IN' && session) {
        // Could arrive here if the recovery token auto-signs in
        setStage('form');
      }
    });

    // Also check if we already have a session (e.g. page refresh after token exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && stage === 'loading') {
        setStage('form');
      }
    });

    // Timeout — if no PASSWORD_RECOVERY event after 8s, token is invalid/expired
    const timeout = setTimeout(() => {
      setStage(s => {
        if (s === 'loading') {
          setError('This reset link has expired or is invalid. Please request a new one.');
          return 'error';
        }
        return s;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown redirect after success
  useEffect(() => {
    if (stage !== 'success') return;
    if (countdown <= 0) {
      navigate('/individual/login');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setStage('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
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

          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 ring-1 ring-white/20">
            {stage === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-400" />
            ) : stage === 'error' ? (
              <XCircle className="h-8 w-8 text-red-400" />
            ) : (
              <KeyRound className="h-8 w-8 text-orange-400" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {stage === 'loading' && 'Verifying link...'}
            {stage === 'form' && 'Set New Password'}
            {stage === 'success' && 'Password Updated!'}
            {stage === 'error' && 'Link Expired'}
          </h1>
          <p className="text-gray-400 text-sm">
            {stage === 'loading' && 'Please wait while we verify your reset link.'}
            {stage === 'form' && 'Choose a strong, unique password for your account.'}
            {stage === 'success' && `Redirecting to login in ${countdown}s...`}
            {stage === 'error' && 'This reset link is no longer valid.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-400" />

          <div className="p-8">
            {/* Loading */}
            {stage === 'loading' && (
              <div className="flex flex-col items-center py-6">
                <div className="w-14 h-14 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mb-5" />
                <p className="text-gray-500 text-sm">Verifying your reset link...</p>
              </div>
            )}

            {/* Form */}
            {stage === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Min. 8 characters"
                      className="w-full pl-11 pr-11 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(''); }}
                      placeholder="Repeat your password"
                      className={`w-full pl-11 pr-11 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white ${
                        confirm && confirm !== password
                          ? 'border-red-300 focus:ring-red-400'
                          : confirm && confirm === password
                          ? 'border-green-300 focus:ring-green-400'
                          : 'border-gray-200 focus:ring-orange-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1 pl-1">Passwords do not match.</p>
                  )}
                  {confirm && confirm === password && (
                    <p className="text-xs text-green-600 mt-1 pl-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Use a unique password you haven't used on other sites. A mix of letters, numbers, and symbols is best.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || password !== confirm || password.length < 8}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Success */}
            {stage === 'success' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>

                {/* Countdown ring */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-50 border-2 border-orange-200 text-orange-600 font-bold text-xl mb-6">
                  {countdown}
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-gray-400 mb-2">Choose your portal to sign in:</p>
                  <Link
                    to="/individual/login"
                    className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-lg hover:shadow-orange-500/20"
                  >
                    Individual Portal <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/agent/login"
                    className="flex items-center justify-between w-full px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-orange-300 hover:text-orange-600 transition-all"
                  >
                    Agent Portal <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/business/login"
                    className="flex items-center justify-between w-full px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:border-orange-300 hover:text-orange-600 transition-all"
                  >
                    Business Portal <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Error */}
            {stage === 'error' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {error || 'This password reset link has expired or has already been used. Please request a new one.'}
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-lg hover:shadow-orange-500/20"
                >
                  <KeyRound className="h-4 w-4" />
                  Request New Reset Link
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Remember your password?{' '}
          <Link to="/individual/login" className="text-gray-400 hover:text-white transition-colors underline underline-offset-2">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
