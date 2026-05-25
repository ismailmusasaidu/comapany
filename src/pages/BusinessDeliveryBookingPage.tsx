import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Package, MapPin, Phone, User, Weight,
  DollarSign, FileText, CheckCircle, ArrowLeft, ArrowRight, ChevronRight,
  Globe, Map, Navigation, Ruler, RefreshCw, AlertCircle, Tag
} from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';

interface BookingForm {
  delivery_type: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  pickup_city: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_city: string;
  package_type: string;
  package_description: string;
  weight_kg: string;
  declared_value: string;
  special_instructions: string;
}

const EMPTY: BookingForm = {
  delivery_type: '',
  sender_name: '', sender_phone: '', sender_address: '', pickup_city: '',
  recipient_name: '', recipient_phone: '', recipient_address: '', delivery_city: '',
  package_type: 'parcel', package_description: '',
  weight_kg: '', declared_value: '', special_instructions: '',
};

const DELIVERY_TYPES = [
  { value: 'same_state',    label: 'Same State',    desc: 'Pickup and delivery within the same state',   icon: Navigation, color: 'text-green-600',  bg: 'bg-green-50',  activeBorder: 'border-green-500',  activeBg: 'bg-green-50' },
  { value: 'inter_state',   label: 'Inter-State',   desc: 'Delivery across different Nigerian states',   icon: Map,        color: 'text-orange-600', bg: 'bg-orange-50', activeBorder: 'border-orange-500', activeBg: 'bg-orange-50' },
  { value: 'international', label: 'International', desc: 'Cross-border or international delivery',      icon: Globe,      color: 'text-blue-600',   bg: 'bg-blue-50',   activeBorder: 'border-blue-500',   activeBg: 'bg-blue-50' },
];

const PKG_META: Record<string, { icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  document: { icon: FileText, desc: 'Papers, certificates, letters' },
  parcel:   { icon: Package,  desc: 'Standard packages & boxes' },
  fragile:  { icon: Tag,      desc: 'Glass, electronics, delicates' },
  heavy:    { icon: Weight,   desc: 'Over 25kg, bulk items' },
};

const PKG_ORDER = ['document', 'parcel', 'fragile', 'heavy'];

function generateRef() { return `BB-${Date.now().toString().slice(-6)}`; }
function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmt(n: number) { return `₦${Math.round(n).toLocaleString('en-NG')}`; }

