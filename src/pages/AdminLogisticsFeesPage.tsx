import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Truck, Warehouse, Zap, BarChart3, Globe, Navigation, Home,
  Save, CheckCircle, RefreshCw, Info, DollarSign, ToggleLeft, ToggleRight,
  FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LogisticsFee {
  id: string;
  service_type: string;
  label: string;
  base_fee: number;
  fee_per_km: number;
  fee_per_kg: number;
  fee_per_unit: number;
  is_quotation_based: boolean;
  notes: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string;
}

interface FeeEdit {
  base_fee: string;
  fee_per_km: string;
  fee_per_kg: string;
  fee_per_unit: string;
  is_quotation_based: boolean;
  notes: string;
  is_active: boolean;
}

const SERVICE_META: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  desc: string;
  showKm: boolean;
  showKg: boolean;
  showUnit: boolean;
  kmLabel: string;
  kgLabel: string;
  unitLabel: string;
}> = {
  freight: {
    icon: Truck,
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    desc: 'Large cargo & bulk shipments',
    showKm: true, showKg: true, showUnit: false,
    kmLabel: 'Fee per km (₦)', kgLabel: 'Fee per kg (₦)', unitLabel: '',
  },
  warehousing: {
    icon: Warehouse,
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200',
    desc: 'Storage & inventory management',
    showKm: false, showKg: false, showUnit: true,
    kmLabel: '', kgLabel: '', unitLabel: 'Fee per day / pallet (₦)',
  },
  express: {
    icon: Zap,
    color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200',
    desc: 'Same-day / next-day delivery',
    showKm: true, showKg: true, showUnit: false,
    kmLabel: 'Fee per km (₦)', kgLabel: 'Fee per kg (₦)', unitLabel: '',
  },
  bulk: {
    icon: BarChart3,
    color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200',
    desc: 'High-volume order fulfilment',
    showKm: true, showKg: true, showUnit: true,
    kmLabel: 'Fee per km (₦)', kgLabel: 'Fee per kg (₦)', unitLabel: 'Fee per unit (₦)',
  },
  customs: {
    icon: Globe,
    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',
    desc: 'Import & export documentation',
    showKm: false, showKg: false, showUnit: false,
    kmLabel: '', kgLabel: '', unitLabel: '',
  },
  last_mile: {
    icon: Navigation,
    color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200',
    desc: 'Final delivery to end customer',
    showKm: true, showKg: false, showUnit: false,
    kmLabel: 'Fee per km (₦)', kgLabel: '', unitLabel: '',
  },
  relocation: {
    icon: Home,
    color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200',
    desc: 'Residential, office & intercity moves',
    showKm: true, showKg: false, showUnit: false,
    kmLabel: 'Fee per km (₦)', kgLabel: '', unitLabel: '',
  },
};

const SERVICE_ORDER = ['freight', 'warehousing', 'express', 'bulk', 'customs', 'last_mile', 'relocation'];

