import { useState, useMemo } from 'react';
import {
  Boxes, MapPin, Navigation, Package, ClipboardList, Truck,
  User, Upload, FileText, CheckCircle, Plus, Trash2, AlertTriangle,
  Home, Building2, Warehouse, Store, Factory, Calendar, Shield,
  GlassWater, Zap, Box, ArrowRight,
} from 'lucide-react';
import {
  TextField, TextArea, SearchableSelect, SelectCard, ToggleRow, CheckboxPill,
  FileUpload, ReviewSection, ReviewRow, ProgressBar, NavButtons,
  type AccentTheme,
} from './wizardFormParts';
import {
  type RelocationFormData, EMPTY_RELOCATION, RELOCATION_TYPES, MOVE_SCOPES,
  SERVICES_REQUIRED, PROPERTY_TYPES, ITEM_CATEGORIES, ADDITIONAL_MOVING_SERVICES,
  VEHICLE_OPTIONS, RELOCATION_DOCUMENT_TYPES, NIGERIAN_STATES, COUNTRIES,
  type MoveItem, type MoveLocation, type VehicleType, type PropertyType,
} from '../lib/relocationData';

const ALL_STEPS = [
  { id: 0, label: 'Relocation', icon: Boxes },
  { id: 1, label: 'Pickup', icon: MapPin },
  { id: 2, label: 'Delivery', icon: Navigation },
  { id: 3, label: 'Items', icon: Package },
  { id: 4, label: 'Services', icon: ClipboardList },
  { id: 5, label: 'Vehicle', icon: Truck },
  { id: 6, label: 'Contact', icon: User },
  { id: 7, label: 'Photos', icon: Upload },
  { id: 8, label: 'Notes', icon: FileText },
  { id: 9, label: 'Review', icon: CheckCircle },
];

function uid() { return Math.random().toString(36).slice(2, 10); }
function emptyItem(): MoveItem {
  return { id: uid(), category: '', description: '', quantity: '', weightKg: '', fragile: false, highValue: false, specialHandling: false };
}

const ICON_MAP: Record<string, typeof Home> = {
  home: Home, office: Building2, apartment: Building2, business: Building2,
  warehouse: Warehouse, shop: Store, industrial: Factory,
};

interface Props {
  onSubmit: (data: RelocationFormData) => Promise<void>;
  loading: boolean;
  accentColor: 'orange' | 'blue';
  onCancel: () => void;
}

