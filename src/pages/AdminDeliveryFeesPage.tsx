import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Truck, Globe, Map, Navigation, Save, CheckCircle,
  RefreshCw, Info, Package, Weight, FileText, Tag
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FeeSetting {
  id: string;
  delivery_type: string;
  fee_per_km: number;
  minimum_fee: number;
  weight_fee_per_kg: number;
  updated_at: string;
  updated_by: string;
}

interface PackageCharge {
  id: string;
  package_type: string;
  label: string;
  surcharge: number;
  updated_at: string;
  updated_by: string;
}

const DELIVERY_TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; desc: string;
}> = {
  same_state: {
    label: 'Same State', icon: Navigation,
    color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200',
    desc: 'Pickup and delivery within the same Nigerian state',
  },
  inter_state: {
    label: 'Inter-State', icon: Map,
    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',
    desc: 'Delivery crossing state boundaries within Nigeria',
  },
  international: {
    label: 'International', icon: Globe,
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    desc: 'Cross-border and international shipments',
  },
};

const PACKAGE_TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  document:  { icon: FileText, desc: 'Papers, certificates, letters' },
  parcel:    { icon: Package,  desc: 'Standard packages & boxes' },
  fragile:   { icon: Tag,      desc: 'Glass, electronics, delicates' },
  heavy:     { icon: Weight,   desc: 'Over 25kg, bulk items' },
};

const DELIVERY_ORDER = ['same_state', 'inter_state', 'international'];
const PACKAGE_ORDER  = ['document', 'parcel', 'fragile', 'heavy'];

function fmt(n: number) { return `₦${n.toLocaleString('en-NG')}`; }

