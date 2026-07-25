const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface PaystackInitParams {
  bookingRef: string;
  tableName: string;
  amountKobo: number;
  customerEmail: string;
}

export async function initializePaystackPayment(params: PaystackInitParams): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/paystack-initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      booking_ref: params.bookingRef,
      table_name: params.tableName,
      amount_kobo: params.amountKobo,
      customer_email: params.customerEmail,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.authorization_url) {
    throw new Error(data?.error || 'Could not start Paystack payment. Please try again.');
  }
  return data.authorization_url as string;
}
