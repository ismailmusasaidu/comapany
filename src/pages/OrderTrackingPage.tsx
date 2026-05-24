import { useState, useRef } from 'react';
import { Search, Package, MapPin, Clock, CheckCircle, Truck, AlertCircle, XCircle, RefreshCw, ChevronRight, Phone, Mail, User, Weight, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  origin: string;
  destination: string;
  status: string;
  package_description: string;
  weight_kg: number | null;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle },
  picked_up: { label: 'Picked Up', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Package },
  in_transit: { label: 'In Transit', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
};

const STATUS_STEPS = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];

function getStepIndex(status: string) {
  return STATUS_STEPS.indexOf(status);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrderTrackingPage() {
  const [inputValue, setInputValue] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter an order ID.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);
    setEvents([]);
    setSearched(true);

    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', trimmed)
      .maybeSingle();

    if (orderErr) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    if (!orderData) {
      setError(`No order found with ID "${trimmed}". Please check and try again.`);
      setLoading(false);
      return;
    }

    const { data: eventsData } = await supabase
      .from('order_tracking_events')
      .select('*')
      .eq('order_id', orderData.id)
      .order('occurred_at', { ascending: true });

    setOrder(orderData);
    setEvents(eventsData ?? []);
    setLoading(false);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const currentStatus = order ? STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending : null;
  const currentStepIndex = order ? getStepIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

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
            Enter your order ID below to get real-time updates on your package's location and delivery status.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                placeholder="e.g. ORD-2024001"
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

          {/* Sample IDs hint */}
          <p className="mt-4 text-gray-500 text-sm">
            Try: <button type="button" onClick={() => setInputValue('ORD-2024001')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer">ORD-2024001</button>,{' '}
            <button type="button" onClick={() => setInputValue('ORD-2024002')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer">ORD-2024002</button>, or{' '}
            <button type="button" onClick={() => setInputValue('ORD-2024003')} className="text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer">ORD-2024003</button>
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-4xl mx-auto px-4 py-12" ref={resultsRef}>
        {/* Error state */}
        {searched && !loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-1">Order Not Found</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-48" />
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-32" />
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-64" />
          </div>
        )}

        {/* Results */}
        {!loading && order && currentStatus && (
          <div className="space-y-6">
            {/* Status card */}
            <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${currentStatus.border}`}>
              <div className={`px-6 py-4 ${currentStatus.bg} border-b ${currentStatus.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${currentStatus.bg} border ${currentStatus.border}`}>
                      <currentStatus.icon className={`h-5 w-5 ${currentStatus.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Order ID</p>
                      <p className="text-lg font-bold text-gray-900">{order.order_id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border ${currentStatus.color} ${currentStatus.bg} ${currentStatus.border}`}>
                    <span className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`} />
                    {currentStatus.label}
                  </span>
                </div>
              </div>

              <div className="p-6 grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Customer</p>
                      <p className="text-sm font-semibold text-gray-800">{order.customer_name}</p>
                    </div>
                  </div>
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
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Package</p>
                      <p className="text-sm font-semibold text-gray-800">{order.package_description}</p>
                    </div>
                  </div>
                  {order.weight_kg && (
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
                </div>
              </div>

              {/* Route */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1">From</p>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-800 truncate">{order.origin}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium mb-1">To</p>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-800 truncate">{order.destination}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            {!isCancelled && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-6">Delivery Progress</h3>
                <div className="relative">
                  {/* Progress bar */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 hidden sm:block">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-700"
                      style={{
                        width: currentStepIndex >= 0
                          ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 relative z-10">
                    {STATUS_STEPS.map((step, idx) => {
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

            {/* Cancelled banner */}
            {isCancelled && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-800">Order Cancelled</p>
                  <p className="text-red-600 text-sm mt-1">This order has been cancelled. Contact support if you need assistance.</p>
                </div>
              </div>
            )}

            {/* Timeline Events */}
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
                        {/* Line */}
                        {idx < events.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-100" />
                        )}
                        {/* Icon */}
                        <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border-2 mt-0.5 ${
                          isFirst
                            ? `${cfg.bg} ${cfg.border}`
                            : 'bg-white border-gray-200'
                        }`}>
                          <Icon className={`h-4 w-4 ${isFirst ? cfg.color : 'text-gray-400'}`} />
                        </div>
                        {/* Content */}
                        <div className={`flex-1 pb-6 ${idx === events.length - 1 ? 'pb-0' : ''}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className={`font-semibold text-sm ${isFirst ? 'text-gray-900' : 'text-gray-700'}`}>
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(event.occurred_at)}</p>
                          </div>
                          <p className={`text-sm mt-0.5 ${isFirst ? 'text-gray-600' : 'text-gray-400'}`}>
                            {event.description}
                          </p>
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

            {/* Help card */}
            <div className="bg-slate-900 rounded-2xl p-6 text-center">
              <p className="text-white font-semibold mb-1">Need help with your order?</p>
              <p className="text-gray-400 text-sm mb-4">Our support team is available 24/7 to assist you.</p>
              <a
                href="/#contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}

        {/* Empty state - no search yet */}
        {!searched && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck className="h-10 w-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Track Your Package</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              Enter your order ID above to see real-time tracking information for your shipment.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