export default function RelocationWizard({ onSubmit, loading, accentColor, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RelocationFormData>(EMPTY_RELOCATION);
  const [error, setError] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);

  const accent: AccentTheme = accentColor === 'orange'
    ? { ring: 'focus:ring-orange-500', border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', textDark: 'text-orange-700', btn: 'from-orange-500 to-red-500', btnHover: 'hover:from-orange-600 hover:to-red-600' }
    : { ring: 'focus:ring-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', textDark: 'text-blue-700', btn: 'from-blue-500 to-blue-600', btnHover: 'hover:from-blue-600 hover:to-blue-700' };

  const isInternational = data.moveScope === 'international';

  const update = (patch: Partial<RelocationFormData>) => {
    setData(prev => ({ ...prev, ...patch }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const updatePickup = (patch: Partial<MoveLocation>) => {
    setData(prev => ({ ...prev, pickup: { ...prev.pickup, ...patch } }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const updateDelivery = (patch: Partial<MoveLocation>) => {
    setData(prev => ({ ...prev, delivery: { ...prev.delivery, ...patch } }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const updateItem = (id: string, patch: Partial<MoveItem>) => {
    setData(prev => ({ ...prev, items: prev.items.map(it => it.id === id ? { ...it, ...patch } : it) }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const addItem = () => setData(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeItem = (id: string) => setData(prev => ({ ...prev, items: prev.items.filter(it => it.id !== id) }));

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
        if (!data.relocationType) return 'Please select a relocation type.';
        if (!data.moveScope) return 'Please select a move scope.';
        if (!data.serviceRequired) return 'Please select the service you need.';
        return null;
      case 1:
        if (!isInternational && !data.pickup.state) return 'Please select the pickup state.';
        if (isInternational && !data.pickup.country) return 'Please select the pickup country.';
        if (!data.pickup.city) return 'Please enter the pickup city.';
        if (!data.pickup.address) return 'Please enter the full pickup address.';
        return null;
      case 2:
        if (!isInternational && !data.delivery.state) return 'Please select the delivery state.';
        if (isInternational && !data.delivery.country) return 'Please select the delivery country.';
        if (!data.delivery.city) return 'Please enter the delivery city.';
        if (!data.delivery.address) return 'Please enter the full delivery address.';
        return null;
      case 3:
        if (data.items.length === 0) return 'Please add at least one item to be moved.';
        for (const it of data.items) {
          if (!it.category) return 'Each item needs a category.';
          if (!it.description) return 'Each item needs a description.';
          if (!it.quantity) return 'Each item needs a quantity.';
        }
        return null;
      case 5:
        if (!data.vehicleType) return 'Please select a vehicle preference.';
        return null;
      case 6:
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
    if (step === 2 && data.items.length === 0) {
      setData(prev => ({ ...prev, items: [emptyItem()] }));
    }
    setStep(s => Math.min(s + 1, ALL_STEPS.length - 1));
  };

  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    const err = validateStep(6);
    if (err) { setError(err); setStep(6); return; }
    setError('');
    await onSubmit(data);
  };

  const totalWeight = useMemo(() => data.items.reduce((s, it) => s + (parseFloat(it.weightKg) || 0), 0), [data.items]);
  const totalQty = useMemo(() => data.items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0), [data.items]);

  const renderLocationFields = (loc: MoveLocation, updateFn: (patch: Partial<MoveLocation>) => void, label: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {label === 'Pickup' ? <MapPin className="h-4 w-4 text-gray-400" /> : <Navigation className="h-4 w-4 text-gray-400" />}
        <h3 className="font-semibold text-gray-700 text-sm">{label} Location</h3>
      </div>
      {isInternational ? (
        <SearchableSelect label="Country" value={loc.country} onChange={v => updateFn({ country: v })} options={COUNTRIES} accent={accent} />
      ) : (
        <SearchableSelect label="State" value={loc.state} onChange={v => updateFn({ state: v })} options={NIGERIAN_STATES} accent={accent} />
      )}
      {isInternational && (
        <TextField label="State / Province" value={loc.state} onChange={v => updateFn({ state: v })} placeholder="e.g. Maharashtra, Texas" accent={accent} />
      )}
      <TextField label="City" value={loc.city} onChange={v => updateFn({ city: v })} placeholder="e.g. Lagos, Abuja" accent={accent} required />
      <TextField label="Full Address" value={loc.address} onChange={v => updateFn({ address: v })} placeholder="House number, street name, area" accent={accent} required />
      {!isInternational && (
        <TextField label="Building Name" value={loc.buildingName} onChange={v => updateFn({ buildingName: v })} placeholder="Optional" accent={accent} optional />
      )}

      <div className="pt-2">
        <p className="text-sm font-semibold text-gray-700 mb-3">Additional Information</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Property Type</label>
            <select value={loc.propertyType} onChange={e => updateFn({ propertyType: e.target.value as PropertyType })}
              className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all bg-white`}>
              <option value="">Select...</option>
              {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <TextField label="Floor Number" value={loc.floorNumber} onChange={v => updateFn({ floorNumber: v })} placeholder="e.g. 3rd floor, Ground" accent={accent} optional />
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <ToggleRow icon={ArrowRight} iconColor="text-blue-500" bg="bg-blue-50" label="Lift / Elevator Available?" value={loc.liftAvailable} onChange={v => updateFn({ liftAvailable: v })} />
          <ToggleRow icon={Truck} iconColor="text-green-500" bg="bg-green-50" label="Parking for Moving Truck?" value={loc.parkingAvailable} onChange={v => updateFn({ parkingAvailable: v })} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ProgressBar steps={ALL_STEPS} currentStep={step} accent={accent} autoSaved={autoSaved} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        {/* STEP 0: Relocation Information */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Relocation Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Tell us about your move</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Relocation Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RELOCATION_TYPES.map(rt => {
                  const Icon = ICON_MAP[rt.icon] || Box;
                  return (
                    <SelectCard key={rt.value} active={data.relocationType === rt.value} accent={accent} icon={Icon}
                      title={rt.label} desc={rt.desc} compact
                      onClick={() => update({ relocationType: rt.value as RelocationFormData['relocationType'] })} />
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Move Scope <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MOVE_SCOPES.map(ms => (
                  <SelectCard key={ms.value} active={data.moveScope === ms.value} accent={accent}
                    title={ms.label} desc={ms.desc} compact
                    onClick={() => update({
                      moveScope: ms.value as RelocationFormData['moveScope'],
                      pickup: { ...data.pickup, country: ms.value === 'international' ? '' : 'Nigeria', state: '' },
                      delivery: { ...data.delivery, country: ms.value === 'international' ? '' : 'Nigeria', state: '' },
                    })} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Service Required <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES_REQUIRED.map(sr => (
                  <SelectCard key={sr.value} active={data.serviceRequired === sr.value} accent={accent}
                    title={sr.label} desc={sr.desc} compact
                    onClick={() => update({ serviceRequired: sr.value as RelocationFormData['serviceRequired'] })} />
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Preferred Moving Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={data.preferredDate} onChange={e => update({ preferredDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Flexible Moving Date?</label>
                <div className="flex gap-2">
                  {([['yes', true], ['no', false]] as const).map(([label, val]) => (
                    <button key={label} type="button" onClick={() => update({ flexibleDate: val })}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                        data.flexibleDate === val ? `${accent.border} ${accent.bg} ${accent.textDark}` : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Pickup Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Pickup Location</h2>
              <p className="text-gray-500 text-sm mt-0.5">Where are we picking up from?</p>
            </div>
            {renderLocationFields(data.pickup, updatePickup, 'Pickup')}
          </div>
        )}

        {/* STEP 2: Delivery Location */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Delivery Location</h2>
              <p className="text-gray-500 text-sm mt-0.5">Where are we delivering to?</p>
            </div>
            {renderLocationFields(data.delivery, updateDelivery, 'Delivery')}
          </div>
        )}

        {/* STEP 3: Items to be Moved */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Items to be Moved</h2>
              <p className="text-gray-500 text-sm mt-0.5">Add each category of items you're moving</p>
            </div>

            {data.items.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">No items added yet</p>
                <button type="button" onClick={addItem}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${accent.btn} transition-all`}>
                  <Plus className="h-4 w-4" /> Add First Item
                </button>
              </div>
            )}

            {data.items.map((item, idx) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg ${accent.bg} ${accent.text} flex items-center justify-center text-xs font-bold`}>{idx + 1}</span>
                    Item {idx + 1}
                  </h4>
                  {data.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Category <span className="text-red-400">*</span></label>
                    <select value={item.category} onChange={e => updateItem(item.id, { category: e.target.value })}
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all bg-white`}>
                      <option value="">Select category...</option>
                      {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <TextField label="Description" value={item.description} onChange={v => updateItem(item.id, { description: v })} placeholder="e.g. 3-seater sofa, office desk" accent={accent} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Quantity" value={item.quantity} onChange={v => updateItem(item.id, { quantity: v })} placeholder="0" type="number" accent={accent} required />
                  <TextField label="Estimated Weight (kg)" value={item.weightKg} onChange={v => updateItem(item.id, { weightKg: v })} placeholder="0" type="number" accent={accent} optional />
                </div>

                <div className="space-y-2">
                  <ToggleRow icon={GlassWater} iconColor="text-blue-500" bg="bg-blue-50" label="Fragile?" value={item.fragile} onChange={v => updateItem(item.id, { fragile: v })} />
                  <ToggleRow icon={Shield} iconColor="text-yellow-500" bg="bg-yellow-50" label="High Value?" value={item.highValue} onChange={v => updateItem(item.id, { highValue: v })} />
                  <ToggleRow icon={Zap} iconColor="text-orange-500" bg="bg-orange-50" label="Requires Special Handling?" value={item.specialHandling} onChange={v => updateItem(item.id, { specialHandling: v })} />
                </div>
              </div>
            ))}

            {data.items.length > 0 && (
              <div className="flex items-center justify-between">
                <button type="button" onClick={addItem}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all ${accent.border} ${accent.bg} ${accent.textDark} hover:opacity-80`}>
                  <Plus className="h-4 w-4" /> Add Another Item
                </button>
                <div className="text-right text-sm text-gray-500">
                  <p>Total: <span className="font-bold text-gray-800">{totalQty} items</span> · <span className="font-bold text-gray-800">{totalWeight.toFixed(1)} kg</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Additional Moving Services */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Additional Moving Services</h2>
              <p className="text-gray-500 text-sm mt-0.5">Select any extra services you need</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADDITIONAL_MOVING_SERVICES.map(svc => (
                <CheckboxPill key={svc.value} checked={data.additionalServices.includes(svc.value)} accent={accent}
                  label={svc.label} onClick={() => toggleService(svc.value)} />
              ))}
            </div>
  </div>
        )}

        {/* STEP 5: Vehicle Requirements */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Vehicle Requirements</h2>
              <p className="text-gray-500 text-sm mt-0.5">Choose the vehicle for your move</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {VEHICLE_OPTIONS.map(v => (
                <SelectCard key={v.value} active={data.vehicleType === v.value} accent={accent} icon={v.value === 'recommend' ? Zap : Truck}
                  title={v.label} desc={v.desc} compact
                  onClick={() => update({ vehicleType: v.value as VehicleType })} />
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Contact Information */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Contact Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">How can we reach you about your move?</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Full Name" value={data.contactName} onChange={v => update({ contactName: v })} placeholder="John Doe" accent={accent} required />
              <TextField label="Company Name" value={data.contactCompany} onChange={v => update({ contactCompany: v })} placeholder="Optional" accent={accent} optional />
              <TextField label="Email Address" value={data.contactEmail} onChange={v => update({ contactEmail: v })} placeholder="you@example.com" type="email" accent={accent} required />
              <TextField label="Phone Number" value={data.contactPhone} onChange={v => update({ contactPhone: v })} placeholder="+234 800 000 0000" type="tel" accent={accent} required />
              <TextField label="WhatsApp Number" value={data.contactWhatsApp} onChange={v => update({ contactWhatsApp: v })} placeholder="Optional" type="tel" accent={accent} optional />
            </div>
          </div>
        )}

        {/* STEP 7: Photos & Documents */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Photos & Documents</h2>
              <p className="text-gray-500 text-sm mt-0.5">Upload photos and documents to help us plan your move</p>
            </div>
            <FileUpload accent={accent} documentTypes={RELOCATION_DOCUMENT_TYPES}
              files={data.documents}
              onAddFiles={(names, type) => {
                const newDocs = names.map(name => ({ name, type }));
                setData(prev => ({ ...prev, documents: [...prev.documents, ...newDocs] }));
              }}
              onRemoveFile={idx => setData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }))} />
            <p className="text-xs text-gray-400">File names are recorded with your request. Our team will request the actual files when following up.</p>
          </div>
        )}

        {/* STEP 8: Additional Notes */}
        {step === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Additional Notes</h2>
              <p className="text-gray-500 text-sm mt-0.5">Any special instructions or requirements</p>
            </div>
            <TextArea label="Special Instructions / Additional Information" value={data.additionalNotes}
              onChange={v => update({ additionalNotes: v })}
              placeholder="Special instructions, access restrictions, security requirements, timing preferences, etc..."
              accent={accent} rows={6} />
          </div>
        )}

        {/* STEP 9: Review & Submit */}
        {step === 9 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Review Your Request</h2>
              <p className="text-gray-500 text-sm mt-0.5">Please confirm the details before submitting</p>
            </div>

            <div className="space-y-4">
              <ReviewSection title="Relocation Information" accent={accent}>
                <ReviewRow label="Relocation Type" value={RELOCATION_TYPES.find(r => r.value === data.relocationType)?.label || '—'} />
                <ReviewRow label="Move Scope" value={MOVE_SCOPES.find(m => m.value === data.moveScope)?.label || '—'} />
                <ReviewRow label="Service" value={SERVICES_REQUIRED.find(s => s.value === data.serviceRequired)?.label || '—'} />
                {data.preferredDate && <ReviewRow label="Moving Date" value={new Date(data.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />}
                <ReviewRow label="Flexible Date" value={data.flexibleDate ? 'Yes' : 'No'} />
              </ReviewSection>

              <ReviewSection title="Pickup Location" accent={accent}>
                {isInternational && <ReviewRow label="Country" value={data.pickup.country || '—'} />}
                {!isInternational && <ReviewRow label="State" value={data.pickup.state || '—'} />}
                <ReviewRow label="City" value={data.pickup.city || '—'} />
                <ReviewRow label="Address" value={data.pickup.address || '—'} />
                {data.pickup.buildingName && <ReviewRow label="Building" value={data.pickup.buildingName} />}
                {data.pickup.propertyType && <ReviewRow label="Property Type" value={PROPERTY_TYPES.find(p => p.value === data.pickup.propertyType)?.label || '—'} />}
                {data.pickup.floorNumber && <ReviewRow label="Floor" value={data.pickup.floorNumber} />}
                <ReviewRow label="Lift Available" value={data.pickup.liftAvailable ? 'Yes' : 'No'} />
                <ReviewRow label="Parking" value={data.pickup.parkingAvailable ? 'Yes' : 'No'} />
              </ReviewSection>

              <ReviewSection title="Delivery Location" accent={accent}>
                {isInternational && <ReviewRow label="Country" value={data.delivery.country || '—'} />}
                {!isInternational && <ReviewRow label="State" value={data.delivery.state || '—'} />}
                <ReviewRow label="City" value={data.delivery.city || '—'} />
                <ReviewRow label="Address" value={data.delivery.address || '—'} />
                {data.delivery.buildingName && <ReviewRow label="Building" value={data.delivery.buildingName} />}
                {data.delivery.propertyType && <ReviewRow label="Property Type" value={PROPERTY_TYPES.find(p => p.value === data.delivery.propertyType)?.label || '—'} />}
                {data.delivery.floorNumber && <ReviewRow label="Floor" value={data.delivery.floorNumber} />}
                <ReviewRow label="Lift Available" value={data.delivery.liftAvailable ? 'Yes' : 'No'} />
                <ReviewRow label="Parking" value={data.delivery.parkingAvailable ? 'Yes' : 'No'} />
              </ReviewSection>

              <ReviewSection title="Items to be Moved" accent={accent}>
                {data.items.map((it, i) => (
                  <div key={it.id} className={`pb-2 ${i < data.items.length - 1 ? 'border-b border-gray-100 mb-2' : ''}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Item {i + 1}: {it.category}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <span className="text-gray-500">Desc: <span className="text-gray-700">{it.description}</span></span>
                      <span className="text-gray-500">Qty: <span className="text-gray-700">{it.quantity || '—'}</span></span>
                      <span className="text-gray-500">Weight: <span className="text-gray-700">{it.weightKg ? `${it.weightKg} kg` : '—'}</span></span>
                    </div>
                    {(it.fragile || it.highValue || it.specialHandling) && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {it.fragile && <span className="text-xs text-blue-600">Fragile</span>}
                        {it.highValue && <span className="text-xs text-yellow-600">High Value</span>}
                        {it.specialHandling && <span className="text-xs text-orange-600">Special Handling</span>}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Total: <span className="font-bold text-gray-800">{totalQty} items · {totalWeight.toFixed(1)} kg</span></span>
                </div>
              </ReviewSection>

              {data.additionalServices.length > 0 && (
                <ReviewSection title="Additional Services" accent={accent}>
                  <div className="flex flex-wrap gap-2">
                    {data.additionalServices.map(s => (
                      <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${accent.bg} ${accent.textDark}`}>
                        {ADDITIONAL_MOVING_SERVICES.find(a => a.value === s)?.label || s}
                      </span>
                    ))}
                  </div>
                </ReviewSection>
              )}

              <ReviewSection title="Vehicle" accent={accent}>
                <ReviewRow label="Vehicle" value={VEHICLE_OPTIONS.find(v => v.value === data.vehicleType)?.label || '—'} />
              </ReviewSection>

              <ReviewSection title="Contact Information" accent={accent}>
                <ReviewRow label="Name" value={data.contactName} />
                {data.contactCompany && <ReviewRow label="Company" value={data.contactCompany} />}
                <ReviewRow label="Email" value={data.contactEmail} />
                <ReviewRow label="Phone" value={data.contactPhone} />
                {data.contactWhatsApp && <ReviewRow label="WhatsApp" value={data.contactWhatsApp} />}
              </ReviewSection>

              {data.documents.length > 0 && (
                <ReviewSection title="Documents Uploaded" accent={accent}>
                  {data.documents.map((d, i) => (
                    <ReviewRow key={i} label={RELOCATION_DOCUMENT_TYPES.find(dt => dt.value === d.type)?.label || 'Other'} value={d.name} />
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
      {step !== 9 && (
        <NavButtons step={step} accent={accent} onBack={back} onCancel={onCancel}
          onNext={next} onSubmit={handleSubmit} loading={loading}
          isLastStep={step === ALL_STEPS[ALL_STEPS.length - 1].id} />
      )}
    </div>
  );
}