function fmt(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

export default function AdminLogisticsFeesPage() {
  const { user } = useAuth();

  const [rows, setRows] = useState<Record<string, LogisticsFee>>({});
  const [edits, setEdits] = useState<Record<string, FeeEdit>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('logistics_request_fees')
      .select('*');
    if (err) { setError(err.message); setLoading(false); return; }
    const rowMap: Record<string, LogisticsFee> = {};
    const editMap: Record<string, FeeEdit> = {};
    for (const row of data ?? []) {
      rowMap[row.service_type] = row;
      editMap[row.service_type] = {
        base_fee:           String(row.base_fee),
        fee_per_km:         String(row.fee_per_km),
        fee_per_kg:         String(row.fee_per_kg),
        fee_per_unit:       String(row.fee_per_unit),
        is_quotation_based: row.is_quotation_based,
        notes:              row.notes,
        is_active:          row.is_active,
      };
    }
    setRows(rowMap);
    setEdits(editMap);
    setLoading(false);
  };

  const saveRow = async (st: string) => {
    const e = edits[st];
    const baseFee    = parseFloat(e.base_fee);
    const feePerKm   = parseFloat(e.fee_per_km);
    const feePerKg   = parseFloat(e.fee_per_kg);
    const feePerUnit = parseFloat(e.fee_per_unit);
    if ([baseFee, feePerKm, feePerKg, feePerUnit].some(v => isNaN(v) || v < 0)) {
      setError('All fee values must be valid non-negative numbers.');
      return;
    }
    setSaving(st);
    setError('');
    const payload = {
      base_fee:           baseFee,
      fee_per_km:         feePerKm,
      fee_per_kg:         feePerKg,
      fee_per_unit:       feePerUnit,
      is_quotation_based: e.is_quotation_based,
      notes:              e.notes.trim(),
      is_active:          e.is_active,
      updated_at:         new Date().toISOString(),
      updated_by:         user?.email ?? '',
    };
    const existing = rows[st];
    const { error: err } = existing
      ? await supabase.from('logistics_request_fees').update(payload).eq('service_type', st)
      : await supabase.from('logistics_request_fees').insert({ service_type: st, label: SERVICE_META[st]?.desc ?? st, ...payload });
    setSaving(null);
    if (err) { setError(err.message); return; }
    setSaved(st);
    setTimeout(() => setSaved(null), 2500);
    await fetchAll();
  };

  const setEdit = (st: string, patch: Partial<FeeEdit>) => {
    setEdits(prev => ({ ...prev, [st]: { ...prev[st], ...patch } }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Logistics Request Fees</h1>
              <p className="text-xs text-gray-500">Set pricing for each logistics service type</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-semibold">How these fees work</p>
            <p>
              When <strong>Quotation Based</strong> is on, fee fields are used as internal guidance only — the
              customer sees "Custom Quote" and you respond with a specific price after reviewing the request.
              Turn it off to display a calculated starting price publicly.
            </p>
            <p>Formula: <strong>Total = Base Fee + (Distance × Fee/km) + (Weight × Fee/kg) + (Units × Fee/unit)</strong></p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-56 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {SERVICE_ORDER.map(st => {
              const meta = SERVICE_META[st];
              if (!meta) return null;
              const Icon = meta.icon;
              const edit = edits[st] ?? {
                base_fee: '0', fee_per_km: '0', fee_per_kg: '0', fee_per_unit: '0',
                is_quotation_based: true, notes: '', is_active: true,
              };
              const row = rows[st];
              const isSaving = saving === st;
              const isSaved  = saved === st;

              return (
                <div
                  key={st}
                  className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
                    edit.is_active ? meta.border : 'border-gray-200 opacity-60'
                  }`}
                >
                  {/* Card header */}
                  <div className={`px-6 py-4 flex items-center justify-between gap-4 border-b ${edit.is_active ? `${meta.bg} ${meta.border}` : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${edit.is_active ? meta.bg : 'bg-gray-100'} border ${edit.is_active ? meta.border : 'border-gray-200'}`}>
                        <Icon className={`h-5 w-5 ${edit.is_active ? meta.color : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className={`font-bold ${edit.is_active ? meta.color : 'text-gray-400'}`}>
                          {row?.label || st.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500">{meta.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={() => setEdit(st, { is_active: !edit.is_active })}
                        className="flex items-center gap-2 text-sm font-medium transition-colors"
                      >
                        {edit.is_active ? (
                          <><ToggleRight className="h-6 w-6 text-green-500" /><span className="text-green-600 hidden sm:inline">Active</span></>
                        ) : (
                          <><ToggleLeft className="h-6 w-6 text-gray-400" /><span className="text-gray-400 hidden sm:inline">Inactive</span></>
                        )}
                      </button>

                      {/* Quotation badge */}
                      <span className={`hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        edit.is_quotation_based
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {edit.is_quotation_based ? 'Custom Quote' : 'Fixed Rate'}
                      </span>

                      {/* Last updated */}
                      {row?.updated_by && (
                        <p className="text-xs text-gray-400 hidden lg:block">
                          Updated {new Date(row.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6 space-y-5">

                    {/* Quotation toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Quotation Based</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {edit.is_quotation_based
                            ? 'Customer gets "Custom Quote" — you reply with a price manually'
                            : 'Fee fields below are used to calculate and display a starting price'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEdit(st, { is_quotation_based: !edit.is_quotation_based })}
                        className="flex-shrink-0 ml-4"
                      >
                        {edit.is_quotation_based ? (
                          <ToggleRight className="h-8 w-8 text-yellow-500" />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-gray-300" />
                        )}
                      </button>
                    </div>

                    {/* Fee inputs */}
                    <div className={`grid gap-4 ${
                      [meta.showKm, meta.showKg, meta.showUnit].filter(Boolean).length === 0
                        ? 'grid-cols-1'
                        : [meta.showKm, meta.showKg, meta.showUnit].filter(Boolean).length === 1
                          ? 'sm:grid-cols-2'
                          : 'sm:grid-cols-3'
                    }`}>
                      <FeeInput
                        label="Base / Minimum Fee (₦)"
                        hint="Flat starting fee for this service"
                        value={edit.base_fee}
                        step="500"
                        onChange={v => setEdit(st, { base_fee: v })}
                      />
                      {meta.showKm && (
                        <FeeInput
                          label={meta.kmLabel}
                          hint="Per kilometre of road distance"
                          value={edit.fee_per_km}
                          step="10"
                          onChange={v => setEdit(st, { fee_per_km: v })}
                        />
                      )}
                      {meta.showKg && (
                        <FeeInput
                          label={meta.kgLabel}
                          hint="Per kilogram of cargo weight"
                          value={edit.fee_per_kg}
                          step="10"
                          onChange={v => setEdit(st, { fee_per_kg: v })}
                        />
                      )}
                      {meta.showUnit && (
                        <FeeInput
                          label={meta.unitLabel}
                          hint="Per unit / item / pallet / day"
                          value={edit.fee_per_unit}
                          step="100"
                          onChange={v => setEdit(st, { fee_per_unit: v })}
                        />
                      )}
                    </div>

                    {/* Live preview */}
                    {!edit.is_quotation_based && (
                      <PricePreview st={st} edit={edit} meta={meta} />
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        Customer-Facing Notes (optional)
                      </label>
                      <textarea
                        rows={2}
                        value={edit.notes}
                        onChange={e => setEdit(st, { notes: e.target.value })}
                        placeholder="e.g. Contact us for a detailed quotation. Prices may vary by location."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Save */}
                    <div className="flex justify-end">
                      <SaveBtn isSaving={isSaving} isSaved={isSaved} onClick={() => saveRow(st)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PricePreview({ st, edit, meta }: {
  st: string;
  edit: FeeEdit;
  meta: typeof SERVICE_META[string];
}) {
  const base = parseFloat(edit.base_fee) || 0;
  const pkm  = parseFloat(edit.fee_per_km) || 0;
  const pkg  = parseFloat(edit.fee_per_kg) || 0;
  const punit = parseFloat(edit.fee_per_unit) || 0;

  if (st === 'warehousing') {
    return (
      <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-4 gap-3 text-center">
        {[1, 7, 14, 30].map(days => (
          <div key={days}>
            <p className="text-xs text-gray-400 mb-1">{days} day{days > 1 ? 's' : ''}</p>
            <p className="font-bold text-gray-800 text-sm">{fmt(base + days * punit)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (!meta.showKm && !meta.showKg && !meta.showUnit) {
    return (
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-xs text-gray-400 mb-1">Base fee</p>
        <p className="font-bold text-gray-800">{fmt(base)}</p>
      </div>
    );
  }

  const examples = meta.showKm ? [
    { label: '10 km, 5 kg',  total: base + 10 * pkm + 5 * pkg },
    { label: '50 km, 20 kg', total: base + 50 * pkm + 20 * pkg },
    { label: '100 km, 50 kg', total: base + 100 * pkm + 50 * pkg },
  ] : [];

  return examples.length > 0 ? (
    <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-3 text-center">
      {examples.map(ex => (
        <div key={ex.label}>
          <p className="text-xs text-gray-400 mb-1">{ex.label}</p>
          <p className="font-bold text-gray-800 text-sm">{fmt(ex.total)}</p>
        </div>
      ))}
    </div>
  ) : null;
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
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-semibold transition-all"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  );
}

function SaveBtn({ isSaving, isSaved, onClick }: {
  isSaving: boolean; isSaved: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isSaving}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        isSaved
          ? 'bg-green-500 text-white'
          : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white hover:shadow-md hover:shadow-green-500/20'
      }`}
    >
      {isSaving ? (
        <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
      ) : isSaved ? (
        <><CheckCircle className="h-4 w-4" /> Saved!</>
      ) : (
        <><Save className="h-4 w-4" /> Save Changes</>
      )}
    </button>
  );
}
