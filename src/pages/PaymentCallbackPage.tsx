import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight, Package } from 'lucide-react';

type PayState = 'verifying' | 'success' | 'failed';

export default function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref') || '';
  const [state, setState] = useState<PayState>('verifying');
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    if (!reference) {
      setState('failed');
      setMessage('No payment reference was returned. If you completed a payment, please contact support with your booking reference.');
      return;
    }
    calledRef.current = true;
    (async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-verify?reference=${encodeURIComponent(reference)}`;
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        });
        const data = await res.json();
        if (res.ok && data?.status === 'success') {
          setState('success');
          setBookingRef(data.booking_ref ?? null);
        } else {
          setState('failed');
          setMessage(data?.message || 'Your payment could not be confirmed. If you were charged, please contact support.');
        }
      } catch {
        setState('failed');
        setMessage('We could not reach the payment verification service. If you completed a payment, please contact support.');
      }
    })();
  }, [reference]);

  const dashboardLink = bookingRef?.startsWith('BB-')
    ? '/business/dashboard'
    : bookingRef?.startsWith('AB-')
      ? '/agent/dashboard'
      : '/individual/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-sm border border-gray-100">
        {state === 'verifying' && (
          <>
            <div className="w-20 h-20 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirming your payment…</h2>
            <p className="text-gray-500 text-sm">Please wait while we verify your Paystack payment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h2>
            <p className="text-gray-500 mb-3">Your payment has been confirmed and your booking is now confirmed.</p>
            {bookingRef && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-6 py-3 inline-block mb-8">
                <p className="text-xs text-green-600 font-medium">Booking Reference</p>
                <p className="text-xl font-bold text-green-700">{bookingRef}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Link to={dashboardLink}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Confirmed</h2>
            <p className="text-gray-500 mb-6 text-sm">{message || 'Your payment could not be confirmed.'}</p>
            <div className="flex gap-3 justify-center">
              <Link to={dashboardLink}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                <Package className="h-4 w-4" /> Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
