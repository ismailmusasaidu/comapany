import { useState, useMemo } from 'react';
import {
  Warehouse, Truck, Package, Shield, ClipboardList, User,
  Upload, FileText, CheckCircle, Plus, Trash2, AlertTriangle,
  Calendar, MapPin, Navigation, GlassWater, Thermometer, Snowflake,
} from 'lucide-react';
import {
  TextField, TextArea, SearchableSelect, SelectCard, ToggleRow, CheckboxPill,
  FileUpload, ReviewSection, ReviewRow, ProgressBar, NavButtons,
  type AccentTheme,
} from './wizardFormParts';
import {
  type WarehouseFormData, EMPTY_WAREHOUSE, STORAGE_TYPES, CUSTOMER_TYPES,
  STORAGE_DURATIONS, GOODS_CATEGORIES, STORAGE_REQUIREMENTS,
  WAREHOUSE_ADDITIONAL_SERVICES, WAREHOUSE_DOCUMENT_TYPES,
  NIGERIAN_STATES,
  type WarehouseGoodsItem, type GoodsCategory, type StorageType, type CustomerType, type StorageDuration,
} from '../lib/warehouseData';

const ALL_STEPS = [
  { id: 0, label: 'Storage', icon: Warehouse },
  { id: 1, label: 'Pickup/Delivery', icon: Truck },
  { id: 2, label: 'Goods', icon: Package },
  { id: 3, label: 'Requirements', icon: Shield },
  { id: 4, label: 'Services', icon: ClipboardList },
  { id: 5, label: 'Contact', icon: User },
  { id: 6, label: 'Documents', icon: Upload },
  { id: 7, label: 'Notes', icon: FileText },
  { id: 8, label: 'Review', icon: CheckCircle },
];

function uid() { return Math.random().toString(36).slice(2, 10); }
function emptyGoods(): WarehouseGoodsItem {
  return { id: uid(), itemName: '', category: '', quantity: '', weightKg: '', lengthCm: '', widthCm: '', heightCm: '', fragile: false, highValue: false, hazardous: false, temperatureControlled: false };
}

interface Props {
  onSubmit: (data: WarehouseFormData) => Promise<void>;
  loading: boolean;
  accentColor: 'orange' | 'blue';
  onCancel: () => void;
}

