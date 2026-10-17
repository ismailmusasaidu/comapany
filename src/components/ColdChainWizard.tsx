import { useState } from 'react';
import { Snowflake, Thermometer, Calendar, CheckCircle, AlertTriangle, Weight } from 'lucide-react';
import { TextField, TextArea, SelectCard, type AccentTheme } from './wizardFormParts';
import {
  type ColdChainFormData, EMPTY_COLDCHAIN, CARGO_CATEGORIES, SHIPMENT_FREQUENCIES,
  type CargoCategory, type ShipmentFrequency,
} from '../lib/coldChainData';

interface Props {
  onSubmit: (data: ColdChainFormData) => Promise<void>;
  loading: boolean;
  accentColor: 'orange' | 'blue';
  onCancel: () => void;
}

export default function ColdChainWizard({ onSubmit, loading, accentColor, onCancel }: Props) {
  const [data, setData] = useState<ColdChainFormData>(EMPTY_COLDCHAIN);
  const [error, setError] = useState('');

  const accent: AccentTheme = accentColor === 'orange'
    ? { ring: 'focus:ring-orange-500', border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', textDark: 'text-orange-700', btn: 'from-orange-500 to-red-500', btnHover: 'hover:from-orange-600 hover:to-red-600' }
    : { ring: 'focus:ring-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', textDark: 'text-blue-700', btn: 'from-blue-500 to-blue-600', btnHover: 'hover:from-blue-600 hover:to-blue-700' };

  const update = (patch: Partial<ColdChainFormData>) => {
    setData(prev => ({ ...prev, ...patch }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!data.cargoCategory) { setError('Please select a cargo category.'); return; }
    if (!data.temperatureKnown) { setError('Please tell us whether you know the required temperature range.'); return; }
    if (data.temperatureKnown === 'yes' && (!data.minTemp || !data.maxTemp)) {
      setError('Please enter both the minimum and maximum temperature.'); return;
    }
    if (!data.cargoWeightKg) { setError('Please enter the total cargo weight.'); return; }
    if (!data.pickupAddress) { setError('Please enter the pickup address.'); return; }
    if (!data.deliveryAddress) { setError('Please enter the delivery address.'); return; }
    if (!data.preferredPickupDate) { setError('Please select a preferred pickup date.'); return; }
    if (!data.shipmentFrequency) { setError('Please select a shipment frequency.'); return; }
    setError('');
    await onSubmit(data);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${accent.bg}`}>
            <Snowflake className={`h-5 w-5 ${accent.text}`} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Cold Chain Logistics Request</h2>
            <p className="text-gray-500 text-sm mt-0.5">Request a quotation for temperature-controlled transport</p>
          </div>
        </div>

        {/* Cargo category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Cargo Category <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CARGO_CATEGORIES.map(c => (
              <SelectCard key={c.value} active={data.cargoCategory === c.value} accent={accent}
                title={c.label} compact onClick={() => update({ cargoCategory: c.value as CargoCategory })} />
            ))}
          </div>
        </div>

        {/* Temperature range known */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Required Temperature Range Known? <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectCard key="yes" active={data.temperatureKnown === 'yes'} accent={accent}
              title="Yes, I know the required range" icon={Thermometer} compact
              onClick={() => update({ temperatureKnown: 'yes' })} />
            <SelectCard key="no" active={data.temperatureKnown === 'no'} accent={accent}
              title="No, I need assistance" compact
              onClick={() => update({ temperatureKnown: 'no' })} />
          </div>

          {data.temperatureKnown === 'yes' && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <TextField label="Minimum Temperature (°C)" value={data.minTemp} onChange={v => update({ minTemp: v })}
                placeholder="e.g. 2" type="number" accent={accent} required />
              <TextField label="Maximum Temperature (°C)" value={data.maxTemp} onChange={v => update({ maxTemp: v })}
                placeholder="e.g. 8" type="number" accent={accent} required />
            </div>
          )}
        </div>

        {/* Weight */}
        <div className="max-w-xs">
          <TextField label="Total Cargo Weight (kg)" value={data.cargoWeightKg} onChange={v => update({ cargoWeightKg: v })}
            placeholder="e.g. 250" type="number" accent={accent} required icon={Weight} />
        </div>

        {/* Addresses */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Address <span className="text-red-400">*</span></label>
            <TextArea label="" value={data.pickupAddress} onChange={v => update({ pickupAddress: v })}
              placeholder="Full pickup address" accent={accent} rows={3} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Address <span className="text-red-400">*</span></label>
            <TextArea label="" value={data.deliveryAddress} onChange={v => update({ deliveryAddress: v })}
              placeholder="Full delivery address" accent={accent} rows={3} />
          </div>
        </div>

        {/* Pickup date */}
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Preferred Pickup Date <span className="text-red-400">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="date" value={data.preferredPickupDate} onChange={e => update({ preferredPickupDate: e.target.value })}
              className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Shipment Frequency <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SHIPMENT_FREQUENCIES.map(f => (
              <SelectCard key={f.value} active={data.shipmentFrequency === f.value} accent={accent}
                title={f.label} compact onClick={() => update({ shipmentFrequency: f.value as ShipmentFrequency })} />
            ))}
          </div>
        </div>

        {/* Handling requirements */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Handling Requirements <span className="text-gray-400 font-normal">(optional)</span></label>
          <TextArea label="" value={data.handlingRequirements}
            onChange={v => update({ handlingRequirements: v })}
            placeholder="Any special handling, packaging or compliance requirements..."
            accent={accent} rows={4} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={loading}
          className={`flex items-center gap-2 bg-gradient-to-r ${accent.btn} text-white px-8 py-3 rounded-xl font-bold text-sm ${accent.btnHover} transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}>
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><CheckCircle className="h-4 w-4" /> Submit Request</>}
        </button>
      </div>
    </div>
  );
}
