import { useState, useRef } from 'react';
import {
  Search, Package, MapPin, Clock, CheckCircle, Truck, AlertCircle,
  XCircle, RefreshCw, ChevronRight, Phone, Mail, User, Weight,
  Calendar, Building2, FileText, Layers, DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type OrderKind = 'legacy' | 'delivery' | 'logistics';

interface TrackedOrder {
  kind: OrderKind;
  id: string;
  order_id: string;
  // customer
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  // route
  origin: string;
  destination: string;
  // status
  status: string;
  // delivery-specific
  package_description?: string;
  weight_kg?: number | null;
  // logistics-specific
  service_type?: string;
  description?: string;
  quantity?: string | null;
  weight?: string | null;
  budget_range?: string;
  // shared
  delivery_type?: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

interface TrackingEvent {
  id: string;
  order_id: string;
  status: string;
  title: string;
  description: string;
  location: string;
  occurred_at: string;
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  pending:                        { label: 'Pending',                    color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-200',  icon: Clock },
  confirmed:                      { label: 'Confirmed',                  color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',    icon: CheckCircle },
  picked_up:                      { label: 'Picked Up',                  color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200',  icon: Package },
  in_transit:                     { label: 'In Transit',                 color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-200',  icon: Truck },
  out_for_delivery:               { label: 'Out for Delivery',           color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',   icon: Truck },
  delivered:                      { label: 'Delivered',                  color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',   icon: CheckCircle },
  cancelled:                      { label: 'Cancelled',                  color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',     icon: XCircle },
  // National (inter-state)
  national_in_transit:            { label: 'National — In Transit',      color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-200',     icon: Truck },
  national_at_hub:                { label: 'National — At Hub',          color: 'text-sky-800',    bg: 'bg-sky-50',     border: 'border-sky-300',     icon: MapPin },
  national_out_for_delivery:      { label: 'National — Out for Delivery',color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',    icon: Truck },
  // International
  international_in_transit:       { label: 'International — In Transit', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',    icon: Truck },
  customs_clearance:              { label: 'Customs Clearance',          color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',   icon: AlertCircle },
  customs_hold:                   { label: 'Customs Hold',               color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertCircle },
  international_out_for_delivery: { label: 'Intl — Out for Delivery',    color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',    icon: Truck },
  // Logistics
  reviewing:                      { label: 'Under Review',               color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',    icon: Clock },
  approved:                       { label: 'Approved',                   color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200',    icon: CheckCircle },
  in_progress:                    { label: 'In Progress',                color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200',  icon: Truck },
  completed:                      { label: 'Completed',                  color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',   icon: CheckCircle },
  rejected:                       { label: 'Rejected',                   color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',     icon: XCircle },
};

const DELIVERY_STEPS = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
const NATIONAL_STEPS = ['pending', 'confirmed', 'picked_up', 'national_in_transit', 'national_at_hub', 'national_out_for_delivery', 'delivered'];
const INTERNATIONAL_STEPS = ['pending', 'confirmed', 'picked_up', 'international_in_transit', 'customs_clearance', 'international_out_for_delivery', 'delivered'];
const LOGISTICS_STEPS = ['pending', 'reviewing', 'approved', 'in_progress', 'completed'];

const NATIONAL_STATUSES = new Set(['national_in_transit', 'national_at_hub', 'national_out_for_delivery']);
const INTERNATIONAL_STATUSES = new Set(['international_in_transit', 'customs_clearance', 'customs_hold', 'international_out_for_delivery']);

function getDeliverySteps(status: string, deliveryType?: string | null) {
  if (deliveryType === 'international' || INTERNATIONAL_STATUSES.has(status)) return INTERNATIONAL_STEPS;
  if (deliveryType === 'national' || deliveryType === 'inter_state' || NATIONAL_STATUSES.has(status)) return NATIONAL_STEPS;
  return DELIVERY_STEPS;
}

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

const DELIVERY_STEP_META: Record<string, { title: string; description: string }> = {
  pending:                        { title: 'Booking Received',                    description: 'Your booking has been received and is awaiting confirmation.' },
  confirmed:                      { title: 'Booking Confirmed',                   description: 'Your booking has been confirmed and is being prepared for pickup.' },
  picked_up:                      { title: 'Package Picked Up',                   description: 'The package has been collected from the sender.' },
  in_transit:                     { title: 'In Transit',                          description: 'Your package is on its way to the destination.' },
  out_for_delivery:               { title: 'Out for Delivery',                    description: 'The package is out for final delivery to the recipient.' },
  delivered:                      { title: 'Delivered',                           description: 'The package has been successfully delivered to the recipient.' },
  cancelled:                      { title: 'Order Cancelled',                     description: 'This order was cancelled.' },
  // National
  national_in_transit:            { title: 'Inter-State Transit',                 description: 'Your package is en route between states.' },
  national_at_hub:                { title: 'Arrived at Hub',                      description: 'Your package has arrived at a national distribution hub.' },
  national_out_for_delivery:      { title: 'Out for Delivery (National)',          description: 'The package is out for final delivery in the destination state.' },
  // International
  international_in_transit:       { title: 'International Transit',               description: 'Your package is in international transit.' },
  customs_clearance:              { title: 'Customs Clearance',                   description: 'Your package is undergoing customs inspection and clearance.' },
  customs_hold:                   { title: 'Customs Hold',                        description: 'Your package is being held by customs. Our team will contact you.' },
  international_out_for_delivery: { title: 'Out for Delivery (International)',     description: 'Your package has cleared customs and is out for final delivery.' },
};

const LOGISTICS_STEP_META: Record<string, { title: string; description: string }> = {
  pending:     { title: 'Request Submitted',    description: 'Your logistics request has been received and is awaiting review.' },
  reviewing:   { title: 'Under Review',         description: 'Our team is reviewing your request and assessing feasibility.' },
  approved:    { title: 'Request Approved',     description: 'Your logistics request has been approved and is being scheduled.' },
  in_progress: { title: 'In Progress',          description: 'Your logistics operation is currently underway.' },
  completed:   { title: 'Completed',            description: 'Your logistics request has been successfully completed.' },
  rejected:    { title: 'Request Rejected',     description: 'This logistics request was not approved.' },
};

function synthesizeLogisticsHistory(
  currentStatus: string,
  createdAt: string,
  updatedAt: string,
): TrackingEvent[] {
  if (currentStatus === 'rejected') {
    return [{
      id: 'rejected',
      order_id: '',
      status: 'rejected',
      title: LOGISTICS_STEP_META.rejected.title,
      description: LOGISTICS_STEP_META.rejected.description,
      location: '',
      occurred_at: updatedAt,
    }];
  }

  const steps = LOGISTICS_STEPS;
  const currentIdx = steps.indexOf(currentStatus);
  const completedSteps = currentIdx >= 0 ? steps.slice(0, currentIdx + 1) : [];

  return completedSteps.map((step, idx) => {
    let occurred_at: string;
    if (completedSteps.length === 1) {
      occurred_at = createdAt;
    } else if (idx === 0) {
      occurred_at = createdAt;
    } else if (idx === completedSteps.length - 1) {
      occurred_at = updatedAt;
    } else {
      const start = new Date(createdAt).getTime();
      const end = new Date(updatedAt).getTime();
      const t = idx / (completedSteps.length - 1);
      occurred_at = new Date(start + t * (end - start)).toISOString();
    }
    const meta = LOGISTICS_STEP_META[step] ?? { title: cap(step), description: '' };
    return {
      id: step,
      order_id: '',
      status: step,
      title: meta.title,
      description: meta.description,
      location: '',
      occurred_at,
    };
  });
}

function synthesizeDeliveryHistory(
  currentStatus: string,
  createdAt: string,
  updatedAt: string,
  deliveryType?: string | null,
): TrackingEvent[] {
  const steps = getDeliverySteps(currentStatus, deliveryType);
  const currentIdx = steps.indexOf(currentStatus);
  const completedSteps = currentIdx >= 0 ? steps.slice(0, currentIdx + 1) : [];

  // If cancelled, just show the single cancelled event
  if (currentStatus === 'cancelled') {
    return [{
      id: 'cancelled',
      order_id: '',
      status: 'cancelled',
      title: DELIVERY_STEP_META.cancelled.title,
      description: DELIVERY_STEP_META.cancelled.description,
      location: '',
      occurred_at: updatedAt,
    }];
  }

  // Spread timestamps: created_at for first step, updated_at for last, interpolate between
  return completedSteps.map((step, idx) => {
    let occurred_at: string;
    if (completedSteps.length === 1) {
      occurred_at = createdAt;
    } else if (idx === 0) {
      occurred_at = createdAt;
    } else if (idx === completedSteps.length - 1) {
      occurred_at = updatedAt;
    } else {
      // Interpolate between created and updated
      const start = new Date(createdAt).getTime();
      const end = new Date(updatedAt).getTime();
      const t = idx / (completedSteps.length - 1);
      occurred_at = new Date(start + t * (end - start)).toISOString();
    }
    const meta = DELIVERY_STEP_META[step] ?? { title: cap(step), description: '' };
    return {
      id: step,
      order_id: '',
      status: step,
      title: meta.title,
      description: meta.description,
      location: '',
      occurred_at,
    };
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}
function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function OrderTrackingPage() {
  const [inputValue, setInputValue] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) { setError('Please enter an order ID.'); return; }

    setLoading(true);
    setError('');
    setOrder(null);
    setEvents([]);
    setSearched(true);

    const [
      { data: orderData },
      { data: bookingData },
      { data: bizBookingData },
      { data: logisticsData },
      { data: bizLogisticsData },
    ] = await Promise.all([
      supabase.from('orders').select('*').eq('order_id', trimmed).maybeSingle(),
      supabase.from('delivery_bookings').select('*').eq('booking_ref', trimmed).maybeSingle(),
      supabase.from('business_delivery_bookings').select('*').eq('booking_ref', trimmed).maybeSingle(),
      supabase.from('logistics_requests').select('*').eq('request_ref', trimmed).maybeSingle(),
      supabase.from('business_logistics_requests').select('*').eq('request_ref', trimmed).maybeSingle(),
    ]);

    if (orderData) {
      const { data: eventsData } = await supabase
        .from('order_tracking_events').select('*')
        .eq('order_id', orderData.id).order('occurred_at', { ascending: true });
      setOrder({ kind: 'legacy', ...orderData });
      setEvents(eventsData ?? []);

    } else if (bookingData) {
      setOrder({
        kind: 'delivery',
        id: bookingData.id,
        order_id: bookingData.booking_ref,
        customer_name: bookingData.recipient_name,
        customer_email: '',
        customer_phone: bookingData.recipient_phone,
        origin: `${bookingData.sender_address}, ${bookingData.pickup_city}`,
        destination: `${bookingData.recipient_address}, ${bookingData.delivery_city}`,
        status: bookingData.status,
        delivery_type: bookingData.delivery_type ?? null,
        package_description: bookingData.package_description
          ? `${bookingData.package_description} (${cap(bookingData.package_type)})`
          : cap(bookingData.package_type),
        weight_kg: bookingData.weight_kg,
        estimated_delivery: null,
        created_at: bookingData.created_at,
        updated_at: bookingData.updated_at,
      });
      setEvents(synthesizeDeliveryHistory(bookingData.status, bookingData.created_at, bookingData.updated_at, bookingData.delivery_type));

    } else if (bizBookingData) {
      setOrder({
        kind: 'delivery',
        id: bizBookingData.id,
        order_id: bizBookingData.booking_ref,
        customer_name: bizBookingData.recipient_name,
        customer_email: '',
        customer_phone: bizBookingData.recipient_phone,
        origin: `${bizBookingData.sender_address}, ${bizBookingData.pickup_city}`,
        destination: `${bizBookingData.recipient_address}, ${bizBookingData.delivery_city}`,
        status: bizBookingData.status,
        delivery_type: bizBookingData.delivery_type ?? null,
        package_description: bizBookingData.package_description
          ? `${bizBookingData.package_description} (${cap(bizBookingData.package_type)})`
          : cap(bizBookingData.package_type),
        weight_kg: bizBookingData.weight_kg,
        estimated_delivery: null,
        created_at: bizBookingData.created_at,
        updated_at: bizBookingData.updated_at,
      });
      setEvents(synthesizeDeliveryHistory(bizBookingData.status, bizBookingData.created_at, bizBookingData.updated_at, bizBookingData.delivery_type));

    } else if (logisticsData) {
      // Fetch agent profile for customer info
      const { data: agentProfile } = await supabase
        .from('agent_profiles')
        .select('full_name, phone, email, company_name')
        .eq('id', logisticsData.agent_id)
        .maybeSingle();

      setOrder({
        kind: 'logistics',
        id: logisticsData.id,
        order_id: logisticsData.request_ref,
        customer_name: agentProfile?.full_name ?? '',
        customer_email: agentProfile?.email ?? '',
        customer_phone: agentProfile?.phone ?? '',
        origin: logisticsData.origin,
        destination: logisticsData.destination,
        status: logisticsData.status,
        service_type: logisticsData.service_type,
        description: logisticsData.description,
        quantity: logisticsData.quantity != null ? String(logisticsData.quantity) : null,
        weight: logisticsData.weight_kg != null ? `${logisticsData.weight_kg} kg` : null,
        budget_range: logisticsData.budget_range,
        estimated_delivery: logisticsData.preferred_date ?? null,
        created_at: logisticsData.created_at,
        updated_at: logisticsData.updated_at,
      });
      setEvents(synthesizeLogisticsHistory(logisticsData.status, logisticsData.created_at, logisticsData.updated_at));

    } else if (bizLogisticsData) {
      // Fetch business profile for customer info
      const { data: bizProfile } = await supabase
        .from('business_profiles')
        .select('company_name, contact_person, phone, email')
        .eq('id', bizLogisticsData.business_id)
        .maybeSingle();

      setOrder({
        kind: 'logistics',
        id: bizLogisticsData.id,
        order_id: bizLogisticsData.request_ref,
        customer_name: bizProfile?.company_name ?? '',
        customer_email: bizProfile?.email ?? '',
        customer_phone: bizProfile?.phone ?? '',
        origin: bizLogisticsData.origin,
        destination: bizLogisticsData.destination,
        status: bizLogisticsData.status,
        service_type: bizLogisticsData.service_type,
        description: bizLogisticsData.description,
        quantity: bizLogisticsData.quantity != null ? String(bizLogisticsData.quantity) : null,
        weight: bizLogisticsData.weight ?? null,
        budget_range: bizLogisticsData.budget_range,
        estimated_delivery: bizLogisticsData.preferred_date ?? null,
        created_at: bizLogisticsData.created_at,
        updated_at: bizLogisticsData.updated_at,
      });
      setEvents(synthesizeLogisticsHistory(bizLogisticsData.status, bizLogisticsData.created_at, bizLogisticsData.updated_at));

    } else {
      setError(`No order found with ID "${trimmed}". Please check and try again.`);
      setLoading(false);
      return;
    }

    setLoading(false);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const currentStatus = order ? STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending : null;
  const isLogistics = order?.kind === 'logistics';
  const steps = isLogistics ? LOGISTICS_STEPS : (order ? getDeliverySteps(order.status, order.delivery_type) : DELIVERY_STEPS);
  const currentStepIndex = order ? steps.indexOf(order.status) : -1;
  const isTerminal = order?.status === 'cancelled' || order?.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-orange-500 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-500 blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Truck className="h-4 w-4" />
            Real-Time Order Tracking
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Track Your<br />
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Shipment</span>
          </h1>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
            Enter your order or request ID below to get real-time status updates.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                placeholder="e.g. BK-123456, BB-123456, LR-123456, BR-123456"
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm text-base transition-all"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          <p className="mt-4 text-gray-500 text-sm">
            Try: <button type="button" onClick={() => setInputValue('ORD-2024001')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer">ORD-2024001</button>,{' '}
            <button type="button" onClick={() => setInputValue('ORD-2024002')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer">ORD-2024002</button>, or{' '}
            <button type="button" onClick={() => setInputValue('ORD-2024003')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer">ORD-2024003</button>
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-4xl mx-auto px-4 py-12" ref={resultsRef}>
        {searched && !loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-1">Order Not Found</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-48" />
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-32" />
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-64" />
          </div>
        )}

        {!loading && order && currentStatus && (
          <div className="space-y-6">
            {/* Status header card */}
            <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${currentStatus.border}`}>
              <div className={`px-6 py-4 ${currentStatus.bg} border-b ${currentStatus.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${currentStatus.bg} border ${currentStatus.border}`}>
                      <currentStatus.icon className={`h-5 w-5 ${currentStatus.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {isLogistics ? 'Request ID' : 'Order ID'}
                      </p>
                      <p className="text-lg font-bold text-gray-900 font-mono">{order.order_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isLogistics && (
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-semibold">
                        Logistics Request
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border ${currentStatus.color} ${currentStatus.bg} ${currentStatus.border}`}>
                      <span className={`w-2 h-2 rounded-full ${
                        order.status === 'delivered' || order.status === 'completed' ? 'bg-green-500' :
                        order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-500' :
                        'bg-orange-500 animate-pulse'
                      }`} />
                      {currentStatus.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 grid sm:grid-cols-2 gap-6">
                {/* Left column: customer info */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isLogistics ? 'Requester Information' : 'Customer Information'}
                  </p>
                  {order.customer_name ? (
                    <div className="flex items-start gap-3">
                      {isLogistics ? <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" /> : <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{isLogistics ? 'Company / Agent' : 'Name'}</p>
                        <p className="text-sm font-semibold text-gray-800">{order.customer_name}</p>
                      </div>
                    </div>
                  ) : null}
                  {order.customer_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Phone</p>
                        <p className="text-sm font-semibold text-gray-800">{order.customer_phone}</p>
                      </div>
                    </div>
                  )}
                  {order.customer_email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm font-semibold text-gray-800">{order.customer_email}</p>
                      </div>
                    </div>
                  )}
                  {!order.customer_name && !order.customer_phone && !order.customer_email && (
                    <p className="text-sm text-gray-400 italic">No contact info available</p>
                  )}
                </div>

                {/* Right column: order/request details */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isLogistics ? 'Request Details' : 'Shipment Details'}
                  </p>

                  {isLogistics ? (
                    <>
                      {order.service_type && (
                        <div className="flex items-start gap-3">
                          <Truck className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Service Type</p>
                            <p className="text-sm font-semibold text-gray-800">{cap(order.service_type)}</p>
                          </div>
                        </div>
                      )}
                      {order.description && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Description</p>
                            <p className="text-sm font-semibold text-gray-800">{order.description}</p>
                          </div>
                        </div>
                      )}
                      {order.quantity && (
                        <div className="flex items-start gap-3">
                          <Layers className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Quantity</p>
                            <p className="text-sm font-semibold text-gray-800">{order.quantity}</p>
                          </div>
                        </div>
                      )}
                      {order.weight && (
                        <div className="flex items-start gap-3">
                          <Weight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Weight</p>
                            <p className="text-sm font-semibold text-gray-800">{order.weight}</p>
                          </div>
                        </div>
                      )}
                      {order.budget_range && (
                        <div className="flex items-start gap-3">
                          <DollarSign className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Budget Range</p>
                            <p className="text-sm font-semibold text-gray-800">{order.budget_range}</p>
                          </div>
                        </div>
                      )}
                      {order.estimated_delivery && order.status !== 'completed' && order.status !== 'rejected' && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Preferred Date</p>
                            <p className="text-sm font-semibold text-gray-800">{formatDateShort(order.estimated_delivery)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {order.package_description && (
                        <div className="flex items-start gap-3">
                          <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Package</p>
                            <p className="text-sm font-semibold text-gray-800">{order.package_description}</p>
                          </div>
                        </div>
                      )}
                      {order.weight_kg != null && (
                        <div className="flex items-start gap-3">
                          <Weight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Weight</p>
                            <p className="text-sm font-semibold text-gray-800">{order.weight_kg} kg</p>
                          </div>
                        </div>
                      )}
                      {order.estimated_delivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Estimated Delivery</p>
                            <p className="text-sm font-semibold text-gray-800">{formatDateShort(order.estimated_delivery)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Route bar */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1">Origin</p>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-800 truncate capitalize">{order.origin}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1">Destination</p>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-800 truncate capitalize">{order.destination}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress steps */}
            {!isTerminal && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-6">
                  {isLogistics ? 'Request Progress' : 'Delivery Progress'}
                </h3>
                <div className="relative">
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 hidden sm:block">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-700"
                      style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' }}
                    />
                  </div>
                  <div className={`grid gap-2 relative z-10 ${isLogistics ? 'grid-cols-3 sm:grid-cols-5' : steps.length <= 6 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-7'}`}>
                    {steps.map((step, idx) => {
                      const cfg = STATUS_CONFIG[step];
                      const done = idx <= currentStepIndex;
                      const active = idx === currentStepIndex;
                      const Icon = cfg.icon;
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 text-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            done
                              ? active
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                                : 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-gray-200 text-gray-300'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <p className={`text-xs font-medium leading-tight ${done ? (active ? 'text-orange-600' : 'text-green-600') : 'text-gray-400'}`}>
                            {cfg.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Terminal state banners */}
            {order.status === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-800">Order Cancelled</p>
                  <p className="text-red-600 text-sm mt-1">This order has been cancelled. Contact support if you need assistance.</p>
                </div>
              </div>
            )}
            {order.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-800">Request Rejected</p>
                  <p className="text-red-600 text-sm mt-1">This logistics request was not approved. Contact support for more information.</p>
                </div>
              </div>
            )}

            {/* Timeline events (legacy orders only) */}
            {events.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-6">Tracking History</h3>
                <div className="space-y-0">
                  {[...events].reverse().map((event, idx) => {
                    const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    const isFirst = idx === 0;
                    return (
                      <div key={event.id} className="flex gap-4 relative">
                        {idx < events.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100" />
                        )}
                        <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border-2 mt-0.5 ${isFirst ? `${cfg.bg} ${cfg.border}` : 'bg-white border-gray-200'}`}>
                          <Icon className={`h-4 w-4 ${isFirst ? cfg.color : 'text-gray-400'}`} />
                        </div>
                        <div className={`flex-1 ${idx === events.length - 1 ? 'pb-0' : 'pb-6'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className={`font-semibold text-sm ${isFirst ? 'text-gray-900' : 'text-gray-700'}`}>{event.title}</p>
                            <p className="text-xs text-gray-400">{formatDate(event.occurred_at)}</p>
                          </div>
                          <p className={`text-sm mt-0.5 ${isFirst ? 'text-gray-600' : 'text-gray-400'}`}>{event.description}</p>
                          {event.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-400">{event.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="bg-slate-900 rounded-2xl p-6 text-center">
              <p className="text-white font-semibold mb-1">Need help with your order?</p>
              <p className="text-gray-400 text-sm mb-4">Our support team is available 24/7 to assist you.</p>
              <a href="/#contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105">
                Contact Support
              </a>
            </div>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck className="h-10 w-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Track Your Package</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              Enter your order or request ID above to see real-time tracking information.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
