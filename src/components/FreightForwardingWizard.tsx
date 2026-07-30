import { useState, useMemo, useCallback } from 'react';
import {
  Truck, Plane, Ship, MapPin, Package, Boxes, Settings, FileText,
  CheckCircle, ArrowLeft, ArrowRight, Plus, Trash2, Globe, Home,
  Warehouse, Shield, Thermometer, AlertTriangle, Upload, ChevronDown,
  Navigation, ClipboardList, User, Mail, Phone, Calendar, X,
} from 'lucide-react';
import {
  type FreightFormData, EMPTY_FREIGHT, NIGERIAN_STATES, COUNTRIES,
  AIRPORTS, SEAPORTS, PACKAGING_OPTIONS, INCOTERMS, CONTAINER_SIZES,
  ADDITIONAL_SERVICES, SHIPPING_MODES, SERVICE_LEVELS,
  type CargoItem, type ShippingMode, type ServiceLevel, type Incoterm,
  type ContainerLoadType, type ContainerSize, type PackagingType,
} from '../lib/freightData';

const STEPS = [
  { id: 0, label: 'Shipment', icon: Navigation },
  { id: 1, label: 'Cargo', icon: Package },
  { id: 2, label: 'Details', icon: Settings },
  { id: 3, label: 'Container', icon: Boxes },
  { id: 4, label: 'Services', icon: ClipboardList },
  { id: 5, label: 'Contact', icon: User },
  { id: 6, label: 'Documents', icon: FileText },
  { id: 7, label: 'Review', icon: CheckCircle },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyCargo(): CargoItem {
  return { id: uid(), commodity: '', packaging: '', quantity: '', weight_kg: '', length_cm: '', width_cm: '', height_cm: '', stackable: false };
}

interface Props {
  onSubmit: (data: FreightFormData) => Promise<void>;
  loading: boolean;
  accentColor: 'orange' | 'blue';
  onCancel: () => void;
}

export default function FreightForwardingWizard({ onSubmit, loading, accentColor, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FreightFormData>(EMPTY_FREIGHT);
  const [error, setError] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);

  const accent = accentColor === 'orange'
    ? { ring: 'focus:ring-orange-500', border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', textDark: 'text-orange-700', btn: 'from-orange-500 to-red-500', btnHover: 'hover:from-orange-600 hover:to-red-600' }
    : { ring: 'focus:ring-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', textDark: 'text-blue-700', btn: 'from-blue-500 to-blue-600', btnHover: 'hover:from-blue-600 hover:to-blue-700' };

  const isInternational = data.shipmentScope === 'international';
  const isSea = data.shippingMode === 'sea';

  const update = useCallback((patch: Partial<FreightFormData>) => {
    setData(prev => {
      const next = { ...prev, ...patch };
      return next;
    });
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  }, []);

  const updateCargo = (id: string, patch: Partial<CargoItem>) => {
    setData(prev => ({
      ...prev,
      cargoItems: prev.cargoItems.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const addCargo = () => setData(prev => ({ ...prev, cargoItems: [...prev.cargoItems, emptyCargo()] }));
  const removeCargo = (id: string) => setData(prev => ({ ...prev, cargoItems: prev.cargoItems.filter(c => c.id !== id) }));

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
        if (!data.shipmentScope) return 'Please select a shipment scope (Domestic or International).';
        if (!data.shippingMode) return 'Please select a shipping mode.';
        if (isInternational && !data.shipmentDirection) return 'Please select Import or Export.';
        if (!data.serviceLevel) return 'Please select a service level.';
        if (!data.originCity) return 'Please enter the origin city.';
        if (!data.destCity) return 'Please enter the destination city.';
        if (isInternational && !data.originCountry) return 'Please select the origin country.';
        if (isInternational && !data.destCountry) return 'Please select the destination country.';
        if (!isInternational && !data.originState) return 'Please select the origin state.';
        if (!isInternational && !data.destState) return 'Please select the destination state.';
        if (isInternational && data.shippingMode === 'sea' && !data.originPort) return 'Please select an origin seaport.';
        if (isInternational && data.shippingMode === 'sea' && !data.destPort) return 'Please select a destination seaport.';
        return null;
      case 1:
        if (data.cargoItems.length === 0) return 'Please add at least one cargo item.';
        for (const c of data.cargoItems) {
          if (!c.commodity) return 'Each cargo item needs a commodity name.';
          if (!c.packaging) return 'Each cargo item needs a packaging type.';
          if (!c.quantity) return 'Each cargo item needs a quantity.';
        }
        return null;
      case 2:
        if (isInternational && !data.incoterm) return 'Please select Incoterms for international shipments.';
        return null;
      case 3:
        if (isSea && !data.containerLoad) return 'Please select FCL or LCL for sea freight.';
        if (isSea && data.containerLoad === 'FCL' && !data.containerSize) return 'Please select a container size.';
        if (isSea && data.containerLoad === 'FCL' && !data.containerCount) return 'Please enter the number of containers.';
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
    if (step === 1 && data.cargoItems.length === 0) {
      setData(prev => ({ ...prev, cargoItems: [emptyCargo()] }));
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => { setError(''); setStep(s => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    const err = validateStep(5);
    if (err) { setError(err); setStep(5); return; }
    setError('');
    await onSubmit(data);
  };

  const skipContainerStep = !isSea;
  const effectiveSteps = skipContainerStep ? STEPS.filter(s => s.id !== 3) : STEPS;

  const totalWeight = useMemo(() => {
    return data.cargoItems.reduce((sum, c) => sum + (parseFloat(c.weight_kg) || 0), 0);
  }, [data.cargoItems]);

  const totalQty = useMemo(() => {
    return data.cargoItems.reduce((sum, c) => sum + (parseInt(c.quantity) || 0), 0);
  }, [data.cargoItems]);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-sm">Freight Forwarding Request</h3>
          {autoSaved && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Auto-saved</span>}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          {effectiveSteps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id || (skipContainerStep && step >= 3 && i === effectiveSteps.findIndex(x => x.id === step));
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? `bg-gradient-to-r ${accent.btn} text-white` :
                    isDone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium ${isActive ? accent.textDark : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < effectiveSteps.length - 1 && <div className={`w-3 sm:w-6 h-0.5 mx-0.5 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        {/* STEP 0: Shipment Information */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Shipment Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Tell us about your shipment scope and mode</p>
            </div>

            {/* Shipment Scope */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Shipment Scope <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {([['domestic', 'Domestic (Within Nigeria)', Home], ['international', 'International', Globe]] as const).map(([val, label, Icon]) => (
                  <button key={val} type="button" onClick={() => update({
                    shipmentScope: val,
                    shipmentDirection: val === 'domestic' ? 'within_nigeria' : '',
                    originCountry: val === 'domestic' ? 'Nigeria' : '',
                    destCountry: val === 'domestic' ? 'Nigeria' : '',
                    originPort: '', destPort: '',
                    incoterm: '',
                    additionalServices: val === 'domestic' ? data.additionalServices.filter(s => s !== 'customs') : data.additionalServices,
                  })}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      data.shipmentScope === val ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.shipmentScope === val ? accent.bg : 'bg-gray-50'}`}>
                      <Icon className={`h-5 w-5 ${data.shipmentScope === val ? accent.text : 'text-gray-400'}`} />
                    </div>
                    <span className={`font-semibold text-sm ${data.shipmentScope === val ? accent.textDark : 'text-gray-700'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Shipping Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Shipping Mode <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SHIPPING_MODES.map(mode => {
                  const Icon = mode.icon === 'truck' ? Truck : mode.icon === 'plane' ? Plane : Ship;
                  return (
                    <button key={mode.value} type="button" onClick={() => update({ shippingMode: mode.value as ShippingMode, containerLoad: '', containerSize: '' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.shippingMode === mode.value ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-5 w-5 ${data.shippingMode === mode.value ? accent.text : 'text-gray-400'}`} />
                        <span className={`font-semibold text-sm ${data.shippingMode === mode.value ? accent.textDark : 'text-gray-800'}`}>{mode.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shipment Direction (International only) */}
            {isInternational && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Shipment Type <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {([['import', 'Import to Nigeria', 'Receiving goods into Nigeria'], ['export', 'Export from Nigeria', 'Sending goods out of Nigeria']] as const).map(([val, label, desc]) => (
                    <button key={val} type="button" onClick={() => update({ shipmentDirection: val as FreightFormData['shipmentDirection'] })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.shipmentDirection === val ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <p className={`font-semibold text-sm ${data.shipmentDirection === val ? accent.textDark : 'text-gray-800'}`}>{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Service Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICE_LEVELS.map(sl => (
                  <button key={sl.value} type="button" onClick={() => update({ serviceLevel: sl.value as ServiceLevel })}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      data.serviceLevel === sl.value ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <p className={`font-semibold text-sm ${data.serviceLevel === sl.value ? accent.textDark : 'text-gray-800'}`}>{sl.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Pickup Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Pickup Date</label>
              <div className="relative max-w-xs">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" value={data.preferredPickupDate} onChange={e => update({ preferredPickupDate: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
              </div>
            </div>

            {/* Origin & Destination */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Origin */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-700 text-sm">Origin / Pickup</h3>
                </div>
                {isInternational && (
                  <SearchableSelect label="Country" value={data.originCountry} onChange={v => update({ originCountry: v, originPort: '' })} options={COUNTRIES} accent={accent} />
                )}
                {!isInternational && (
                  <SearchableSelect label="State" value={data.originState} onChange={v => update({ originState: v })} options={NIGERIAN_STATES} accent={accent} />
                )}
                <TextField label="City" value={data.originCity} onChange={v => update({ originCity: v })} placeholder="e.g. Lagos" accent={accent} />
                {isInternational && data.shippingMode !== 'road' && (
                  <SearchableSelect
                    label={data.shippingMode === 'air' ? 'Airport (optional)' : 'Seaport'}
                    value={data.originPort}
                    onChange={v => update({ originPort: v })}
                    options={data.shippingMode === 'air' ? (AIRPORTS[data.originCountry] || []) : (SEAPORTS[data.originCountry] || [])}
                    accent={accent}
                    optional={data.shippingMode === 'air'}
                  />
                )}
                <TextField label="Pickup Address" value={data.originAddress} onChange={v => update({ originAddress: v })} placeholder="Street address (for Door services)" accent={accent} optional />
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-700 text-sm">Destination / Delivery</h3>
                </div>
                {isInternational && (
                  <SearchableSelect label="Country" value={data.destCountry} onChange={v => update({ destCountry: v, destPort: '' })} options={COUNTRIES} accent={accent} />
                )}
                {!isInternational && (
                  <SearchableSelect label="State" value={data.destState} onChange={v => update({ destState: v })} options={NIGERIAN_STATES} accent={accent} />
                )}
                <TextField label="City" value={data.destCity} onChange={v => update({ destCity: v })} placeholder="e.g. Abuja" accent={accent} />
                {isInternational && data.shippingMode !== 'road' && (
                  <SearchableSelect
                    label={data.shippingMode === 'air' ? 'Airport (optional)' : 'Seaport'}
                    value={data.destPort}
                    onChange={v => update({ destPort: v })}
                    options={data.shippingMode === 'air' ? (AIRPORTS[data.destCountry] || []) : (SEAPORTS[data.destCountry] || [])}
                    accent={accent}
                    optional={data.shippingMode === 'air'}
                  />
                )}
                <TextField label="Delivery Address" value={data.destAddress} onChange={v => update({ destAddress: v })} placeholder="Street address (for Door services)" accent={accent} optional />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Cargo Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Cargo Details</h2>
              <p className="text-gray-500 text-sm mt-0.5">Add each item you're shipping</p>
            </div>

            {data.cargoItems.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">No cargo items added yet</p>
                <button type="button" onClick={addCargo} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${accent.btn} transition-all`}>
                  <Plus className="h-4 w-4" /> Add First Cargo Item
                </button>
              </div>
            )}

            {data.cargoItems.map((cargo, idx) => (
              <div key={cargo.id} className="border border-gray-200 rounded-xl p-5 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg ${accent.bg} ${accent.text} flex items-center justify-center text-xs font-bold`}>{idx + 1}</span>
                    Cargo Item {idx + 1}
                  </h4>
                  {data.cargoItems.length > 1 && (
                    <button type="button" onClick={() => removeCargo(cargo.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField label="Commodity Name" value={cargo.commodity} onChange={v => updateCargo(cargo.id, { commodity: v })} placeholder="e.g. Electronics, Textiles" accent={accent} required />
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Packaging Type <span className="text-red-400">*</span></label>
                    <select value={cargo.packaging} onChange={e => updateCargo(cargo.id, { packaging: e.target.value as PackagingType })}
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all bg-white`}>
                      <option value="">Select packaging...</option>
                      {PACKAGING_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <TextField label="Quantity" value={cargo.quantity} onChange={v => updateCargo(cargo.id, { quantity: v })} placeholder="0" type="number" accent={accent} required />
                  <TextField label="Weight (kg)" value={cargo.weight_kg} onChange={v => updateCargo(cargo.id, { weight_kg: v })} placeholder="0" type="number" accent={accent} />
                  <TextField label="Length (cm)" value={cargo.length_cm} onChange={v => updateCargo(cargo.id, { length_cm: v })} placeholder="0" type="number" accent={accent} />
                  <TextField label="Width (cm)" value={cargo.width_cm} onChange={v => updateCargo(cargo.id, { width_cm: v })} placeholder="0" type="number" accent={accent} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                  <TextField label="Height (cm)" value={cargo.height_cm} onChange={v => updateCargo(cargo.id, { height_cm: v })} placeholder="0" type="number" accent={accent} />
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Stackable?</label>
                    <div className="flex gap-2">
                      {([['yes', true], ['no', false]] as const).map(([label, val]) => (
                        <button key={label} type="button" onClick={() => updateCargo(cargo.id, { stackable: val })}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                            cargo.stackable === val ? `${accent.border} ${accent.bg} ${accent.textDark}` : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {data.cargoItems.length > 0 && (
              <div className="flex items-center justify-between">
                <button type="button" onClick={addCargo} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all ${
                  accent.border
                } ${accent.bg} ${accent.textDark} hover:opacity-80`}>
                  <Plus className="h-4 w-4" /> Add Another Cargo
                </button>
                <div className="text-right text-sm text-gray-500">
                  <p>Total: <span className="font-bold text-gray-800">{totalQty} units</span> · <span className="font-bold text-gray-800">{totalWeight.toFixed(1)} kg</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Shipment Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Shipment Details</h2>
              <p className="text-gray-500 text-sm mt-0.5">Cargo characteristics and requirements</p>
            </div>

            {/* Incoterms (International only) */}
            {isInternational && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Incoterms <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INCOTERMS.map(term => (
                    <button key={term.value} type="button" onClick={() => update({ incoterm: term.value as Incoterm })}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        data.incoterm === term.value ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-sm ${data.incoterm === term.value ? accent.textDark : 'text-gray-800'}`}>{term.label}</span>
                        {data.incoterm === term.value && <CheckCircle className={`h-4 w-4 ${accent.text}`} />}
                      </div>
                      <p className="text-xs text-gray-500">{term.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle fields */}
            <div className="space-y-3">
              <ToggleRow icon={AlertTriangle} iconColor="text-red-500" bg="bg-red-50" label="Hazardous Cargo?" value={data.hazardous} onChange={v => update({ hazardous: v })} />
              <ToggleRow icon={Shield} iconColor="text-blue-500" bg="bg-blue-50" label="Cargo Insurance Required?" value={data.insuranceRequired} onChange={v => update({ insuranceRequired: v })} />
              <ToggleRow icon={Thermometer} iconColor="text-teal-500" bg="bg-teal-50" label="Temperature Controlled?" value={data.temperatureControlled} onChange={v => update({ temperatureControlled: v })} />
            </div>

            {/* Estimated Cargo Value */}
            <TextField label="Estimated Cargo Value (₦)" value={data.cargoValue} onChange={v => update({ cargoValue: v })} placeholder="e.g. 500,000" type="number" accent={accent} />
          </div>
        )}

        {/* STEP 3: Sea Freight Container */}
        {step === 3 && isSea && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Container Details</h2>
              <p className="text-gray-500 text-sm mt-0.5">Sea freight container configuration</p>
            </div>

            {/* FCL / LCL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Container Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {([['FCL', 'Full Container Load', 'You get a dedicated container'], ['LCL', 'Less than Container Load', 'Shared container — pay for the space you use']] as const).map(([val, label, desc]) => (
                  <button key={val} type="button" onClick={() => update({ containerLoad: val as ContainerLoadType, containerSize: '', containerCount: '' })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      data.containerLoad === val ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <p className={`font-bold text-sm ${data.containerLoad === val ? accent.textDark : 'text-gray-800'}`}>{val}</p>
                    <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Container size & count (FCL only) */}
            {data.containerLoad === 'FCL' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Container Size <span className="text-red-400">*</span></label>
                  <div className="space-y-2">
                    {CONTAINER_SIZES.map(cs => (
                      <button key={cs.value} type="button" onClick={() => update({ containerSize: cs.value as ContainerSize })}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          data.containerSize === cs.value ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}>
                        <span className={`font-semibold text-sm ${data.containerSize === cs.value ? accent.textDark : 'text-gray-700'}`}>{cs.label}</span>
                        {data.containerSize === cs.value && <CheckCircle className={`h-4 w-4 ${accent.text}`} />}
                      </button>
                    ))}
                  </div>
                </div>
                <TextField label="Number of Containers" value={data.containerCount} onChange={v => update({ containerCount: v })} placeholder="e.g. 3" type="number" accent={accent} required />
              </div>
            )}

            {data.containerLoad === 'LCL' && (
              <div className={`${accent.bg} rounded-xl p-4 border ${accent.border}`}>
                <div className="flex items-center gap-2">
                  <Boxes className={`h-5 w-5 ${accent.text}`} />
                  <p className={`text-sm font-semibold ${accent.textDark}`}>LCL — Shared Container</p>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-7">Your cargo will be consolidated with other shipments. You only pay for the volume/weight you use. No container size selection needed.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Additional Services */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Additional Services</h2>
              <p className="text-gray-500 text-sm mt-0.5">Select any extra services you need</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADDITIONAL_SERVICES.filter(s => !s.intlOnly || isInternational).map(svc => {
                const checked = data.additionalServices.includes(svc.value);
                return (
                  <button key={svc.value} type="button" onClick={() => toggleService(svc.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      checked ? `${accent.border} ${accent.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${checked ? accent.border : 'border-gray-300'}`}>
                      {checked && <CheckCircle className={`h-3.5 w-3.5 ${accent.text}`} />}
                    </div>
                    <span className={`font-semibold text-sm ${checked ? accent.textDark : 'text-gray-700'}`}>{svc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Contact Information */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Contact Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">How can we reach you about this request?</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Full Name" value={data.contactName} onChange={v => update({ contactName: v })} placeholder="John Doe" accent={accent} required icon={User} />
              <TextField label="Company Name" value={data.contactCompany} onChange={v => update({ contactCompany: v })} placeholder="Optional" accent={accent} optional icon={Warehouse} />
              <TextField label="Email" value={data.contactEmail} onChange={v => update({ contactEmail: v })} placeholder="you@example.com" type="email" accent={accent} required icon={Mail} />
              <TextField label="Phone Number" value={data.contactPhone} onChange={v => update({ contactPhone: v })} placeholder="+234 800 000 0000" type="tel" accent={accent} required icon={Phone} />
              <TextField label="WhatsApp Number" value={data.contactWhatsApp} onChange={v => update({ contactWhatsApp: v })} placeholder="Optional" type="tel" accent={accent} optional icon={Phone} />
            </div>
          </div>
        )}

        {/* STEP 6: Documents & Notes */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Additional Notes & Documents</h2>
              <p className="text-gray-500 text-sm mt-0.5">Any special instructions or supporting documents</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shipment Notes</label>
              <textarea value={data.shipmentNotes} onChange={e => update({ shipmentNotes: e.target.value })}
                placeholder="Any special instructions, handling requirements, or additional context..."
                rows={4}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all resize-none`} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Documents</label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${accent.border} ${accent.bg}`}>
                <Upload className={`h-8 w-8 ${accent.text} mx-auto mb-3`} />
                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag files here</p>
                <p className="text-xs text-gray-400 mb-4">Invoice, Packing List, Bill of Lading, Air Waybill, or other documents</p>
                <input type="file" multiple onChange={e => {
                  if (e.target.files) {
                    const names = Array.from(e.target.files).map(f => f.name);
                    update({ documentNames: [...data.documentNames, ...names] });
                  }
                }}
                  className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${accent.btn} cursor-pointer transition-all ${accent.btnHover}`}>
                  <Upload className="h-4 w-4" /> Choose Files
                </label>
              </div>

              {data.documentNames.length > 0 && (
                <div className="mt-3 space-y-2">
                  {data.documentNames.map((name, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" /> {name}
                      </span>
                      <button type="button" onClick={() => update({ documentNames: data.documentNames.filter((_, idx) => idx !== i) })}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">File names are recorded with your request. Our team will request the actual files when following up.</p>
            </div>
          </div>
        )}

        {/* STEP 7: Review */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Review Your Request</h2>
              <p className="text-gray-500 text-sm mt-0.5">Please confirm the details before submitting</p>
            </div>

            <div className="space-y-4">
              <ReviewSection title="Shipment Information" accent={accent}>
                <ReviewRow label="Shipment Scope" value={data.shipmentScope === 'domestic' ? 'Domestic (Within Nigeria)' : 'International'} />
                <ReviewRow label="Shipping Mode" value={SHIPPING_MODES.find(m => m.value === data.shippingMode)?.label || '—'} />
                {isInternational && <ReviewRow label="Shipment Type" value={data.shipmentDirection === 'import' ? 'Import to Nigeria' : data.shipmentDirection === 'export' ? 'Export from Nigeria' : '—'} />}
                <ReviewRow label="Service Type" value={SERVICE_LEVELS.find(s => s.value === data.serviceLevel)?.label || '—'} />
                {data.preferredPickupDate && <ReviewRow label="Preferred Pickup" value={new Date(data.preferredPickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />}
              </ReviewSection>

              <ReviewSection title="Origin & Destination" accent={accent}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Origin</p>
                    {isInternational && data.originCountry && <ReviewRow label="Country" value={data.originCountry} compact />}
                    {!isInternational && data.originState && <ReviewRow label="State" value={data.originState} compact />}
                    {data.originCity && <ReviewRow label="City" value={data.originCity} compact />}
                    {data.originPort && <ReviewRow label="Port/Airport" value={data.originPort} compact />}
                    {data.originAddress && <ReviewRow label="Address" value={data.originAddress} compact />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Destination</p>
                    {isInternational && data.destCountry && <ReviewRow label="Country" value={data.destCountry} compact />}
                    {!isInternational && data.destState && <ReviewRow label="State" value={data.destState} compact />}
                    {data.destCity && <ReviewRow label="City" value={data.destCity} compact />}
                    {data.destPort && <ReviewRow label="Port/Airport" value={data.destPort} compact />}
                    {data.destAddress && <ReviewRow label="Address" value={data.destAddress} compact />}
                  </div>
                </div>
              </ReviewSection>

              <ReviewSection title="Cargo Details" accent={accent}>
                {data.cargoItems.map((c, i) => (
                  <div key={c.id} className={`pb-2 ${i < data.cargoItems.length - 1 ? 'border-b border-gray-100 mb-2' : ''}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Item {i + 1}: {c.commodity}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <span className="text-gray-500">Packaging: <span className="text-gray-700">{PACKAGING_OPTIONS.find(p => p.value === c.packaging)?.label || '—'}</span></span>
                      <span className="text-gray-500">Qty: <span className="text-gray-700">{c.quantity || '—'}</span></span>
                      <span className="text-gray-500">Weight: <span className="text-gray-700">{c.weight_kg ? `${c.weight_kg} kg` : '—'}</span></span>
                      <span className="text-gray-500">Stackable: <span className="text-gray-700">{c.stackable ? 'Yes' : 'No'}</span></span>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Total Units: <span className="font-bold text-gray-800">{totalQty}</span></span>
                  <span className="text-sm text-gray-500">Total Weight: <span className="font-bold text-gray-800">{totalWeight.toFixed(1)} kg</span></span>
                </div>
              </ReviewSection>

              {isInternational && data.incoterm && (
                <ReviewSection title="Shipment Terms" accent={accent}>
                  <ReviewRow label="Incoterms" value={data.incoterm} />
                  {data.cargoValue && <ReviewRow label="Estimated Cargo Value" value={`₦${parseFloat(data.cargoValue).toLocaleString()}`} />}
                </ReviewSection>
              )}

              {(data.hazardous || data.insuranceRequired || data.temperatureControlled) && (
                <ReviewSection title="Cargo Requirements" accent={accent}>
                  {data.hazardous && <ReviewRow label="Hazardous" value="Yes" />}
                  {data.insuranceRequired && <ReviewRow label="Insurance Required" value="Yes" />}
                  {data.temperatureControlled && <ReviewRow label="Temperature Controlled" value="Yes" />}
                  {!isInternational && data.cargoValue && <ReviewRow label="Estimated Cargo Value" value={`₦${parseFloat(data.cargoValue).toLocaleString()}`} />}
                </ReviewSection>
              )}

              {isSea && data.containerLoad && (
                <ReviewSection title="Container" accent={accent}>
                  <ReviewRow label="Container Type" value={data.containerLoad} />
                  {data.containerLoad === 'FCL' && data.containerSize && <ReviewRow label="Container Size" value={CONTAINER_SIZES.find(c => c.value === data.containerSize)?.label || '—'} />}
                  {data.containerLoad === 'FCL' && data.containerCount && <ReviewRow label="Number of Containers" value={data.containerCount} />}
                </ReviewSection>
              )}

              {data.additionalServices.length > 0 && (
                <ReviewSection title="Additional Services" accent={accent}>
                  <div className="flex flex-wrap gap-2">
                    {data.additionalServices.map(s => (
                      <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${accent.bg} ${accent.textDark}`}>
                        {ADDITIONAL_SERVICES.find(a => a.value === s)?.label || s}
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
              </ReviewSection>

              {data.shipmentNotes && (
                <ReviewSection title="Notes" accent={accent}>
                  <p className="text-sm text-gray-600">{data.shipmentNotes}</p>
                </ReviewSection>
              )}

              {data.documentNames.length > 0 && (
                <ReviewSection title="Documents" accent={accent}>
                  {data.documentNames.map((n, i) => <ReviewRow key={i} label={`File ${i + 1}`} value={n} />)}
                </ReviewSection>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={step === 0 ? onCancel : back}
          className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
          <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < 7 ? (
          <button type="button" onClick={next}
            className={`flex items-center gap-2 bg-gradient-to-r ${accent.btn} text-white px-8 py-3 rounded-xl font-bold text-sm ${accent.btnHover} transition-all hover:shadow-lg`}>
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading}
            className={`flex items-center gap-2 bg-gradient-to-r ${accent.btn} text-white px-8 py-3 rounded-xl font-bold text-sm ${accent.btnHover} transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}>
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><CheckCircle className="h-4 w-4" /> Submit Request</>}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Helper Components ---

interface AccentType {
  ring: string; border: string; bg: string; text: string; textDark: string; btn: string; btnHover: string;
}

function TextField({ label, value, onChange, placeholder, type = 'text', accent, required, optional, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  accent: AccentType; required?: boolean; optional?: boolean; icon?: typeof MapPin;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}{optional && <span className="text-gray-400"> (optional)</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
      </div>
    </div>
  );
}

function SearchableSelect({ label, value, onChange, options, accent, optional }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; accent: AccentType; optional?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label} {optional && <span className="text-gray-400">(optional)</span>}
      </label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)}
          className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all text-left flex items-center justify-between bg-white ${!value && 'text-gray-400'}`}>
          <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || 'Select...'}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-gray-100">
                <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>
              <div className="overflow-y-auto flex-1">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No results found</p>
                ) : filtered.map(opt => (
                  <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${value === opt ? accent.bg + ' ' + accent.textDark + ' font-semibold' : 'text-gray-700'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, iconColor, bg, label, value, onChange }: {
  icon: typeof Shield; iconColor: string; bg: string; label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
        <span className="font-medium text-sm text-gray-700">{label}</span>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-all ${value ? 'bg-green-500' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${value ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );
}

function ReviewSection({ title, accent, children }: { title: string; accent: AccentType; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <h4 className={`font-semibold text-sm ${accent.textDark} mb-3 flex items-center gap-2`}>
        <div className={`w-1.5 h-4 rounded-full bg-gradient-to-b ${accent.btn}`} /> {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`flex gap-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="text-gray-400 flex-shrink-0 w-28">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