export default function AdminDeliveryFeesPage() {
  const { user } = useAuth();

  // Delivery type fee state
  const [feeSettings, setFeeSettings] = useState<Record<string, FeeSetting>>({});
  const [feeEdits, setFeeEdits] = useState<Record<string, { fee_per_km: string; minimum_fee: string; weight_fee_per_kg: string }>>({});
  const [savingFee, setSavingFee] = useState<string | null>(null);
  const [savedFee, setSavedFee] = useState<string | null>(null);

  // Package charge state
  const [pkgCharges, setPkgCharges] = useState<Record<string, PackageCharge>>({});
  const [pkgEdits, setPkgEdits] = useState<Record<string, string>>({});
  const [savingPkg, setSavingPkg] = useState<string | null>(null);
  const [savedPkg, setSavedPkg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: fees }, { data: pkgs }] = await Promise.all([
      supabase.from('delivery_fee_settings').select('*'),
      supabase.from('package_type_charges').select('*'),
    ]);

    const fMap: Record<string, FeeSetting> = {};
    const fEdit: Record<string, { fee_per_km: string; minimum_fee: string; weight_fee_per_kg: string }> = {};
    for (const row of fees ?? []) {
      fMap[row.delivery_type] = row;
      fEdit[row.delivery_type] = {
        fee_per_km: String(row.fee_per_km),
        minimum_fee: String(row.minimum_fee),
        weight_fee_per_kg: String(row.weight_fee_per_kg ?? 0),
      };
    }
    setFeeSettings(fMap);
    setFeeEdits(fEdit);

    const pMap: Record<string, PackageCharge> = {};
    const pEdit: Record<string, string> = {};
    for (const row of pkgs ?? []) {
      pMap[row.package_type] = row;
      pEdit[row.package_type] = String(row.surcharge);
    }
    setPkgCharges(pMap);
    setPkgEdits(pEdit);

    setLoading(false);
  };

  const saveFee = async (dt: string) => {
    const e = feeEdits[dt];
    const feePerKm = parseFloat(e.fee_per_km);
    const minFee = parseFloat(e.minimum_fee);
    const weightFee = parseFloat(e.weight_fee_per_kg);
    if ([feePerKm, minFee, weightFee].some(v => isNaN(v) || v < 0)) {
      setError('All fee values must be valid non-negative numbers.');
      return;
    }
    setSavingFee(dt);
    setError('');
    const payload = {
      fee_per_km: feePerKm,
      minimum_fee: minFee,
      weight_fee_per_kg: weightFee,
      updated_at: new Date().toISOString(),
      updated_by: user?.email ?? '',
    };
    const existing = feeSettings[dt];
    const { error: err } = existing
      ? await supabase.from('delivery_fee_settings').update(payload).eq('delivery_type', dt)
      : await supabase.from('delivery_fee_settings').insert({ delivery_type: dt, ...payload });
    setSavingFee(null);
    if (err) { setError(err.message); return; }
    setSavedFee(dt);
    setTimeout(() => setSavedFee(null), 2500);
    await fetchAll();
  };

  const savePkg = async (pt: string) => {
    const surcharge = parseFloat(pkgEdits[pt]);
    if (isNaN(surcharge) || surcharge < 0) {
      setError('Surcharge must be a valid non-negative number.');
      return;
    }
    setSavingPkg(pt);
    setError('');
    const payload = { surcharge, updated_at: new Date().toISOString(), updated_by: user?.email ?? '' };
    const existing = pkgCharges[pt];
    const label = existing?.label ?? (pt.charAt(0).toUpperCase() + pt.slice(1).replace('_', ' '));
    const { error: err } = existing
      ? await supabase.from('package_type_charges').update(payload).eq('package_type', pt)
      : await supabase.from('package_type_charges').insert({ package_type: pt, label, ...payload });
    setSavingPkg(null);
    if (err) { setError(err.message); return; }
    setSavedPkg(pt);
    setTimeout(() => setSavedPkg(null), 2500);
    await fetchAll();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Delivery Fee Settings</h1>
              <p className="text-xs text-gray-500">Manage rates, package surcharges & weight fees</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* ─── Section 1: Distance-based rates ─── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Distance-Based Rates</h2>
                  <p className="text-xs text-gray-500">Fee per km + minimum charge per delivery type. For Same State, distance is auto-calculated via road routing.</p>
                </div>
              </div>

              <div className="space-y-4">
                {DELIVERY_ORDER.map(dt => {
                  const cfg = DELIVERY_TYPE_CONFIG[dt];
                  const Icon = cfg.icon;
                  const edit = feeEdits[dt] ?? { fee_per_km: '0', minimum_fee: '0', weight_fee_per_kg: '0' };
                  const isSaving = savingFee === dt;
                  const isSaved = savedFee === dt;
                  const fkm = parseFloat(edit.fee_per_km) || 0;
                  const mFee = parseFloat(edit.minimum_fee) || 0;

                  return (
                    <div key={dt} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${cfg.border}`}>
                      <div className={`px-6 py-4 ${cfg.bg} border-b ${cfg.border} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${cfg.color}`} />
                          </div>
                          <div>
                            <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>
                            <p className="text-xs text-gray-500">{cfg.desc}</p>
                          </div>
                        </div>
                        {feeSettings[dt] && (
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400">Last updated</p>
                            <p className="text-xs font-medium text-gray-600">
                              {new Date(feeSettings[dt].updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FeeInput
                            label="Fee per Kilometre (₦)"
                            hint="Charged per km of road distance"
                            value={edit.fee_per_km}
                            step="10"
                            onChange={v => setFeeEdits(p => ({ ...p, [dt]: { ...p[dt], fee_per_km: v } }))}
                          />
                          <FeeInput
                            label="Minimum Fee (₦)"
                            hint="Floor charge regardless of distance"
                            value={edit.minimum_fee}
                            step="100"
                            onChange={v => setFeeEdits(p => ({ ...p, [dt]: { ...p[dt], minimum_fee: v } }))}
                          />
                        </div>

                        {/* Trip preview */}
                        <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-3 text-center">
                          {[10, 50, 100].map(km => (
                            <div key={km}>
                              <p className="text-xs text-gray-400 mb-1">{km} km trip</p>
                              <p className="font-bold text-gray-800 text-sm">{fmt(Math.max(km * fkm, mFee))}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <SaveBtn isSaving={isSaving} isSaved={isSaved} onClick={() => saveFee(dt)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ─── Section 2: Weight-based fee ─── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                  <Weight className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Weight-Based Charge</h2>
                  <p className="text-xs text-gray-500">Set a per-kg rate applied to all bookings that include a weight. Set to 0 for no weight surcharge.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-orange-50 border-b border-orange-200 flex items-center gap-3">
                  <Weight className="h-5 w-5 text-orange-600" />
                  <p className="font-bold text-orange-700">Per-Kilogram Rate — applies to all delivery types</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    {DELIVERY_ORDER.map(dt => {
                      const cfg = DELIVERY_TYPE_CONFIG[dt];
                      const edit = feeEdits[dt] ?? { fee_per_km: '0', minimum_fee: '0', weight_fee_per_kg: '0' };
                      const isSaving = savingFee === `wt-${dt}`;
                      const isSaved = savedFee === `wt-${dt}`;
                      return (
                        <div key={dt} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                          <p className={`text-xs font-bold mb-3 ${cfg.color}`}>{cfg.label}</p>
                          <FeeInput
                            label="₦ per kg"
                            hint="0 = no weight charge"
                            value={edit.weight_fee_per_kg}
                            step="10"
                            onChange={v => setFeeEdits(p => ({ ...p, [dt]: { ...p[dt], weight_fee_per_kg: v } }))}
                          />
                          <div className="mt-3 flex justify-end">
                            <SaveBtn
                              small
                              isSaving={isSaving}
                              isSaved={isSaved}
                              onClick={async () => {
                                const wfee = parseFloat(edit.weight_fee_per_kg);
                                if (isNaN(wfee) || wfee < 0) { setError('Weight fee must be non-negative.'); return; }
                                setSavingFee(`wt-${dt}`);
                                setError('');
                                const { error: err } = await supabase.from('delivery_fee_settings')
                                  .update({ weight_fee_per_kg: wfee, updated_at: new Date().toISOString(), updated_by: user?.email ?? '' })
                                  .eq('delivery_type', dt);
                                setSavingFee(null);
                                if (err) { setError(err.message); return; }
                                setSavedFee(`wt-${dt}`);
                                setTimeout(() => setSavedFee(null), 2500);
                                await fetchAll();
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weight preview */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Fee preview (Same State as example)</p>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      {[1, 5, 10, 25].map(kg => {
                        const rate = parseFloat(feeEdits['same_state']?.weight_fee_per_kg ?? '0') || 0;
                        return (
                          <div key={kg}>
                            <p className="text-xs text-gray-400 mb-1">{kg} kg</p>
                            <p className="font-bold text-gray-800 text-sm">{rate === 0 ? 'Free' : fmt(kg * rate)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Section 3: Package type surcharges ─── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center">
                  <Package className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Package Type Surcharges</h2>
                  <p className="text-xs text-gray-500">Flat additional charge per package type. Set to 0 for no surcharge (free).</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-teal-50 border-b border-teal-200">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-teal-600" />
                    <p className="font-bold text-teal-700">Flat surcharge added on top of delivery fee for each package type</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {PACKAGE_ORDER.map(pt => {
                      const meta = PACKAGE_TYPE_META[pt];
                      const Icon = meta.icon;
                      const charge = pkgCharges[pt];
                      const editVal = pkgEdits[pt] ?? '0';
                      const isSaving = savingPkg === pt;
                      const isSaved = savedPkg === pt;
                      const surcharge = parseFloat(editVal) || 0;

                      return (
                        <div key={pt} className="border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                              <Icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{charge?.label ?? pt}</p>
                              <p className="text-xs text-gray-400">{meta.desc}</p>
                            </div>
                            <div className="ml-auto">
                              {surcharge === 0 ? (
                                <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2.5 py-1 rounded-full font-semibold">Free</span>
                              ) : (
                                <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-full font-semibold">+{fmt(surcharge)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-1.5">Surcharge (₦) — 0 = Free</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₦</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={editVal}
                                  onChange={e => setPkgEdits(p => ({ ...p, [pt]: e.target.value }))}
                                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-semibold transition-all"
                                />
                              </div>
                            </div>
                            <SaveBtn small isSaving={isSaving} isSaved={isSaved} onClick={() => savePkg(pt)} />
                          </div>

                          {charge?.updated_by && (
                            <p className="text-xs text-gray-400 mt-2">
                              Last updated {new Date(charge.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ─── How fees are calculated ─── */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 space-y-1">
                <p className="font-semibold">How the total delivery fee is calculated</p>
                <p><strong>Total = Distance Fee + Weight Fee + Package Surcharge</strong></p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>Distance fee = max(distance_km × fee_per_km, minimum_fee)</li>
                  <li>Weight fee = weight_kg × weight_fee_per_kg (0 if no weight entered)</li>
                  <li>Package surcharge = flat amount set per package type (0 = free)</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FeeInput({ label, hint, value, step = '1', onChange }: {
  label: string; hint: string; value: string; step?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₦</span>
        <input
          type="number" min="0" step={step} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold transition-all"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  );
}

function SaveBtn({ isSaving, isSaved, onClick, small = false }: {
  isSaving: boolean; isSaved: boolean; onClick: () => void; small?: boolean;
}) {
  const base = small
    ? 'flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all'
    : 'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all';
  return (
    <button onClick={onClick} disabled={isSaving}
      className={`${base} ${isSaved ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:shadow-md hover:shadow-orange-500/20'} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {isSaving ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />{!small && ' Saving...'}</>
        : isSaved ? <><CheckCircle className="h-3.5 w-3.5" />{!small && ' Saved!'}</>
        : <><Save className="h-3.5 w-3.5" />{!small && ' Save Changes'}</>}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Save(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}