export default function WarehouseWizard({ onSubmit, loading, accentColor, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WarehouseFormData>(EMPTY_WAREHOUSE);
  const [error, setError] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);

  const accent: AccentTheme = accentColor === 'orange'
    ? { ring: 'focus:ring-orange-500', border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', textDark: 'text-orange-700', btn: 'from-orange-500 to-red-500', btnHover: 'hover:from-orange-600 hover:to-red-600' }
    : { ring: 'focus:ring-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', textDark: 'text-blue-700', btn: 'from-blue-500 to-blue-600', btnHover: 'hover:from-blue-600 hover:to-blue-700' };

  const update = (patch: Partial<WarehouseFormData>) => {
    setData(prev => ({ ...prev, ...patch }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const updateGoods = (id: string, patch: Partial<WarehouseGoodsItem>) => {
    setData(prev => ({ ...prev, goods: prev.goods.map(g => g.id === id ? { ...g, ...patch } : g) }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const addGoods = () => setData(prev => ({ ...prev, goods: [...prev.goods, emptyGoods()] }));
  const removeGoods = (id: string) => setData(prev => ({ ...prev, goods: prev.goods.filter(g => g.id !== id) }));

  const toggleRequirement = (val: string) => {
    setData(prev => ({
      ...prev,
      storageRequirements: prev.storageRequirements.includes(val)
        ? prev.storageRequirements.filter(s => s !== val)
        : [...prev.storageRequirements, val],
    }));
  };

  const toggleService = (val: string) => {
    setData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(val)
        ? prev.additionalServices.filter(s => s !== val)
        : [...prev.additionalServices, val],
    }));
  };

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0:
        if (!data.storageType) return 'Please select a storage type.';
        if (!data.customerType) return 'Please select a customer type.';
        if (!data.storageDuration) return 'Please select a storage duration.';
        if (!data.preferredStartDate) return 'Please select a preferred start date.';
        return null;
      case 1:
        if (data.requirePickup) {
          if (!data.pickupState) return 'Please select the pickup state.';
          if (!data.pickupCity) return 'Please enter the pickup city.';
          if (!data.pickupAddress) return 'Please enter the pickup address.';
        }
        if (data.requireDelivery && !data.deliveryAddress) return 'Please enter the delivery address.';
        return null;
      case 2:
        if (data.goods.length === 0) return 'Please add at least one goods item.';
        for (const g of data.goods) {
          if (!g.itemName) return 'Each goods item needs a name.';
          if (!g.category) return 'Each goods item needs a category.';
          if (!g.quantity) return 'Each goods item needs a quantity.';
        }
        return null;
      case 5:
        if (!data.contactName) return 'Please enter a contact name.';
        if (!data.contactEmail) return 'Please enter a contact email.';
        if (!data.contactPhone) return 'Please enter a contact phone number.';
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    if (step === 1 && data.goods.length === 0) {
      setData(prev => ({ ...prev, goods: [emptyGoods()] }));
    }
    setStep(s => Math.min(s + 1, ALL_STEPS.length - 1));
  };

  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    const err = validateStep(5);
    if (err) { setError(err); setStep(5); return; }
    setError('');
    await onSubmit(data);
  };

  const totalWeight = useMemo(() => data.goods.reduce((s, g) => s + (parseFloat(g.weightKg) || 0), 0), [data.goods]);
  const totalQty = useMemo(() => data.goods.reduce((s, g) => s + (parseInt(g.quantity) || 0), 0), [data.goods]);

  return (
    <div className="space-y-6">
      <ProgressBar steps={ALL_STEPS} currentStep={step} accent={accent} autoSaved={autoSaved} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        {/* STEP 0: Storage Requirement */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Storage Requirement</h2>
              <p className="text-gray-500 text-sm mt-0.5">Tell us about your storage needs</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Storage Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STORAGE_TYPES.map(st => (
                  <SelectCard key={st.value} active={data.storageType === st.value} accent={accent}
                    title={st.label} desc={st.desc} compact
                    onClick={() => update({ storageType: st.value as StorageType })} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Customer Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CUSTOMER_TYPES.map(ct => (
                  <SelectCard key={ct.value} active={data.customerType === ct.value} accent={accent}
                    title={ct.label} desc={ct.desc} compact
                    onClick={() => update({ customerType: ct.value as CustomerType })} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Storage Duration <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STORAGE_DURATIONS.map(d => (
                  <SelectCard key={d.value} active={data.storageDuration === d.value} accent={accent}
                    title={d.label} compact
                    onClick={() => update({ storageDuration: d.value as StorageDuration })} />
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Preferred Storage Start Date <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={data.preferredStartDate} onChange={e => update({ preferredStartDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Estimated Storage End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={data.estimatedEndDate} onChange={e => update({ estimatedEndDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Pickup & Delivery */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Pickup & Delivery</h2>
              <p className="text-gray-500 text-sm mt-0.5">Do you need us to pick up and/or deliver your goods?</p>
            </div>

            {/* Pickup */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-700 text-sm">Do you require pickup?</h3>
                </div>
                <button type="button" onClick={() => update({ requirePickup: !data.requirePickup })} role="switch" aria-checked={data.requirePickup}
                  className={`relative w-12 h-6 rounded-full transition-all ${data.requirePickup ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${data.requirePickup ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {data.requirePickup && (
                <div className="space-y-3 pt-2">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <SearchableSelect label="State" value={data.pickupState} onChange={v => update({ pickupState: v })} options={NIGERIAN_STATES} accent={accent} />
                    <TextField label="City" value={data.pickupCity} onChange={v => update({ pickupCity: v })} placeholder="e.g. Lagos" accent={accent} required />
                  </div>
                  <TextField label="Pickup Address" value={data.pickupAddress} onChange={v => update({ pickupAddress: v })} placeholder="Full pickup address" accent={accent} required />
                  <div className="max-w-xs">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Preferred Pickup Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="date" value={data.pickupDate} onChange={e => update({ pickupDate: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-700 text-sm">Do you require delivery after storage?</h3>
                </div>
                <button type="button" onClick={() => update({ requireDelivery: !data.requireDelivery })} role="switch" aria-checked={data.requireDelivery}
                  className={`relative w-12 h-6 rounded-full transition-all ${data.requireDelivery ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${data.requireDelivery ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {data.requireDelivery && (
                <div className="space-y-3 pt-2">
                  <TextField label="Delivery Address" value={data.deliveryAddress} onChange={v => update({ deliveryAddress: v })} placeholder="Full delivery address after storage" accent={accent} required />
                  <div className="max-w-xs">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Preferred Delivery Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="date" value={data.deliveryDate} onChange={e => update({ deliveryDate: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Goods Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Goods Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Add each item you want to store</p>
            </div>

            {data.goods.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">No goods added yet</p>
                <button type="button" onClick={addGoods}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${accent.btn} transition-all`}>
                  <Plus className="h-4 w-4" /> Add First Item
                </button>
              </div>
            )}

            {data.goods.map((g, idx) => (
              <div key={g.id} className="border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg ${accent.bg} ${accent.text} flex items-center justify-center text-xs font-bold`}>{idx + 1}</span>
                    Goods Item {idx + 1}
                  </h4>
                  {data.goods.length > 1 && (
                    <button type="button" onClick={() => removeGoods(g.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField label="Item Name" value={g.itemName} onChange={v => updateGoods(g.id, { itemName: v })} placeholder="e.g. Rice, Office Chairs" accent={accent} required />
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Category <span className="text-red-400">*</span></label>
                    <select value={g.category} onChange={e => updateGoods(g.id, { category: e.target.value as GoodsCategory })}
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all bg-white`}>
                      <option value="">Select category...</option>
                      {GOODS_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <TextField label="Quantity" value={g.quantity} onChange={v => updateGoods(g.id, { quantity: v })} placeholder="0" type="number" accent={accent} required />
                  <TextField label="Weight (kg)" value={g.weightKg} onChange={v => updateGoods(g.id, { weightKg: v })} placeholder="0" type="number" accent={accent} optional />
                  <TextField label="Length (cm)" value={g.lengthCm} onChange={v => updateGoods(g.id, { lengthCm: v })} placeholder="0" type="number" accent={accent} optional />
                  <TextField label="Width (cm)" value={g.widthCm} onChange={v => updateGoods(g.id, { widthCm: v })} placeholder="0" type="number" accent={accent} optional />
                </div>
                <div className="max-w-xs">
                  <TextField label="Height (cm)" value={g.heightCm} onChange={v => updateGoods(g.id, { heightCm: v })} placeholder="0" type="number" accent={accent} optional />
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  <ToggleRow icon={GlassWater} iconColor="text-blue-500" bg="bg-blue-50" label="Fragile" value={g.fragile} onChange={v => updateGoods(g.id, { fragile: v })} />
                  <ToggleRow icon={Shield} iconColor="text-yellow-500" bg="bg-yellow-50" label="High Value" value={g.highValue} onChange={v => updateGoods(g.id, { highValue: v })} />
                  <ToggleRow icon={AlertTriangle} iconColor="text-red-500" bg="bg-red-50" label="Hazardous" value={g.hazardous} onChange={v => updateGoods(g.id, { hazardous: v })} />
                  <ToggleRow icon={Thermometer} iconColor="text-teal-500" bg="bg-teal-50" label="Temperature Controlled" value={g.temperatureControlled} onChange={v => updateGoods(g.id, { temperatureControlled: v })} />
                </div>
              </div>
            ))}

            {data.goods.length > 0 && (
              <div className="flex items-center justify-between">
                <button type="button" onClick={addGoods}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all ${accent.border} ${accent.bg} ${accent.textDark} hover:opacity-80`}>
                  <Plus className="h-4 w-4" /> Add Another Item
                </button>
                <div className="text-right text-sm text-gray-500">
                  <p>Total: <span className="font-bold text-gray-800">{totalQty} units</span> · <span className="font-bold text-gray-800">{totalWeight.toFixed(1)} kg</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Storage Requirements */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Storage Requirements</h2>
              <p className="text-gray-500 text-sm mt-0.5">Select the storage conditions you need</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STORAGE_REQUIREMENTS.map(req => {
                const Icon = req.value.includes('cold') || req.value.includes('frozen') ? Snowflake : req.value.includes('climate') || req.value.includes('humidity') ? Thermometer : Shield;
                return <CheckboxPill key={req.value} checked={data.storageRequirements.includes(req.value)} accent={accent} label={req.label} icon={Icon} onClick={() => toggleRequirement(req.value)} />;
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Additional Warehouse Services */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Additional Warehouse Services</h2>
              <p className="text-gray-500 text-sm mt-0.5">Select any extra services you need</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WAREHOUSE_ADDITIONAL_SERVICES.map(svc => (
                <CheckboxPill key={svc.value} checked={data.additionalServices.includes(svc.value)} accent={accent}
                  label={svc.label} onClick={() => toggleService(svc.value)} />
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Contact Information */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Contact Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">How can we reach you about your storage request?</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Full Name" value={data.contactName} onChange={v => update({ contactName: v })} placeholder="John Doe" accent={accent} required />
              <TextField label="Company Name" value={data.contactCompany} onChange={v => update({ contactCompany: v })} placeholder="Optional" accent={accent} optional />
              <TextField label="Email Address" value={data.contactEmail} onChange={v => update({ contactEmail: v })} placeholder="you@example.com" type="email" accent={accent} required />
              <TextField label="Phone Number" value={data.contactPhone} onChange={v => update({ contactPhone: v })} placeholder="+234 800 000 0000" type="tel" accent={accent} required />
              <TextField label="WhatsApp Number" value={data.contactWhatsApp} onChange={v => update({ contactWhatsApp: v })} placeholder="Optional" type="tel" accent={accent} optional />
            </div>
            <div className="pt-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">Business Details <span className="text-gray-400 font-normal">(optional)</span></p>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="RC Number" value={data.rcNumber} onChange={v => update({ rcNumber: v })} placeholder="e.g. RC1234567" accent={accent} optional />
                <TextField label="Business Address" value={data.businessAddress} onChange={v => update({ businessAddress: v })} placeholder="Full business address" accent={accent} optional />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Upload Documents */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Upload Documents</h2>
              <p className="text-gray-500 text-sm mt-0.5">Upload supporting documents for your storage request</p>
            </div>
            <FileUpload accent={accent} documentTypes={WAREHOUSE_DOCUMENT_TYPES}
              files={data.documents}
              onAddFiles={(names, type) => {
                const newDocs = names.map(name => ({ name, type }));
                setData(prev => ({ ...prev, documents: [...prev.documents, ...newDocs] }));
              }}
              onRemoveFile={idx => setData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }))} />
            <p className="text-xs text-gray-400">File names are recorded with your request. Our team will request the actual files when following up.</p>
          </div>
        )}

        {/* STEP 7: Additional Notes */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Additional Notes</h2>
              <p className="text-gray-500 text-sm mt-0.5">Any special instructions or requirements</p>
            </div>
            <TextArea label="Special Instructions / Additional Information" value={data.additionalNotes}
              onChange={v => update({ additionalNotes: v })}
              placeholder="Special handling instructions, storage conditions, delivery instructions, any other requirements..."
              accent={accent} rows={6} />
          </div>
        )}

        {/* STEP 8: Review & Submit */}
        {step === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Review Your Request</h2>
              <p className="text-gray-500 text-sm mt-0.5">Please confirm the details before submitting</p>
            </div>

            <div className="space-y-4">
              <ReviewSection title="Storage Requirement" accent={accent}>
                <ReviewRow label="Storage Type" value={STORAGE_TYPES.find(s => s.value === data.storageType)?.label || '—'} />
                <ReviewRow label="Customer Type" value={CUSTOMER_TYPES.find(c => c.value === data.customerType)?.label || '—'} />
                <ReviewRow label="Duration" value={STORAGE_DURATIONS.find(d => d.value === data.storageDuration)?.label || '—'} />
                {data.preferredStartDate && <ReviewRow label="Start Date" value={new Date(data.preferredStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />}
                {data.estimatedEndDate && <ReviewRow label="End Date" value={new Date(data.estimatedEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />}
              </ReviewSection>

              {(data.requirePickup || data.requireDelivery) && (
                <ReviewSection title="Pickup & Delivery" accent={accent}>
                  {data.requirePickup ? (
                    <>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Pickup</p>
                      <ReviewRow label="Location" value={`${data.pickupCity}, ${data.pickupState}`} compact />
                      <ReviewRow label="Address" value={data.pickupAddress} compact />
                      {data.pickupDate && <ReviewRow label="Date" value={new Date(data.pickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} compact />}
                    </>
                  ) : <ReviewRow label="Pickup" value="Not required" />}
                  {data.requireDelivery ? (
                    <>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1 mt-3">Delivery</p>
                      <ReviewRow label="Address" value={data.deliveryAddress} compact />
                      {data.deliveryDate && <ReviewRow label="Date" value={new Date(data.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} compact />}
                    </>
                  ) : <ReviewRow label="Delivery" value="Not required" />}
                </ReviewSection>
              )}

              <ReviewSection title="Goods Information" accent={accent}>
                {data.goods.map((g, i) => (
                  <div key={g.id} className={`pb-2 ${i < data.goods.length - 1 ? 'border-b border-gray-100 mb-2' : ''}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Item {i + 1}: {g.itemName}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <span className="text-gray-500">Category: <span className="text-gray-700">{GOODS_CATEGORIES.find(c => c.value === g.category)?.label || '—'}</span></span>
                      <span className="text-gray-500">Qty: <span className="text-gray-700">{g.quantity || '—'}</span></span>
                      <span className="text-gray-500">Weight: <span className="text-gray-700">{g.weightKg ? `${g.weightKg} kg` : '—'}</span></span>
                    </div>
                    {(g.fragile || g.highValue || g.hazardous || g.temperatureControlled) && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {g.fragile && <span className="text-xs text-blue-600">Fragile</span>}
                        {g.highValue && <span className="text-xs text-yellow-600">High Value</span>}
                        {g.hazardous && <span className="text-xs text-red-600">Hazardous</span>}
                        {g.temperatureControlled && <span className="text-xs text-teal-600">Temp Controlled</span>}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Total: <span className="font-bold text-gray-800">{totalQty} units · {totalWeight.toFixed(1)} kg</span></span>
                </div>
              </ReviewSection>

              {data.storageRequirements.length > 0 && (
                <ReviewSection title="Storage Requirements" accent={accent}>
                  <div className="flex flex-wrap gap-2">
                    {data.storageRequirements.map(r => (
                      <span key={r} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${accent.bg} ${accent.textDark}`}>
                        {STORAGE_REQUIREMENTS.find(s => s.value === r)?.label || r}
                      </span>
                    ))}
                  </div>
                </ReviewSection>
              )}

              {data.additionalServices.length > 0 && (
                <ReviewSection title="Additional Services" accent={accent}>
                  <div className="flex flex-wrap gap-2">
                    {data.additionalServices.map(s => (
                      <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${accent.bg} ${accent.textDark}`}>
                        {WAREHOUSE_ADDITIONAL_SERVICES.find(a => a.value === s)?.label || s}
                      </span>
                    ))}
                  </div>
                </ReviewSection>
              )}

              <ReviewSection title="Contact Information" accent={accent}>
                <ReviewRow label="Name" value={data.contactName} />
                {data.contactCompany && <ReviewRow label="Company" value={data.contactCompany} />}
                <ReviewRow label="Email" value={data.contactEmail} />
                <ReviewRow label="Phone" value={data.contactPhone} />
                {data.contactWhatsApp && <ReviewRow label="WhatsApp" value={data.contactWhatsApp} />}
                {data.rcNumber && <ReviewRow label="RC Number" value={data.rcNumber} />}
                {data.businessAddress && <ReviewRow label="Business Address" value={data.businessAddress} />}
              </ReviewSection>

              {data.documents.length > 0 && (
                <ReviewSection title="Documents Uploaded" accent={accent}>
                  {data.documents.map((d, i) => (
                    <ReviewRow key={i} label={WAREHOUSE_DOCUMENT_TYPES.find(dt => dt.value === d.type)?.label || 'Other'} value={d.name} />
                  ))}
                </ReviewSection>
              )}

              {data.additionalNotes && (
                <ReviewSection title="Notes" accent={accent}>
                  <p className="text-sm text-gray-600">{data.additionalNotes}</p>
                </ReviewSection>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={back}
                className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              <button type="button" onClick={() => setStep(0)}
                className={`flex items-center gap-2 px-5 py-3 border-2 ${accent.border} ${accent.bg} ${accent.textDark} rounded-xl font-semibold text-sm transition-all hover:opacity-80`}>
                Edit
              </button>
              <button type="button" onClick={handleSubmit} disabled={loading}
                className={`flex items-center gap-2 bg-gradient-to-r ${accent.btn} text-white px-8 py-3 rounded-xl font-bold text-sm ${accent.btnHover} transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ml-auto`}>
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><CheckCircle className="h-4 w-4" /> Submit Request</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation (hidden on review step which has its own) */}
      {step !== 8 && (
        <NavButtons step={step} accent={accent} onBack={back} onCancel={onCancel}
          onNext={next} onSubmit={handleSubmit} loading={loading}
          isLastStep={step === ALL_STEPS[ALL_STEPS.length - 1].id} />
      )}
    </div>
  );
}