interface FeeEstimate { distance_km: number; fee_per_km: number; minimum_fee: number; estimated_fee: number; }
interface PkgCharge   { package_type: string; label: string; surcharge: number; }

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function BusinessDeliveryBookingPage() {
  const { user, profile } = useBusiness();
  const [form, setForm] = useState<BookingForm>(EMPTY);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdRef, setCreatedRef] = useState('');

  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [feeLoading, setFeeLoading]   = useState(false);
  const [feeError, setFeeError]       = useState('');

  const [pkgCharges, setPkgCharges]   = useState<Record<string, PkgCharge>>({});
  const [weightRates, setWeightRates] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const [{ data: pkgs }, { data: wRates }] = await Promise.all([
        supabase.from('package_type_charges').select('package_type, label, surcharge'),
        supabase.from('delivery_fee_settings').select('delivery_type, weight_fee_per_kg'),
      ]);
      const pm: Record<string, PkgCharge> = {};
      for (const p of pkgs ?? []) pm[p.package_type] = p;
      setPkgCharges(pm);
      const wm: Record<string, number> = {};
      for (const w of wRates ?? []) wm[w.delivery_type] = w.weight_fee_per_kg ?? 0;
      setWeightRates(wm);
    };
    load();
  }, []);

  if (!profile || profile.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-bold text-gray-800 text-xl mb-2">Access Restricted</h2>
          <p className="text-gray-500 text-sm mb-6">Your business account must be approved by admin before you can create bookings.</p>
          <Link to="/business/dashboard" className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const set = (key: keyof BookingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  const calculateFee = async (pickupCity: string, deliveryCity: string) => {
    setFeeLoading(true); setFeeError(''); setFeeEstimate(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/calculate-delivery-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ pickup_city: pickupCity, delivery_city: deliveryCity, delivery_type: 'same_state' }),
      });
      const data = await res.json();
      if (!res.ok) setFeeError(data.error ?? 'Could not calculate fee.');
      else setFeeEstimate(data);
    } catch { setFeeError('Network error while calculating fee.'); }
    finally { setFeeLoading(false); }
  };

  const pkgSurcharge  = pkgCharges[form.package_type]?.surcharge ?? 0;
  const wRate         = weightRates[form.delivery_type] ?? 0;
  const weightFee     = wRate > 0 && form.weight_kg ? parseFloat(form.weight_kg) * wRate : 0;
  const distanceFee   = feeEstimate?.estimated_fee ?? 0;
  const totalEstimate = distanceFee + weightFee + pkgSurcharge;
  const hasTotal      = distanceFee > 0 || weightFee > 0 || pkgSurcharge > 0;

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const ref = generateRef();
      const { error: err } = await supabase.from('business_delivery_bookings').insert({
        booking_ref: ref, business_id: user.id,
        delivery_type: form.delivery_type,
        sender_name: form.sender_name, sender_phone: form.sender_phone,
        sender_address: form.sender_address, pickup_city: form.pickup_city,
        recipient_name: form.recipient_name, recipient_phone: form.recipient_phone,
        recipient_address: form.recipient_address, delivery_city: form.delivery_city,
        package_type: form.package_type, package_description: form.package_description,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        declared_value: form.declared_value ? parseFloat(form.declared_value) : null,
        special_instructions: form.special_instructions,
        status: 'pending',
      });
      if (err) throw err;
      setCreatedRef(ref); setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create booking.');
    } finally { setLoading(false); }
  };

  if (success) {
    const dt = DELIVERY_TYPES.find(d => d.value === form.delivery_type);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Created!</h2>
          <p className="text-gray-500 mb-2">Your delivery booking has been submitted successfully.</p>
          {dt && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${dt.bg} ${dt.color}`}>
              <dt.icon className="h-3.5 w-3.5" /> {dt.label} Delivery
            </div>
          )}
          {hasTotal && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-orange-600 font-medium mb-1">Estimated Total Fee</p>
              <p className="text-xl font-bold text-orange-700">{fmt(totalEstimate)}</p>
            </div>
          )}
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-6 py-3 inline-block mb-8">
            <p className="text-xs text-orange-600 font-medium">Booking Reference</p>
            <p className="text-xl font-bold text-orange-700">{createdRef}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSuccess(false); setForm(EMPTY); setStep(1); setFeeEstimate(null); }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              <Package className="h-4 w-4" /> New Booking
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

  const steps = ['Delivery Type', 'Sender Info', 'Recipient Info', 'Package Details', 'Review'];

  const handleNext = () => {
    if (step === 1 && !form.delivery_type) { setError('Please select a delivery type to continue.'); return; }
    if (step === 2 && (!form.sender_name || !form.sender_phone || !form.sender_address || !form.pickup_city)) { setError('Please fill in all sender fields.'); return; }
    if (step === 3 && (!form.recipient_name || !form.recipient_phone || !form.recipient_address || !form.delivery_city)) { setError('Please fill in all recipient fields.'); return; }
    if (step === 4 && !form.package_description) { setError('Please provide a package description.'); return; }
    setError('');
    if (step === 3 && form.delivery_type === 'same_state' && form.pickup_city && form.delivery_city) {
      calculateFee(form.pickup_city, form.delivery_city);
    }
    setStep(s => s + 1);
  };

  const selectedDt = DELIVERY_TYPES.find(d => d.value === form.delivery_type);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/business/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">New Delivery Booking</h1>
            <p className="text-gray-500 text-xs">Step {step} of {steps.length}</p>
          </div>
          {selectedDt && step > 1 && (
            <div className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${selectedDt.bg} ${selectedDt.color}`}>
              <selectedDt.icon className="h-3 w-3" /> {selectedDt.label}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-0">
            {steps.map((label, idx) => {
              const num = idx + 1; const done = num < step; const active = num === step;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                      {done ? <CheckCircle className="h-4 w-4" /> : num}
                    </div>
                    <p className={`text-xs mt-1 font-medium hidden sm:block ${active ? 'text-orange-500' : done ? 'text-green-600' : 'text-gray-400'}`}>{label}</p>
                  </div>
                  {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-50 p-2.5 rounded-xl"><Truck className="h-5 w-5 text-orange-500" /></div>
                <div><h2 className="font-bold text-gray-900">Delivery Type</h2><p className="text-gray-500 text-sm">Where is this shipment going?</p></div>
              </div>
              <div className="grid gap-4">
                {DELIVERY_TYPES.map(dt => {
                  const selected = form.delivery_type === dt.value;
                  return (
                    <button key={dt.value} type="button"
                      onClick={() => { setForm(p => ({ ...p, delivery_type: dt.value })); setError(''); }}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-5 group ${selected ? `${dt.activeBorder} ${dt.activeBg} shadow-sm` : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? dt.bg : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                        <dt.icon className={`h-6 w-6 ${selected ? dt.color : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-base ${selected ? dt.color : 'text-gray-800'}`}>{dt.label}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{dt.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${selected ? `${dt.activeBorder} border-4` : 'border-gray-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-50 p-2.5 rounded-xl"><User className="h-5 w-5 text-orange-500" /></div>
                <div><h2 className="font-bold text-gray-900">Sender Information</h2><p className="text-gray-500 text-sm">Who is sending the package?</p></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Sender Name" icon={User} placeholder="Full name" value={form.sender_name} onChange={set('sender_name')} required />
                <Field label="Sender Phone" icon={Phone} placeholder="+234..." value={form.sender_phone} onChange={set('sender_phone')} required />
              </div>
              <Field label="Pickup City" icon={MapPin} placeholder="City of pickup" value={form.pickup_city} onChange={set('pickup_city')} required />
              <Field label="Pickup Address" icon={MapPin} placeholder="Full pickup address" value={form.sender_address} onChange={set('sender_address')} required />
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-2.5 rounded-xl"><User className="h-5 w-5 text-blue-600" /></div>
                <div><h2 className="font-bold text-gray-900">Recipient Information</h2><p className="text-gray-500 text-sm">Who will receive the package?</p></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Recipient Name" icon={User} placeholder="Full name" value={form.recipient_name} onChange={set('recipient_name')} required />
                <Field label="Recipient Phone" icon={Phone} placeholder="+234..." value={form.recipient_phone} onChange={set('recipient_phone')} required />
              </div>
              <Field label="Delivery City" icon={MapPin} placeholder={form.delivery_type === 'international' ? 'Country / City' : 'City of delivery'} value={form.delivery_city} onChange={set('delivery_city')} required />
              <Field label="Delivery Address" icon={MapPin} placeholder="Full delivery address" value={form.recipient_address} onChange={set('recipient_address')} required />
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-50 p-2.5 rounded-xl"><Package className="h-5 w-5 text-orange-500" /></div>
                <div><h2 className="font-bold text-gray-900">Package Details</h2><p className="text-gray-500 text-sm">Tell us about the shipment</p></div>
              </div>

              {form.delivery_type === 'same_state' && (
                <div className="rounded-xl border-2 border-green-200 bg-green-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-green-200 flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Distance & Fee Estimate</span>
                    {feeLoading && <RefreshCw className="h-3.5 w-3.5 text-green-600 animate-spin ml-auto" />}
                  </div>
                  <div className="p-4">
                    {feeLoading && <p className="text-sm text-green-700 animate-pulse">Calculating road distance between {form.pickup_city} and {form.delivery_city}...</p>}
                    {feeError && !feeLoading && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-red-700">{feeError}</p>
                          <button type="button" onClick={() => calculateFee(form.pickup_city, form.delivery_city)} className="text-xs text-orange-600 underline mt-1">Retry</button>
                        </div>
                      </div>
                    )}
                    {feeEstimate && !feeLoading && (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-xs text-green-600 font-medium mb-1">Road Distance</p><p className="text-xl font-bold text-green-800">{feeEstimate.distance_km} km</p></div>
                        <div><p className="text-xs text-green-600 font-medium mb-1">Rate</p><p className="text-xl font-bold text-green-800">₦{feeEstimate.fee_per_km}/km</p></div>
                        <div className="bg-white rounded-lg p-2 border border-green-200"><p className="text-xs text-green-600 font-medium mb-1">Distance Fee</p><p className="text-xl font-bold text-green-700">{fmt(feeEstimate.estimated_fee)}</p></div>
                      </div>
                    )}
                    {!feeLoading && !feeError && !feeEstimate && (
                      <button type="button" onClick={() => calculateFee(form.pickup_city, form.delivery_city)} className="flex items-center gap-2 text-sm text-green-700 font-semibold hover:text-green-800">
                        <RefreshCw className="h-4 w-4" /> Calculate distance
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Package Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {PKG_ORDER.map(pt => {
                    const meta = PKG_META[pt];
                    const Icon = meta.icon;
                    const charge = pkgCharges[pt];
                    const surcharge = charge?.surcharge ?? 0;
                    const selected = form.package_type === pt;
                    return (
                      <button key={pt} type="button" onClick={() => setForm(p => ({ ...p, package_type: pt }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-white'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-4 w-4 ${selected ? 'text-orange-600' : 'text-gray-500'}`} />
                          <p className={`font-semibold text-sm ${selected ? 'text-orange-700' : 'text-gray-800'}`}>{charge?.label ?? cap(pt)}</p>
                        </div>
                        <p className="text-xs text-gray-500">{meta.desc}</p>
                        <div className={`mt-2 text-xs font-semibold ${surcharge === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {surcharge === 0 ? 'No surcharge' : `+${fmt(surcharge)}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="Package Description" icon={FileText} placeholder="What's inside?" value={form.package_description} onChange={set('package_description')} required />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" min="0" step="0.1" value={form.weight_kg}
                      onChange={e => { setForm(p => ({ ...p, weight_kg: e.target.value })); setError(''); }}
                      placeholder="e.g. 2.5"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                  {wRate > 0 && form.weight_kg && (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      Weight fee: {fmt(parseFloat(form.weight_kg || '0') * wRate)} (₦{wRate}/kg)
                    </p>
                  )}
                </div>
                <Field label="Declared Value (₦)" icon={DollarSign} placeholder="e.g. 15000" value={form.declared_value} onChange={set('declared_value')} type="number" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Instructions (optional)</label>
                <textarea value={form.special_instructions} onChange={set('special_instructions')}
                  placeholder="Handle with care, call before delivery..."
                  rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all resize-none" />
              </div>

              {hasTotal && (
                <div className="bg-gray-900 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Fee Breakdown</p>
                  <div className="space-y-2 text-sm">
                    {distanceFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Distance fee ({feeEstimate!.distance_km} km)</span><span className="text-white font-semibold">{fmt(distanceFee)}</span></div>}
                    {weightFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Weight fee ({form.weight_kg} kg × ₦{wRate})</span><span className="text-white font-semibold">{fmt(weightFee)}</span></div>}
                    {pkgSurcharge > 0 && <div className="flex justify-between"><span className="text-gray-400">Package surcharge ({cap(form.package_type)})</span><span className="text-white font-semibold">{fmt(pkgSurcharge)}</span></div>}
                    <div className="border-t border-gray-700 pt-2 flex justify-between">
                      <span className="text-white font-bold">Estimated Total</span>
                      <span className="text-orange-400 font-bold text-base">{fmt(totalEstimate)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-50 p-2.5 rounded-xl"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div><h2 className="font-bold text-gray-900">Review & Confirm</h2><p className="text-gray-500 text-sm">Double-check before submitting</p></div>
              </div>

              {selectedDt && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${selectedDt.activeBorder} ${selectedDt.activeBg}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedDt.bg}`}>
                    <selectedDt.icon className={`h-5 w-5 ${selectedDt.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium">Delivery Type</p>
                    <p className={`font-bold text-sm ${selectedDt.color}`}>{selectedDt.label}</p>
                  </div>
                  {feeEstimate && form.delivery_type === 'same_state' && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">{feeEstimate.distance_km} km road distance</p>
                      <p className="font-bold text-sm text-green-700">{fmt(feeEstimate.estimated_fee)} distance fee</p>
                    </div>
                  )}
                </div>
              )}

              {[
                { title: 'Sender', items: [['Name', form.sender_name], ['Phone', form.sender_phone], ['City', form.pickup_city], ['Address', form.sender_address]] },
                { title: 'Recipient', items: [['Name', form.recipient_name], ['Phone', form.recipient_phone], ['City', form.delivery_city], ['Address', form.recipient_address]] },
                { title: 'Package', items: [['Type', pkgCharges[form.package_type]?.label ?? cap(form.package_type)], ['Description', form.package_description], ['Weight', form.weight_kg ? `${form.weight_kg} kg` : '—'], ['Value', form.declared_value ? `₦${form.declared_value}` : '—'], ['Instructions', form.special_instructions || '—']] },
              ].map(section => (
                <div key={section.title} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{section.title}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {section.items.map(([label, val]) => (
                      <div key={label} className="flex gap-2">
                        <span className="text-xs text-gray-400 w-24 flex-shrink-0">{label}:</span>
                        <span className="text-xs text-gray-800 font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {hasTotal && (
                <div className="bg-gray-900 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Fee Breakdown</p>
                  <div className="space-y-2 text-sm">
                    {distanceFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Distance fee</span><span className="text-white font-semibold">{fmt(distanceFee)}</span></div>}
                    {weightFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Weight fee</span><span className="text-white font-semibold">{fmt(weightFee)}</span></div>}
                    {pkgSurcharge > 0 && <div className="flex justify-between"><span className="text-gray-400">Package surcharge</span><span className="text-white font-semibold">{fmt(pkgSurcharge)}</span></div>}
                    <div className="border-t border-gray-700 pt-2 flex justify-between">
                      <span className="text-white font-bold">Estimated Total</span>
                      <span className="text-orange-400 font-bold text-base">{fmt(totalEstimate)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={() => { setStep(s => s - 1); setError(''); }}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <Link to="/business/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Link>
            )}
            {step < 5 ? (
              <button type="button" onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-md hover:shadow-orange-500/20">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:from-orange-600 hover:to-red-600 transition-all hover:shadow-md hover:shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><CheckCircle className="h-4 w-4" /> Confirm Booking</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, placeholder, value, onChange, required = false, type = 'text' }: {
  label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all" />
      </div>
    </div>
  );
}
