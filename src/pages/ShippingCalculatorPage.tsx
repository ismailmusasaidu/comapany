import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator, MapPin, Navigation, Map, Globe, Package, FileText,
  Weight, Tag, ArrowRight, RefreshCw, AlertCircle, CheckCircle,
  Truck, Zap, Shield, Clock, ChevronDown, ChevronRight,
  Banknote, TrendingUp, Info, Hash, DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeeEstimate {
  distance_km: number;
  fee_per_km: number;
  minimum_fee: number;
  estimated_fee: number;
  origin_name?: string;
  destination_name?: string;
}

interface PkgCharge { package_type: string; label: string; surcharge: number; }
interface FeeSettings { delivery_type: string; fee_per_km: number; minimum_fee: number; weight_fee_per_kg: number; }

type DeliveryType = 'same_state' | 'inter_state' | 'international';
type PackageType = 'document' | 'parcel' | 'fragile' | 'heavy';

const DELIVERY_TYPES: { value: DeliveryType; label: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }[] = [
  { value: 'same_state',    label: 'Same State',    desc: 'Within one state',         icon: Navigation, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-400' },
  { value: 'inter_state',   label: 'Inter-State',   desc: 'Across Nigerian states',   icon: Map,        color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400' },
  { value: 'international', label: 'International', desc: 'Cross-border delivery',    icon: Globe,      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-400' },
];

const PKG_TYPES: { value: PackageType; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'document', label: 'Document',     desc: 'Papers, letters',          icon: FileText },
  { value: 'parcel',   label: 'Parcel',       desc: 'Standard boxes',           icon: Package  },
  { value: 'fragile',  label: 'Fragile',      desc: 'Glass, electronics',       icon: Tag      },
  { value: 'heavy',    label: 'Heavy Cargo',  desc: 'Over 25 kg, bulk items',   icon: Weight   },
];

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function fmt(n: number) { return `₦${Math.round(n).toLocaleString('en-NG')}`; }

const FEATURES = [
  { icon: Zap,    label: 'Instant results',    desc: 'Real-time road distance' },
  { icon: Shield, label: 'Accurate pricing',   desc: 'Live rate calculation'   },
  { icon: Clock,  label: 'Fast & free',        desc: 'No signup required'      },
];

const TIPS = [
  'Enter city names exactly as known — e.g. "Lagos", "Kano", "Abuja".',
  'Heavier packages may incur a weight surcharge on top of the distance fee.',
  'Fragile and Heavy Cargo packages carry an additional handling surcharge.',
  'International rates use a higher per-km rate reflecting customs handling.',
];

export default function ShippingCalculatorPage() {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('same_state');
  const [pickupCity, setPickupCity]     = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [packageType, setPackageType]   = useState<PackageType>('parcel');
  const [weightKg, setWeightKg]         = useState('');
  const [quantity, setQuantity]         = useState('1');
  const [declaredValue, setDeclaredValue] = useState('');
  const [faqOpen, setFaqOpen]           = useState<number | null>(null);

  const [estimate, setEstimate]   = useState<FeeEstimate | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError]   = useState('');
  const [pkgCharges, setPkgCharges] = useState<Record<PackageType, PkgCharge>>({} as Record<PackageType, PkgCharge>);
  const [feeSettings, setFeeSettings] = useState<Record<DeliveryType, FeeSettings>>({} as Record<DeliveryType, FeeSettings>);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: pkgs }, { data: fees }] = await Promise.all([
        supabase.from('package_type_charges').select('package_type, label, surcharge'),
        supabase.from('delivery_fee_settings').select('delivery_type, fee_per_km, minimum_fee, weight_fee_per_kg'),
      ]);
      const pm = {} as Record<PackageType, PkgCharge>;
      for (const p of pkgs ?? []) pm[p.package_type as PackageType] = p;
      setPkgCharges(pm);
      const fm = {} as Record<DeliveryType, FeeSettings>;
      for (const f of fees ?? []) fm[f.delivery_type as DeliveryType] = f;
      setFeeSettings(fm);
    };
    load();
  }, []);

  const surcharge    = pkgCharges[packageType]?.surcharge ?? 0;
  const settings     = feeSettings[deliveryType];
  const wRate        = settings?.weight_fee_per_kg ?? 0;
  const weightFee    = wRate > 0 && weightKg ? parseFloat(weightKg) * wRate : 0;
  const distFee      = estimate?.estimated_fee ?? 0;
  const qty          = quantity && parseInt(quantity) > 0 ? parseInt(quantity) : 1;
  const unitTotal    = distFee + weightFee + surcharge;
  const total        = unitTotal * qty;
  const declaredNum  = declaredValue ? parseFloat(declaredValue) : 0;
  const hasResult    = estimate !== null;

  const calculate = async () => {
    if (!pickupCity.trim() || !deliveryCity.trim()) {
      setCalcError('Please enter both pickup and delivery cities.');
      return;
    }
    setCalculating(true); setCalcError(''); setEstimate(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/calculate-delivery-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ pickup_city: pickupCity.trim(), delivery_city: deliveryCity.trim(), delivery_type: deliveryType }),
      });
      const data = await res.json();
      if (!res.ok) { setCalcError(data.error ?? 'Could not calculate. Please try different city names.'); }
      else {
        setEstimate(data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } catch {
      setCalcError('Network error. Please check your connection and try again.');
    } finally { setCalculating(false); }
  };

  const reset = () => {
    setEstimate(null); setCalcError('');
    setPickupCity(''); setDeliveryCity(''); setWeightKg('');
    setQuantity('1'); setDeclaredValue('');
    setDeliveryType('same_state'); setPackageType('parcel');
  };

  const selectedDt = DELIVERY_TYPES.find(d => d.value === deliveryType)!;

  const FAQS = [
    { q: 'How is the shipping price calculated?',       a: 'We calculate the actual road distance between the two cities using OpenStreetMap routing. The fee is then: (distance × rate per km) + weight surcharge + package handling charge, with a minimum fee applied.' },
    { q: 'Are these prices final?',                     a: 'These are estimates. Final pricing may vary slightly based on exact pickup/delivery addresses, fuel surcharges, and any special handling requirements confirmed at booking.' },
    { q: 'What is the minimum charge?',                 a: `Same-State: ${settings ? fmt(settings.minimum_fee) : '₦1,500'} minimum. Inter-State and International deliveries have higher minimums reflecting the extended routes.` },
    { q: 'Do you deliver internationally?',             a: 'Yes. Select "International" and enter your destination city. International rates include customs documentation handling.' },
    { q: 'How do I book after getting a price?',        a: 'Click "Book This Delivery" on the results card, or use the Agent / Business portal to create a full booking with pickup scheduling.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero Banner ── */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 pt-10 pb-14 px-4">

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <Calculator className="h-3.5 w-3.5" />
            Free Shipping Calculator
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
            Calculate Shipping{' '}
            <span className="text-orange-400">Price Instantly</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Get an accurate delivery quote in seconds — no signup needed.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-3 w-3 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-xs font-semibold leading-none">{f.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5 hidden sm:block">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calculator Card ── */}
      <section className="max-w-4xl mx-auto px-4 mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden">

          {/* Card header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 sm:px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-white text-base sm:text-lg leading-tight">Shipping Quote Calculator</h2>
              <p className="text-orange-100 text-xs hidden sm:block">Fill in the details below for an instant estimate</p>
            </div>
            {hasResult && (
              <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                <RefreshCw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New Quote</span>
              </button>
            )}
          </div>

          <div className="p-4 sm:p-6 md:p-8 space-y-7">

            {/* Step 1: Delivery Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-black">1</span>
                Delivery Type
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {DELIVERY_TYPES.map(dt => {
                  const active = deliveryType === dt.value;
                  return (
                    <button key={dt.value} type="button"
                      onClick={() => { setDeliveryType(dt.value); setEstimate(null); setCalcError(''); }}
                      className={`flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 p-3 sm:p-4 rounded-2xl border-2 text-center sm:text-left transition-all duration-200 group ${active ? `${dt.border} ${dt.bg} shadow-sm` : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? dt.bg : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                        <dt.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${active ? dt.color : 'text-gray-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-xs sm:text-sm leading-tight ${active ? dt.color : 'text-gray-800'}`}>{dt.label}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">{dt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Route */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-black">2</span>
                Route
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Pickup City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                    <input
                      type="text"
                      value={pickupCity}
                      onChange={e => { setPickupCity(e.target.value); setEstimate(null); setCalcError(''); }}
                      placeholder={deliveryType === 'international' ? 'e.g. Lagos' : 'e.g. Lagos, Kano'}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors placeholder:text-gray-300 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Delivery City</label>
                  <div className="relative">
                    <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={e => { setDeliveryCity(e.target.value); setEstimate(null); setCalcError(''); }}
                      placeholder={deliveryType === 'international' ? 'e.g. Accra, Ghana' : 'e.g. Abuja, Ibadan'}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-colors placeholder:text-gray-300 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Route visualiser */}
              {(pickupCity || deliveryCity) && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[80px] sm:max-w-[140px]">{pickupCity || '—'}</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-300 to-blue-300 rounded-full min-w-[12px]" />
                  <Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-300 to-blue-300 rounded-full min-w-[12px]" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[80px] sm:max-w-[140px]">{deliveryCity || '—'}</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Package */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-black">3</span>
                Package Details
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                {PKG_TYPES.map(pt => {
                  const active = packageType === pt.value;
                  const charge = pkgCharges[pt.value];
                  const s = charge?.surcharge ?? 0;
                  return (
                    <button key={pt.value} type="button"
                      onClick={() => setPackageType(pt.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${active ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <pt.icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                        <p className={`font-bold text-xs leading-tight ${active ? 'text-orange-700' : 'text-gray-700'}`}>{charge?.label ?? pt.label}</p>
                      </div>
                      <p className="text-xs text-gray-400 mb-1.5 leading-tight">{pt.desc}</p>
                      <p className={`text-xs font-bold ${s === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {s === 0 ? 'No surcharge' : `+${fmt(s)}`}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Weight (kg) — optional</label>
                  <div className="relative">
                    <Weight className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number" min="0" step="0.1"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors placeholder:text-gray-300 font-medium"
                    />
                  </div>
                  {wRate > 0 && weightKg && (
                    <p className="text-xs text-orange-500 font-semibold mt-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Weight adds {fmt(parseFloat(weightKg) * wRate)} (₦{wRate}/kg)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Quantity (items)</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number" min="1" step="1"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors placeholder:text-gray-300 font-medium"
                    />
                  </div>
                  {qty > 1 && (
                    <p className="text-xs text-orange-500 font-semibold mt-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {qty} items × unit cost = total shown in results
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Declared Value (₦) — optional</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number" min="0" step="100"
                      value={declaredValue}
                      onChange={e => setDeclaredValue(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-colors placeholder:text-gray-300 font-medium"
                    />
                  </div>
                  {declaredNum > 0 && (
                    <p className="text-xs text-blue-500 font-semibold mt-1.5 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Declared at {fmt(declaredNum)} — used for insurance reference
                    </p>
                  )}
                </div>

                {/* Rate info card */}
                {settings && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="font-semibold text-gray-700">{selectedDt.label}</span> rate</p>
                      <p>₦{settings.fee_per_km} per km</p>
                      <p>Min. charge: {fmt(settings.minimum_fee)}</p>
                      {settings.weight_fee_per_kg > 0 && <p>+₦{settings.weight_fee_per_kg}/kg weight</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {calcError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{calcError}</p>
              </div>
            )}

            {/* Calculate button */}
            <button
              type="button"
              onClick={calculate}
              disabled={calculating}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-2xl font-black text-base transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {calculating ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating route distance…
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5" />
                  Calculate Shipping Price
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      {hasResult && (
        <section ref={resultsRef} className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">

            {/* Results header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 sm:px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-white text-sm sm:text-base">Your Shipping Estimate</h3>
                {estimate.origin_name && estimate.destination_name && (
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{estimate.origin_name} → {estimate.destination_name}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${selectedDt.bg} ${selectedDt.color}`}>
                  <selectedDt.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{selectedDt.label}</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-5">

                {/* Left: breakdown */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Fee Breakdown</h4>

                  {/* Distance row */}
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-green-50 rounded-2xl border border-green-100">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Map className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Road Distance</p>
                      <p className="font-black text-gray-900 text-base sm:text-lg">{estimate.distance_km} km</p>
                      <p className="text-xs text-green-600 font-semibold">₦{estimate.fee_per_km}/km rate</p>
                    </div>
                    <p className="font-black text-gray-900 text-sm sm:text-base flex-shrink-0">{fmt(estimate.estimated_fee)}</p>
                  </div>

                  {/* Weight row */}
                  {weightFee > 0 && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Weight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Weight Charge</p>
                        <p className="font-bold text-gray-800 text-sm">{weightKg} kg × ₦{wRate}/kg</p>
                      </div>
                      <p className="font-black text-gray-900 text-sm sm:text-base flex-shrink-0">{fmt(weightFee)}</p>
                    </div>
                  )}

                  {/* Package surcharge */}
                  {surcharge > 0 && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Package Surcharge</p>
                        <p className="font-bold text-gray-800 text-sm truncate">{pkgCharges[packageType]?.label ?? packageType} handling</p>
                      </div>
                      <p className="font-black text-gray-900 text-sm sm:text-base flex-shrink-0">{fmt(surcharge)}</p>
                    </div>
                  )}

                  {/* Quantity row */}
                  {qty > 1 && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Quantity Multiplier</p>
                        <p className="font-bold text-gray-800 text-sm">{qty} items × {fmt(unitTotal)}</p>
                      </div>
                      <p className="font-black text-gray-900 text-sm sm:text-base flex-shrink-0">{fmt(total)}</p>
                    </div>
                  )}

                  {/* Declared value row */}
                  {declaredNum > 0 && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Declared Value</p>
                        <p className="font-bold text-gray-800 text-sm">Insurance / customs</p>
                      </div>
                      <p className="font-black text-blue-700 text-sm sm:text-base flex-shrink-0">{fmt(declaredNum)}</p>
                    </div>
                  )}

                  {/* Min fee note */}
                  {estimate.estimated_fee === estimate.minimum_fee && (
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
                      <Info className="h-3.5 w-3.5 flex-shrink-0" />
                      Minimum fee applied (route is under minimum threshold)
                    </p>
                  )}
                </div>

                {/* Right: total */}
                <div className="flex flex-col">
                  <div className="flex-1 bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Estimated Total</p>
                    <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 leading-none break-all">{fmt(total)}</p>
                    <p className="text-orange-400 text-sm font-semibold mb-4">
                      {distFee > 0 && `${estimate.distance_km} km`}
                      {(weightFee > 0 || surcharge > 0) && ' + extras'}
                    </p>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      This is an estimate. Final price confirmed at booking based on exact addresses.
                    </p>

                    <div className="w-full space-y-2.5">
                      <Link
                        to="/agent/booking/new"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-orange-500/30"
                      >
                        <Truck className="h-4 w-4" /> Book This Delivery
                      </Link>
                      <button
                        onClick={reset}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold text-sm transition-all"
                      >
                        <RefreshCw className="h-4 w-4" /> New Calculation
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary strip */}
              <div className="mt-6 flex flex-wrap gap-3 items-start p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Banknote className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 flex-1 leading-relaxed">
                  <strong className="text-gray-700">{selectedDt.label} delivery</strong> from{' '}
                  <strong className="text-gray-700">{pickupCity}</strong> to{' '}
                  <strong className="text-gray-700">{deliveryCity}</strong>
                  {qty > 1 && <> · <strong className="text-gray-700">{qty} items</strong></>}
                  {declaredNum > 0 && <> · declared value <strong className="text-gray-700">{fmt(declaredNum)}</strong></>}
                  {' '}— estimated <strong className="text-orange-600">{fmt(total)}</strong>.
                  {' '}Road distance: {estimate.distance_km} km.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="max-w-4xl mx-auto px-4 mt-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">Get your shipping quote in three simple steps</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '01', icon: MapPin, title: 'Enter Route', desc: 'Type your pickup and delivery cities. We support all Nigerian cities and international destinations.', color: 'bg-orange-50 text-orange-500' },
            { step: '02', icon: Package, title: 'Add Package', desc: 'Select your package type and optional weight to get a complete all-in estimate including surcharges.', color: 'bg-green-50 text-green-600' },
            { step: '03', icon: Calculator, title: 'Get Instant Quote', desc: 'We calculate the real road distance via OpenStreetMap and apply live pricing rates to give you an accurate quote.', color: 'bg-blue-50 text-blue-600' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:shadow-black/5 transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-4xl font-black text-gray-100 group-hover:text-gray-200 transition-colors leading-none">{item.step}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rate cards ── */}
      {Object.keys(feeSettings).length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">Delivery Rate Guide</h2>
            <p className="text-gray-500 text-sm">Base rates used in calculations — subject to change</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {DELIVERY_TYPES.map(dt => {
              const s = feeSettings[dt.value];
              if (!s) return null;
              return (
                <div key={dt.value} className={`bg-white rounded-2xl border-2 ${dt.border} p-6 hover:shadow-lg hover:shadow-black/5 transition-all`}>
                  <div className={`w-12 h-12 ${dt.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <dt.icon className={`h-6 w-6 ${dt.color}`} />
                  </div>
                  <h3 className="font-black text-gray-900 mb-4">{dt.label}</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-medium">Rate per km</span>
                      <span className="text-sm font-black text-gray-900">₦{s.fee_per_km}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-medium">Minimum fee</span>
                      <span className="text-sm font-black text-gray-900">{fmt(s.minimum_fee)}</span>
                    </div>
                    {s.weight_fee_per_kg > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">Weight rate</span>
                        <span className="text-sm font-black text-gray-900">₦{s.weight_fee_per_kg}/kg</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setDeliveryType(dt.value); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`mt-5 w-full flex items-center justify-center gap-2 ${dt.bg} ${dt.color} py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 border ${dt.border}`}
                  >
                    Calculate {dt.label} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tips ── */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="font-black text-white text-lg">Shipping Tips</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-orange-400" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-4xl mx-auto px-4 mt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
              <button
                type="button"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-bold text-gray-800 text-sm pr-4">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${faqOpen === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${faqOpen === i ? 'max-h-48' : 'max-h-0'}`}>
                <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-4 mt-12 mb-20">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 md:p-10 text-center">
          <div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">Ready to Ship?</h3>
            <p className="text-orange-100 text-sm sm:text-base max-w-lg mx-auto mb-8">
              Book your delivery now and let our agents handle the rest. Same-day pickup available in major cities.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/agent/booking/new"
                className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-black text-sm transition-all hover:shadow-lg">
                <Truck className="h-4 w-4" /> Book via Agent Portal
              </Link>
              <Link to="/business/booking/new"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm border border-white/30 transition-all">
                <Package className="h-4 w-4" /> Business Booking
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
