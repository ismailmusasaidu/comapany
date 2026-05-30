import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, MapPin, FileText, CheckCircle, ArrowLeft, ArrowRight,
  Package, Warehouse, Zap, BarChart3, Globe, Navigation, Weight, Calendar, Home
} from 'lucide-react';
import { useIndividual } from '../contexts/IndividualContext';
import { supabase } from '../lib/supabase';
import { VehicleSelectionStep, VEHICLES_LIST } from './IndividualDeliveryBookingPage';

interface RequestForm {
  service_type: string;
  vehicle_type: string;
  title: string;
  description: string;
  origin: string;
  destination: string;
  quantity: string;
  weight_kg: string;
  preferred_date: string;
  budget_range: string;
}

const EMPTY: RequestForm = {
  service_type: 'freight', vehicle_type: '', title: '', description: '',
  origin: '', destination: '', quantity: '',
  weight_kg: '', preferred_date: '', budget_range: '',
};

const SERVICES = [
  { value: 'freight', label: 'Freight Shipping', desc: 'Large cargo & bulk shipments', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'warehousing', label: 'Warehousing', desc: 'Storage & inventory management', icon: Warehouse, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'express', label: 'Express Delivery', desc: 'Same/next-day delivery', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { value: 'bulk', label: 'Bulk Transport', desc: 'High-volume order fulfillment', icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'customs', label: 'Customs Clearance', desc: 'Import & export documentation', icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'last_mile', label: 'Last Mile Delivery', desc: 'Final delivery to end customer', icon: Navigation, color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'relocation', label: 'Relocation Services', desc: 'Residential, office & intercity moves — packing, loading, transport, unloading & setup', icon: Home, color: 'text-teal-600', bg: 'bg-teal-50' },
];

const BUDGET_RANGES = ['Under ₦50,000', '₦50,000 – ₦150,000', '₦150,000 – ₦500,000', '₦500,000 – ₦1,000,000', 'Above ₦1,000,000', 'To be discussed'];

function generateRef() {
  return `LR-${Date.now().toString().slice(-6)}`;
}

export default function IndividualLogisticsPage() {
  const { user } = useIndividual();
  const [form, setForm] = useState<RequestForm>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdRef, setCreatedRef] = useState('');

  const set = (key: keyof RequestForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.description || !form.origin || !form.destination) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ref = generateRef();
      const { error: err } = await supabase.from('logistics_requests').insert({
        request_ref: ref,
        individual_id: user.id,
        service_type: form.service_type,
        vehicle_type: form.vehicle_type || null,
        title: form.title,
        description: form.description,
        origin: form.origin,
        destination: form.destination,
        quantity: form.quantity ? parseInt(form.quantity) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        preferred_date: form.preferred_date || null,
        budget_range: form.budget_range,
        status: 'pending',
      });
      if (err) throw err;
      setCreatedRef(ref);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 mb-2">Our logistics team will review your request and get in touch.</p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-3 inline-block mb-8">
            <p className="text-xs text-blue-600 font-medium">Request Reference</p>
            <p className="text-xl font-bold text-blue-700">{createdRef}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSuccess(false); setForm(EMPTY); }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Truck className="h-4 w-4" /> New Request
            </button>
            <Link
              to="/individual/dashboard"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedService = SERVICES.find(s => s.value === form.service_type);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/individual/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Request Logistics Service</h1>
            <p className="text-gray-500 text-xs">Submit a service request to our logistics team</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Service Type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Select Service Type</h2>
            <p className="text-gray-500 text-sm mb-5">Choose the logistics service you need</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map(svc => {
                const Icon = svc.icon;
                const active = form.service_type === svc.value;
                return (
                  <button
                    key={svc.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, service_type: svc.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 ${active ? 'bg-orange-100' : svc.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <Icon className={`h-5 w-5 ${active ? 'text-orange-600' : svc.color}`} />
                    </div>
                    <p className={`font-semibold text-sm ${active ? 'text-orange-700' : 'text-gray-800'}`}>{svc.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{svc.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <VehicleSelectionStep
              selected={form.vehicle_type}
              onSelect={v => setForm(p => ({ ...p, vehicle_type: p.vehicle_type === v ? '' : v }))}
            />
            {form.vehicle_type && (
              <p className="text-xs text-center text-gray-400 mt-4">
                Selected: <span className="text-orange-600 font-semibold">{VEHICLES_LIST.find(v => v.value === form.vehicle_type)?.label}</span> —
                <button type="button" onClick={() => setForm(p => ({ ...p, vehicle_type: '' }))} className="text-gray-400 underline ml-1 hover:text-gray-600">clear</button>
              </p>
            )}
            {!form.vehicle_type && (
              <p className="text-xs text-center text-gray-400 mt-3">(Optional — select if you have a vehicle preference)</p>
            )}
          </div>

          {/* Request Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              {selectedService && (
                <div className={`p-2.5 rounded-xl ${selectedService.bg}`}>
                  <selectedService.icon className={`h-5 w-5 ${selectedService.color}`} />
                </div>
              )}
              <div>
                <h2 className="font-bold text-gray-900">Request Details</h2>
                <p className="text-gray-500 text-sm">Describe what you need</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Request Title <span className="text-red-400">*</span></label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={set('title')}
                  placeholder="e.g. Monthly Bulk Shipment to Abuja"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea
                required
                value={form.description}
                onChange={set('description')}
                placeholder="Describe your logistics needs in detail..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Origin / Pickup Location <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.origin}
                    onChange={set('origin')}
                    placeholder="City or full address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination <span className="text-red-400">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.destination}
                    onChange={set('destination')}
                    placeholder="City or full address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-bold text-gray-900 mb-2">Additional Information</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity (units)</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={set('quantity')}
                    placeholder="e.g. 500"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Weight (kg)</label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={form.weight_kg}
                    onChange={set('weight_kg')}
                    placeholder="e.g. 250"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.preferred_date}
                    onChange={set('preferred_date')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUDGET_RANGES.map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, budget_range: range }))}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      form.budget_range === range
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Link
              to="/individual/dashboard"
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Submit Request</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
