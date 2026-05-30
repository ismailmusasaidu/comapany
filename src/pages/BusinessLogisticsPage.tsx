import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Package, MapPin, Calendar, DollarSign, FileText,
  CheckCircle, ArrowLeft, ArrowRight, Weight
} from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';
import { VehicleSelectionStep, VEHICLES_LIST } from './IndividualDeliveryBookingPage';

interface RequestForm {
  title: string;
  service_type: string;
  vehicle_type: string;
  description: string;
  origin: string;
  destination: string;
  quantity: string;
  weight: string;
  preferred_date: string;
  budget_range: string;
}

const EMPTY: RequestForm = {
  title: '', service_type: 'freight', vehicle_type: '', description: '',
  origin: '', destination: '', quantity: '', weight: '',
  preferred_date: '', budget_range: '',
};

const SERVICE_TYPES = [
  { value: 'freight', label: 'Freight Transport', desc: 'Long-distance cargo movement', icon: '🚚' },
  { value: 'warehousing', label: 'Warehousing', desc: 'Storage & inventory management', icon: '🏭' },
  { value: 'express', label: 'Express Delivery', desc: 'Same/next day urgent delivery', icon: '⚡' },
  { value: 'bulk', label: 'Bulk Cargo', desc: 'Large volume shipments', icon: '📦' },
  { value: 'customs', label: 'Customs Clearance', desc: 'Import/export documentation', icon: '🛃' },
  { value: 'last_mile', label: 'Last-Mile Delivery', desc: 'Final destination delivery', icon: '📍' },
];

const BUDGET_RANGES = [
  '< ₦100,000', '₦100,000 – ₦500,000', '₦500,000 – ₦1M',
  '₦1M – ₦5M', '₦5M – ₦10M', '> ₦10M',
];

function generateRef() {
  return `BR-${Date.now().toString().slice(-6)}`;
}

export default function BusinessLogisticsPage() {
  const { user, profile } = useBusiness();
  const [form, setForm] = useState<RequestForm>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdRef, setCreatedRef] = useState('');

  if (!profile || profile.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-bold text-gray-800 text-xl mb-2">Access Restricted</h2>
          <p className="text-gray-500 text-sm mb-6">Your business account must be approved before you can submit logistics requests.</p>
          <Link to="/business/dashboard" className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
      const { error: err } = await supabase.from('business_logistics_requests').insert({
        request_ref: ref,
        business_id: user.id,
        title: form.title,
        service_type: form.service_type,
        vehicle_type: form.vehicle_type || null,
        description: form.description,
        origin: form.origin,
        destination: form.destination,
        quantity: form.quantity,
        weight: form.weight,
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
          <p className="text-gray-500 mb-2">Your logistics request has been submitted. Our team will review and respond shortly.</p>
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-6 py-3 inline-block mb-8">
            <p className="text-xs text-orange-600 font-medium">Request Reference</p>
            <p className="text-xl font-bold text-orange-700">{createdRef}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSuccess(false); setForm(EMPTY); }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              <Truck className="h-4 w-4" /> New Request
            </button>
            <Link to="/business/dashboard"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all">
              Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/business/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Request Logistics Service</h1>
            <p className="text-gray-500 text-xs">Submit a new enterprise logistics request</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Service Type</h2>
            <p className="text-gray-400 text-sm mb-5">Select the logistics service you need</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_TYPES.map(st => (
                <button key={st.value} type="button" onClick={() => setForm(p => ({ ...p, service_type: st.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.service_type === st.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}>
                  <p className="text-xl mb-1.5">{st.icon}</p>
                  <p className={`font-semibold text-sm ${form.service_type === st.value ? 'text-orange-700' : 'text-gray-800'}`}>{st.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{st.desc}</p>
                </button>
              ))}
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Request Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Request Title *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" required value={form.title} onChange={set('title')}
                    placeholder="e.g. Monthly product distribution — Lagos to Kano"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea required value={form.description} onChange={set('description')}
                  placeholder="Describe your logistics needs in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Origin Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" required value={form.origin} onChange={set('origin')}
                      placeholder="City or address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" required value={form.destination} onChange={set('destination')}
                      placeholder="City or address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity / Units</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={form.quantity} onChange={set('quantity')}
                      placeholder="e.g. 500 cartons"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Weight</label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={form.weight} onChange={set('weight')}
                      placeholder="e.g. 2 tonnes"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={form.preferred_date} onChange={set('preferred_date')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <DollarSign className="inline h-4 w-4 text-gray-400 mr-1" />
                  Budget Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_RANGES.map(b => (
                    <button key={b} type="button" onClick={() => setForm(p => ({ ...p, budget_range: b }))}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.budget_range === b
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                      }`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Link to="/business/dashboard"
              className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-md hover:shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
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
