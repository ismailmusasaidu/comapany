import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase puts the token in the URL hash fragment as access_token
      // or as query params: token_hash + type for PKCE flow
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setErrorMsg(errorDescription ?? error);
        setStatus('error');
        return;
      }

      if (tokenHash && type === 'email') {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        });
        if (verifyErr) {
          setErrorMsg(verifyErr.message);
          setStatus('error');
          return;
        }
        setStatus('success');
        return;
      }

      // Hash-based flow (older Supabase): access_token in fragment
      const hash = window.location.hash;
      if (hash) {
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !data.session) {
          setErrorMsg(sessionErr?.message ?? 'Verification failed.');
          setStatus('error');
          return;
        }
        setStatus('success');
        return;
      }

      setErrorMsg('No verification token found. The link may have expired.');
      setStatus('error');
    };

    handleCallback();
  }, [searchParams]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="h-10 w-10 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verifying your email...</h2>
          <p className="text-gray-500">Please wait while we confirm your email address.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Failed</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">{errorMsg || 'The verification link is invalid or has expired. Please register again or request a new link.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-gray-700 font-bold">Danhausa Logistics</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Email Verified!</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Your email address has been verified successfully. You can now sign in to your account.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/individual/login')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Sign In — Individual Portal
          </button>
          <button
            onClick={() => navigate('/agent/login')}
            className="w-full border border-gray-200 text-gray-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
          >
            Sign In — Agent Portal
          </button>
          <button
            onClick={() => navigate('/business/login')}
            className="w-full border border-gray-200 text-gray-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
          >
            Sign In — Business Portal
          </button>
        </div>
      </div>
    </div>
  );
}
