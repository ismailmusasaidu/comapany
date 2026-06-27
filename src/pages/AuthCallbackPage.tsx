import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Status = 'loading' | 'success' | 'error';

async function detectUserType(userId: string): Promise<string> {
  const [ind, agent, biz] = await Promise.all([
    supabase.from('individual_profiles').select('id').eq('id', userId).maybeSingle(),
    supabase.from('agent_profiles').select('id').eq('id', userId).maybeSingle(),
    supabase.from('business_profiles').select('id').eq('id', userId).maybeSingle(),
  ]);

  if (ind.data) return 'individual';
  if (agent.data) return 'agent';
  if (biz.data) return 'business';
  return 'unknown';
}

const DASHBOARD_PATHS: Record<string, string> = {
  individual: '/individual/dashboard',
  agent: '/agent/dashboard',
  business: '/business/dashboard',
  unknown: '/',
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const type = await detectUserType(session.user.id);
          setStatus('success');
          setTimeout(() => navigate(DASHBOARD_PATHS[type] ?? '/'), 1200);
        } catch {
          setStatus('error');
          setErrorMsg('Could not determine your account type. Please log in manually.');
        }
      }
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        const type = await detectUserType(session.user.id);
        navigate(DASHBOARD_PATHS[type] ?? '/');
      }
    });

    // If already signed in when arriving at callback (e.g. re-visit)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && status === 'loading') {
        try {
          const type = await detectUserType(session.user.id);
          setStatus('success');
          setTimeout(() => navigate(DASHBOARD_PATHS[type] ?? '/'), 1200);
        } catch {
          setStatus('error');
          setErrorMsg('Could not determine your account type. Please log in manually.');
        }
      }
    });

    // Timeout guard
    const timeout = setTimeout(() => {
      setStatus(s => {
        if (s === 'loading') {
          setErrorMsg('Verification timed out. Please try clicking the link again or log in manually.');
          return 'error';
        }
        return s;
      });
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-2xl">
            <Truck className="h-7 w-7 text-white" />
          </div>
        </div>

        {status === 'loading' && (
          <>
            <div className="w-14 h-14 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h2>
            <p className="text-gray-500 text-sm">Please wait while we confirm your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email confirmed!</h2>
            <p className="text-gray-500 text-sm">Redirecting you to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h2>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <div className="flex flex-col gap-3">
              <a href="/individual/login" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                Individual Login
              </a>
              <a href="/agent/login" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                Agent Login
              </a>
              <a href="/business/login" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                Business Login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
