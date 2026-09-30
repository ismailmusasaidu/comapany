import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, Mail, ArrowRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const PORTALS: Record<string, { label: string; loginPath: string; registerPath: string }> = {
  individual: { label: 'Individual Portal', loginPath: '/individual/login', registerPath: '/individual/register' },
  agent:      { label: 'Agent Portal',       loginPath: '/agent/login',      registerPath: '/agent/register' },
  business:   { label: 'Business Portal',    loginPath: '/business/login',   registerPath: '/business/register' },
  rider:      { label: 'Rider Portal',       loginPath: '/rider/login',       registerPath: '/rider/register' },
};

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const portal = PORTALS[searchParams.get('portal') ?? ''] ? (searchParams.get('portal') as string) : 'individual';
  const portalMeta = PORTALS[portal];

  const [emailInput, setEmailInput] = useState(searchParams.get('email') ?? '');
  const [emailConfirmed, setEmailConfirmed] = useState(!!searchParams.get('email'));
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(''), [digits]);
  const isComplete = code.length === 6 && digits.every(d => d !== '');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const focusBox = (idx: number) => inputsRef.current[idx]?.focus();

  const setDigit = (idx: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits(prev => { const next = [...prev]; next[idx] = ''; return next; });
      return;
    }
    setDigits(prev => {
      const next = [...prev];
      // support paste of full code into any box
      if (clean.length > 1) {
        const chars = clean.slice(0, 6).split('');
        for (let i = 0; i < 6; i++) next[i] = chars[i] ?? '';
        return next;
      }
      next[idx] = clean;
      return next;
    });
    if (clean.length === 1 && idx < 5) focusBox(idx + 1);
    setError('');
    setAttemptsLeft(null);
  };

  const handleKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) focusBox(idx - 1);
  };

  useEffect(() => {
    if (isComplete && !loading && !verified) submitCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const submitCode = async (enteredCode: string) => {
    if (enteredCode.length !== 6) { setError('Please enter the 6-digit code from your email.'); return; }
    setLoading(true);
    setError('');
    setAttemptsLeft(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: emailInput.trim(), code: enteredCode }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const msg: string = data.error ?? 'Verification failed.';
        const match = msg.match(/(\d+) attempts remaining/i);
        if (match) setAttemptsLeft(Number(match[1]));
        if (/no active code/i.test(msg)) {
          setError('This code has expired or no code was found. Please request a new code below.');
        } else {
          setError(msg);
        }
        setDigits(Array(6).fill(''));
        focusBox(0);
        return;
      }
      setVerified(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setDigits(Array(6).fill(''));
      focusBox(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ to: emailInput.trim(), name: emailInput.trim(), portal }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? 'Could not resend the code. Please try again.');
        return;
      }
      if (data.already_confirmed) {
        setError('Your email is already confirmed. Please sign in instead.');
        return;
      }
      setResendSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(6).fill(''));
      focusBox(0);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2.5 rounded-xl">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Danhausa Logistics</span>
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl p-8">{children}</div>
      </div>
    </div>
  );

  if (verified) {
    return shell(
      <>
        <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Email Verified!</h2>
        <p className="text-gray-500 mb-8 text-center leading-relaxed">
          Your email address has been confirmed. You can now sign in to your {portalMeta.label.toLowerCase()} account.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(portalMeta.loginPath)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            Sign In — {portalMeta.label} <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-200 text-gray-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
          >
            Back to Home
          </button>
        </div>
      </>
    );
  }

  if (!emailConfirmed) {
    return shell(
      <>
        <div className="w-16 h-16 bg-orange-50 border-2 border-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Verify Your Email</h2>
        <p className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
          Enter the email address you registered with and we will send you a 6-digit confirmation code.
        </p>
        <form
          onSubmit={e => { e.preventDefault(); if (emailInput.trim()) { setEmailConfirmed(true); setCooldown(0); setResendSent(false); } }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            Send Code <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to={portalMeta.registerPath} className="text-orange-500 hover:text-orange-600 font-semibold">
            Register here
          </Link>
        </p>
      </>
    );
  }

  return shell(
    <>
      <div className="w-16 h-16 bg-orange-50 border-2 border-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="h-8 w-8 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Enter Your Code</h2>
      <p className="text-gray-500 text-sm mb-2 text-center leading-relaxed">
        We sent a 6-digit confirmation code to:
      </p>
      <p className="text-orange-500 font-semibold text-sm mb-6 text-center break-all">{emailInput}</p>

      <form onSubmit={e => { e.preventDefault(); if (isComplete && !loading) submitCode(code); }}>
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={d}
              disabled={loading}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={handleKeyDown(i)}
              onFocus={e => e.target.select()}
              className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold border-2 rounded-xl transition-all focus:outline-none focus:ring-2 ${
                error && !loading
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : d
                  ? 'border-orange-400 bg-orange-50 focus:ring-orange-500'
                  : 'border-gray-200 focus:ring-orange-500'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {attemptsLeft !== null && attemptsLeft <= 2 && !error && (
          <p className="text-amber-600 text-xs mb-4 text-center">
            Warning: only {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining before the code is invalidated.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !isComplete}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
          ) : (
            <>Verify Email <CheckCircle className="h-4 w-4" /></>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        {resendSent ? (
          <p className="text-sm text-gray-500 mb-3">
            {cooldown > 0 ? (
              <>A new code was sent. You can request another in <span className="font-semibold text-orange-600">{cooldown}s</span>.</>
            ) : (
              'A new code has been sent to your email.'
            )}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-3">Didn't receive the code?</p>
        )}
        <button
          onClick={handleResend}
          disabled={resendLoading || cooldown > 0}
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
          {resendLoading ? 'Sending new code...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
        <p className="text-xs text-gray-400 mt-4">
          Wrong email or need to start over?{' '}
          <button
            onClick={() => { setEmailInput(''); setEmailConfirmed(false); setDigits(Array(6).fill('')); setError(''); setResendSent(false); setCooldown(0); }}
            className="text-gray-500 hover:text-orange-600 underline underline-offset-2"
          >
            Use a different email
          </button>
        </p>
      </div>
    </>
  );
}
