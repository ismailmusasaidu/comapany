import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Globe, Map, Navigation, Save, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FeeSetting {
  id: string;
  delivery_type: string;
  fee_per_km: number;
  minimum_fee: number;
  updated_at: string;
  updated_by: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string; desc: string }> = {
  same_state: {
    label: 'Same State',
    icon: Navigation,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    desc: 'Pickup and delivery within the same Nigerian state',
  },
  inter_state: {
    label: 'Inter-State',
    icon: Map,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    desc: 'Delivery crossing state boundaries within Nigeria',
  },
  international: {
    label: 'International',
    icon: Globe,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    desc: 'Cross-border and international shipments',
  },
};

const ORDER = ['same_state', 'inter_state', 'international'];

function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

export default function AdminDeliveryFeesPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, FeeSetting>>({});
  const [edits, setEdits] = useState<Record<string, { fee_per_km: string; minimum_fee: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('delivery_fee_settings').select('*');
    if (err) { setError('Failed to load fee settings.'); setLoading(false); return; }
    const map: Record<string, FeeSetting> = {};
    const editMap: Record<string, { fee_per_km: string; minimum_fee: string }> = {};
    for (const row of data ?? []) {
      map[row.delivery_type] = row;
      editMap[row.delivery_type] = {
        fee_per_km: String(row.fee_per_km),
        minimum_fee: String(row.minimum_fee),
      };
    }
    setSettings(map);
    setEdits(editMap);
    setLoading(false);
  };

  const handleSave = async (deliveryType: string) => {
    const e = edits[deliveryType];
    const feePerKm = parseFloat(e.fee_per_km);
    const minimumFee = parseFloat(e.minimum_fee);

    if (isNaN(feePerKm) || feePerKm < 0) {
      setError('Fee per km must be a valid positive number.');
      return;
    }
    if (isNaN(minimumFee) || minimumFee < 0) {
      setError('Minimum fee must be a valid positive number.');
      return;
    }

    setSaving(deliveryType);
    setError('');

    const existing = settings[deliveryType];
    let err;

    if (existing) {
      ({ error: err } = await supabase
        .from('delivery_fee_settings')
        .update({ fee_per_km: feePerKm, minimum_fee: minimumFee, updated_at: new Date().toISOString(), updated_by: user?.email ?? '' })
        .eq('delivery_type', deliveryType));
    } else {
      ({ error: err } = await supabase
        .from('delivery_fee_settings')
        .insert({ delivery_type: deliveryType, fee_per_km: feePerKm, minimum_fee: minimumFee, updated_by: user?.email ?? '' }));
    }

    setSaving(null);
    if (err) { setError(err.message); return; }

    setSaved(deliveryType);
    setTimeout(() => setSaved(null), 2500);
    await fetchSettings();
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
              <p className="text-xs text-gray-500">Configure per-km rates shown to bookers</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How fees are calculated</p>
            <p>When a customer books a <strong>Same State</strong> delivery, the system automatically calculates the road distance between the pickup and delivery cities using OpenStreetMap routing. The estimated fee is <strong>distance × fee per km</strong>, with the minimum fee applied if the result is lower.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {ORDER.map(dt => {
              const cfg = TYPE_CONFIG[dt];
              const Icon = cfg.icon;
              const edit = edits[dt] ?? { fee_per_km: '0', minimum_fee: '0' };
              const isSaving = saving === dt;
              const isSaved = saved === dt;
              const feeKm = parseFloat(edit.fee_per_km) || 0;
              const minFee = parseFloat(edit.minimum_fee) || 0;

              return (
                <div key={dt} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${cfg.border}`}>
                  {/* Card header */}
                  <div className={`px-6 py-4 ${cfg.bg} border-b ${cfg.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className={`font-bold text-base ${cfg.color}`}>{cfg.label}</p>
                        <p className="text-xs text-gray-500">{cfg.desc}</p>
                      </div>
                    </div>
                    {settings[dt] && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Last updated</p>
                        <p className="text-xs font-medium text-gray-600">
                          {new Date(settings[dt].updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {settings[dt].updated_by ? ` by ${settings[dt].updated_by}` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Inputs */}
                  <div className="p-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Fee per Kilometre (₦)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={edit.fee_per_km}
                            onChange={e => setEdits(prev => ({ ...prev, [dt]: { ...prev[dt], fee_per_km: e.target.value } }))}
                            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all font-semibold"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Charged per km of road distance</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Minimum Fee (₦)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₦</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={edit.minimum_fee}
                            onChange={e => setEdits(prev => ({ ...prev, [dt]: { ...prev[dt], minimum_fee: e.target.value } }))}
                            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all font-semibold"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Floor charge regardless of distance</p>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">10 km trip</p>
                        <p className="font-bold text-gray-800 text-sm">{formatNaira(Math.max(10 * feeKm, minFee))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">50 km trip</p>
                        <p className="font-bold text-gray-800 text-sm">{formatNaira(Math.max(50 * feeKm, minFee))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">100 km trip</p>
                        <p className="font-bold text-gray-800 text-sm">{formatNaira(Math.max(100 * feeKm, minFee))}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleSave(dt)}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          isSaved
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:shadow-md hover:shadow-orange-500/20'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isSaving ? (
                          <><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</>
                        ) : isSaved ? (
                          <><CheckCircle className="h-4 w-4" /> Saved!</>
                        ) : (
                          <><Save className="h-4 w-4" /> Save Changes</>
                        )}
                      </button>
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
