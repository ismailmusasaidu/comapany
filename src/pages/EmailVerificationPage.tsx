import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Truck, Mail, RefreshCw, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LOGIN_PATHS: Record<string, string> = {
  individual: '/individual/login',
  agent: '/agent/login',
  business: '/business/login',
};

const PORTAL_LABELS: Record<string, string> = {
  individual: 'Individual Portal',
  agent: 'Agent Portal',
  business: 'Business Portal',
};

const APPROVAL_NOTICE: Record<string, string | null> = {
  individual: null,
  agent: 'Note: Your account also requires admin approval before you can log in.',
  business: 'Note: Your company account also requires admin approval before you can access the portal.',
};

const COOLDOWN = 60;

export default function EmailVerificationPage() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const type = params.get('type') ?? 'individual';

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setResendError('');
    setResent(false);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResent(true);
      setCooldown(COOLDOWN);
    } catch (err: unknown) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const loginPath = LOGIN_PATHS[type] ?? '/individual/login';
  const portalLabel = PORTAL_LABELS[type] ?? 'Portal';
  const approvalNotice = APPROVAL_NOTICE[type];

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
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="w-20 h-20 bg-blue-50 border-2 border-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-9 w-9 text-blue-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-1">We sent a confirmation link to</p>
          {email && (
            <p className="text-gray-900 font-semibold text-sm mb-6 break-all">{email}</p>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left mb-6">
            <p className="text-sm text-blue-700 font-medium mb-2">What to do next:</p>
            <ol className="space-y-1 text-sm text-blue-600 list-decimal list-inside">
              <li>Open the email we just sent you</li>
              <li>Click the "Confirm your email" button</li>
              <li>You'll be redirected back and signed in automatically</li>
            </ol>
          </div>

          {approvalNotice && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-left mb-6">
              <p className="text-xs text-amber-700">{approvalNotice}</p>
            </div>
          )}

          {resent && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 justify-center">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Confirmation email resent successfully.
            </div>
          )}

          {resendError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
              {resendError}
            </div>
          )}

          <p className="text-sm text-gray-500 mb-3">Didn't receive the email?</p>
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:border-orange-300 hover:text-orange-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {resending ? (
              <><span className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" /> Sending...</>
            ) : cooldown > 0 ? (
              <><Clock className="h-4 w-4" /> Resend in {cooldown}s</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Resend confirmation email</>
            )}
          </button>

          <p className="text-xs text-gray-400 mb-6">Check your spam or junk folder if you don't see it within a few minutes.</p>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Already confirmed?</p>
            <Link
              to={loginPath}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              Go to {portalLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
