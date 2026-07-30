import { useState, useMemo } from 'react';
import {
  FileCheck, Package, User, Globe, Boxes, ClipboardList,
  Upload, FileText, CheckCircle, Plus, Trash2, AlertTriangle,
  Thermometer, Calendar, Ship, Plane, Truck, Download, ArrowRight,
} from 'lucide-react';
import {
  TextField, TextArea, SearchableSelect, SelectCard, ToggleRow, CheckboxPill,
  FileUpload, ReviewSection, ReviewRow, ProgressBar, NavButtons,
  type AccentTheme,
} from './wizardFormParts';
import {
  type CustomsFormData, EMPTY_CUSTOMS, PORTS_OF_ENTRY, COUNTRIES,
  PACKAGING_OPTIONS, CURRENCIES, CONTAINER_SIZES, CUSTOMS_SERVICES,
  CUSTOMS_DOCUMENT_TYPES, TRANSPORT_MODES, SHIPMENT_STATUSES,
  type CustomsCargoItem, type PackagingType, type ContainerLoadType, type ContainerSize,
} from '../lib/customsData';

const ALL_STEPS = [
  { id: 0, label: 'Clearance', icon: FileCheck },
  { id: 1, label: 'Importer', icon: User },
  { id: 2, label: 'Shipment', icon: Globe },
  { id: 3, label: 'Cargo', icon: Package },
  { id: 4, label: 'Container', icon: Boxes },
  { id: 5, label: 'Services', icon: ClipboardList },
  { id: 6, label: 'Documents', icon: Upload },
  { id: 7, label: 'Notes', icon: FileText },
  { id: 8, label: 'Review', icon: CheckCircle },
];

function uid() { return Math.random().toString(36).slice(2, 10); }
function emptyCargo(): CustomsCargoItem {
  return { id: uid(), commodity: '', hsCode: '', packaging: '', quantity: '', weightKg: '', cargoValue: '', currency: 'USD', hazardous: false, perishable: false, temperatureControlled: false };
}

interface Props {
  onSubmit: (data: CustomsFormData) => Promise<void>;
  loading: boolean;
  accentColor: 'orange' | 'blue';
  onCancel: () => void;
}

export default function CustomsClearanceWizard({ onSubmit, loading, accentColor, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CustomsFormData>(EMPTY_CUSTOMS);
  const [error, setError] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);

  const accent: AccentTheme = accentColor === 'orange'
    ? { ring: 'focus:ring-orange-500', border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', textDark: 'text-orange-700', btn: 'from-orange-500 to-red-500', btnHover: 'hover:from-orange-600 hover:to-red-600' }
    : { ring: 'focus:ring-blue-500', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', textDark: 'text-blue-700', btn: 'from-blue-500 to-blue-600', btnHover: 'hover:from-blue-600 hover:to-blue-700' };

  const isSea = data.transportMode === 'sea';
  const isImport = data.clearanceType === 'import';

  const update = (patch: Partial<CustomsFormData>) => {
    setData(prev => ({ ...prev, ...patch }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const updateCargo = (id: string, patch: Partial<CustomsCargoItem>) => {
    setData(prev => ({ ...prev, cargoItems: prev.cargoItems.map(c => c.id === id ? { ...c, ...patch } : c) }));
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 1500);
  };

  const addCargo = () => setData(prev => ({ ...prev, cargoItems: [...prev.cargoItems, emptyCargo()] }));
  const removeCargo = (id: string) => setData(prev => ({ ...prev, cargoItems: prev.cargoItems.filter(c => c.id !== id) }));

  const toggleService = (val: string) => {
    setData(prev => ({
      ...prev,
      requiredServices: prev.requiredServices.includes(val)
        ? prev.requiredServices.filter(s => s !== val)
        : [...prev.requiredServices, val],
    }));
  };

  // Steps: skip container (id 4) if not sea freight
  const visibleSteps = useMemo(() => {
    if (!isSea) return ALL_STEPS.filter(s => s.id !== 4);
    return ALL_STEPS;
  }, [isSea]);

  // Map actual step to position in visibleSteps for progress display
  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0:
        if (!data.clearanceType) return 'Please select a clearance type (Import or Export).';
        if (!data.transportMode) return 'Please select a transport mode.';
        if (!data.shipmentStatus) return 'Please select the shipment status.';
        if (!data.portOfEntry) return 'Please select a port of entry/exit.';
        return null;
      case 1:
        if (!data.fullName) return 'Please enter the importer/exporter full name.';
        if (!data.email) return 'Please enter an email address.';
        if (!data.phone) return 'Please enter a phone number.';
        return null;
      case 2:
        if (!data.countryOrigin) return 'Please select the country of origin.';
        if (!data.countryDestination) return 'Please select the country of destination.';
        if (!data.supplierConsignee) return 'Please enter the supplier/consignee name.';
        return null;
      case 3:
        if (data.cargoItems.length === 0) return 'Please add at least one cargo item.';
        for (const c of data.cargoItems) {
          if (!c.commodity) return 'Each cargo item needs a commodity name.';
          if (!c.packaging) return 'Each cargo item needs a packaging type.';
          if (!c.quantity) return 'Each cargo item needs a quantity.';
        }
        return null;
      case 4:
        if (isSea && !data.containerLoad) return 'Please select FCL or LCL for sea freight.';
        if (isSea && data.containerLoad === 'FCL' && !data.containerSize) return 'Please select a container size.';
        if (isSea && data.containerLoad === 'FCL' && !data.containerCount) return 'Please enter the number of containers.';
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    if (step === 2 && data.cargoItems.length === 0) {
      setData(prev => ({ ...prev, cargoItems: [emptyCargo()] }));
    }
    // Skip container step if not sea
    let nextStep = step + 1;
    if (nextStep === 4 && !isSea) nextStep = 5;
    setStep(nextStep);
  };

  const back = () => {
    setError('');
    let prevStep = step - 1;
    if (prevStep === 4 && !isSea) prevStep = 3;
    setStep(Math.max(prevStep, 0));
  };

  const handleSubmit = async () => {
    const err = validateStep(1);
    if (err) { setError(err); setStep(1); return; }
    setError('');
    await onSubmit(data);
  };

  const totalWeight = useMemo(() => data.cargoItems.reduce((s, c) => s + (parseFloat(c.weightKg) || 0), 0), [data.cargoItems]);
  const totalQty = useMemo(() => data.cargoItems.reduce((s, c) => s + (parseInt(c.quantity) || 0), 0), [data.cargoItems]);
  const totalValue = useMemo(() => data.cargoItems.reduce((s, c) => s + (parseFloat(c.cargoValue) || 0), 0), [data.cargoItems]);
  const primaryCurrency = data.cargoItems[0]?.currency || 'USD';

  const availableStatuses = SHIPMENT_STATUSES.filter(s =>
    (isImport && !s.exportOnly) || (!isImport && !s.importOnly)
  );

  return (
    <div className="space-y-6">
      <ProgressBar steps={visibleSteps} currentStep={step} accent={accent} autoSaved={autoSaved} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        {/* STEP 0: Clearance Information */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Clearance Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Tell us about the customs clearance you need</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Clearance Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {([['import', 'Import Clearance', 'Clearing goods arriving into Nigeria', Download],
                   ['export', 'Export Clearance', 'Clearing goods leaving Nigeria', ArrowRight]] as const).map(([val, label, desc, Icon]) => (
                  <SelectCard key={val} active={data.clearanceType === val} accent={accent} icon={Icon as unknown as typeof FileCheck}
                    title={label} desc={desc}
                    onClick={() => update({ clearanceType: val as CustomsFormData['clearanceType'], shipmentStatus: '' })} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Transport Mode <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TRANSPORT_MODES.map(mode => {
                  const Icon = mode.value === 'air' ? Plane : mode.value === 'sea' ? Ship : Truck;
                  return (
                    <SelectCard key={mode.value} active={data.transportMode === mode.value} accent={accent} icon={Icon}
                      title={mode.label} desc={mode.desc} compact
                      onClick={() => update({ transportMode: mode.value as CustomsFormData['transportMode'], containerLoad: '', containerSize: '' })} />
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Shipment Status <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableStatuses.map(st => (
                  <SelectCard key={st.value} active={data.shipmentStatus === st.value} accent={accent}
                    title={st.label} desc={st.desc} compact
                    onClick={() => update({ shipmentStatus: st.value as CustomsFormData['shipmentStatus'] })} />
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <SearchableSelect label="Port of Entry / Exit" value={data.portOfEntry}
                onChange={v => update({ portOfEntry: v })} options={PORTS_OF_ENTRY} accent={accent} allowOther />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {isImport ? 'Expected Arrival Date' : 'Expected Departure Date'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={data.expectedDate} onChange={e => update({ expectedDate: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Importer / Exporter Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Importer / Exporter Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Who is receiving or sending the goods?</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Full Name" value={data.fullName} onChange={v => update({ fullName: v })} placeholder="John Doe" accent={accent} required />
              <TextField label="Company Name" value={data.companyName} onChange={v => update({ companyName: v })} placeholder="Optional" accent={accent} optional />
              <TextField label="Email Address" value={data.email} onChange={v => update({ email: v })} placeholder="you@example.com" type="email" accent={accent} required />
              <TextField label="Phone Number" value={data.phone} onChange={v => update({ phone: v })} placeholder="+234 800 000 0000" type="tel" accent={accent} required />
              <TextField label="WhatsApp Number" value={data.whatsapp} onChange={v => update({ whatsapp: v })} placeholder="Optional" type="tel" accent={accent} optional />
            </div>

            <div className="pt-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">Business Details <span className="text-gray-400 font-normal">(optional)</span></p>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="RC Number" value={data.rcNumber} onChange={v => update({ rcNumber: v })} placeholder="e.g. RC1234567" accent={accent} optional />
                <TextField label="TIN" value={data.tin} onChange={v => update({ tin: v })} placeholder="Tax Identification Number" accent={accent} optional />
              </div>
              <div className="mt-4">
                <TextField label="Business Address" value={data.businessAddress} onChange={v => update({ businessAddress: v })} placeholder="Full business address" accent={accent} optional />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Shipment Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Shipment Details</h2>
              <p className="text-gray-500 text-sm mt-0.5">Where are the goods coming from and going to?</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <SearchableSelect label="Country of Origin" value={data.countryOrigin} onChange={v => update({ countryOrigin: v })} options={COUNTRIES} accent={accent} />
              <SearchableSelect label="Country of Destination" value={data.countryDestination} onChange={v => update({ countryDestination: v })} options={COUNTRIES} accent={accent} />
              <TextField label="Supplier / Consignee Name" value={data.supplierConsignee} onChange={v => update({ supplierConsignee: v })} placeholder="Name of supplier or consignee" accent={accent} required />
              <TextField label="Commercial Invoice Number" value={data.invoiceNumber} onChange={v => update({ invoiceNumber: v })} placeholder="Optional" accent={accent} optional />
            </div>
          </div>
        )}

        {/* STEP 3: Cargo Information */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Cargo Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Add each item in your shipment</p>
            </div>

            {data.cargoItems.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">No cargo items added yet</p>
                <button type="button" onClick={addCargo}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${accent.btn} transition-all`}>
                  <Plus className="h-4 w-4" /> Add First Cargo Item
                </button>
              </div>
            )}

            {data.cargoItems.map((cargo, idx) => (
              <div key={cargo.id} className="border border-gray-200 rounded-xl p-5 space-y-4">
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
                  <TextField label="Commodity Name" value={cargo.commodity} onChange={v => updateCargo(cargo.id, { commodity: v })} placeholder="e.g. Electronics" accent={accent} required />
                  <TextField label="HS Code" value={cargo.hsCode} onChange={v => updateCargo(cargo.id, { hsCode: v })} placeholder="e.g. 8517.62.00" accent={accent} optional />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Packaging <span className="text-red-400">*</span></label>
                    <select value={cargo.packaging} onChange={e => updateCargo(cargo.id, { packaging: e.target.value as PackagingType })}
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all bg-white`}>
                      <option value="">Select...</option>
                      {PACKAGING_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <TextField label="Quantity" value={cargo.quantity} onChange={v => updateCargo(cargo.id, { quantity: v })} placeholder="0" type="number" accent={accent} required />
                  <TextField label="Total Weight (kg)" value={cargo.weightKg} onChange={v => updateCargo(cargo.id, { weightKg: v })} placeholder="0" type="number" accent={accent} />
                  <TextField label="Cargo Value" value={cargo.cargoValue} onChange={v => updateCargo(cargo.id, { cargoValue: v })} placeholder="0" type="number" accent={accent} />
                </div>

                <div className="max-w-xs">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Currency</label>
                  <select value={cargo.currency} onChange={e => updateCargo(cargo.id, { currency: e.target.value })}
                    className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all bg-white`}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <ToggleRow icon={AlertTriangle} iconColor="text-red-500" bg="bg-red-50" label="Hazardous Goods" value={cargo.hazardous} onChange={v => updateCargo(cargo.id, { hazardous: v })} />
                  <ToggleRow icon={Package} iconColor="text-orange-500" bg="bg-orange-50" label="Perishable Goods" value={cargo.perishable} onChange={v => updateCargo(cargo.id, { perishable: v })} />
                  <ToggleRow icon={Thermometer} iconColor="text-teal-500" bg="bg-teal-50" label="Temperature Controlled" value={cargo.temperatureControlled} onChange={v => updateCargo(cargo.id, { temperatureControlled: v })} />
                </div>
              </div>
            ))}

            {data.cargoItems.length > 0 && (
              <div className="flex items-center justify-between">
                <button type="button" onClick={addCargo}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-dashed transition-all ${accent.border} ${accent.bg} ${accent.textDark} hover:opacity-80`}>
                  <Plus className="h-4 w-4" /> Add Another Cargo
                </button>
                <div className="text-right text-sm text-gray-500">
                  <p>Total: <span className="font-bold text-gray-800">{totalQty} units</span> · <span className="font-bold text-gray-800">{totalWeight.toFixed(1)} kg</span> · <span className="font-bold text-gray-800">{totalValue.toLocaleString()} {primaryCurrency}</span></p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Container Information (Sea only) */}
        {step === 4 && isSea && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Container Information</h2>
              <p className="text-gray-500 text-sm mt-0.5">Sea freight container details</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Shipment Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {([['FCL', 'Full Container Load', 'Dedicated container'], ['LCL', 'Less than Container Load', 'Shared container']] as const).map(([val, label, desc]) => (
                  <SelectCard key={val} active={data.containerLoad === val} accent={accent}
                    title={val} desc={`${label} — ${desc}`} compact
                    onClick={() => update({ containerLoad: val as ContainerLoadType, containerSize: '', containerCount: '' })} />
                ))}
              </div>
            </div>

            {data.containerLoad === 'FCL' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Container Size <span className="text-red-400">*</span></label>
                  <div className="space-y-2">
                    {CONTAINER_SIZES.map(cs => (
                      <SelectCard key={cs.value} active={data.containerSize === cs.value} accent={accent}
                        title={cs.label} compact onClick={() => update({ containerSize: cs.value as ContainerSize })} />
                    ))}
                  </div>
                </div>
                <TextField label="Number of Containers" value={data.containerCount} onChange={v => update({ containerCount: v })} placeholder="e.g. 3" type="number" accent={accent} required />
              </div>
            )}

            {data.containerLoad && (
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="Container Number" value={data.containerNumber} onChange={v => update({ containerNumber: v })} placeholder="e.g. TGHU1234567" accent={accent} optional />
                <TextField label="Seal Number" value={data.sealNumber} onChange={v => update({ sealNumber: v })} placeholder="e.g. 123456" accent={accent} optional />
              </div>
            )}

            {data.containerLoad === 'LCL' && (
              <div className={`${accent.bg} rounded-xl p-4 border ${accent.border}`}>
                <div className="flex items-center gap-2">
                  <Boxes className={`h-5 w-5 ${accent.text}`} />
                  <p className={`text-sm font-semibold ${accent.textDark}`}>LCL — Shared Container</p>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-7">Your cargo will be consolidated with other shipments. Container and seal numbers will be assigned by the shipping line.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Required Customs Services */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Required Customs Services</h2>
              <p className="text-gray-500 text-sm mt-0.5">Select the customs services you need</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CUSTOMS_SERVICES.map(svc => (
                <CheckboxPill key={svc.value} checked={data.requiredServices.includes(svc.value)} accent={accent}
                  label={svc.label} onClick={() => toggleService(svc.value)} />
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Document Upload */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Document Upload</h2>
              <p className="text-gray-500 text-sm mt-0.5">Upload supporting documents for customs processing</p>
            </div>
            <FileUpload accent={accent} documentTypes={CUSTOMS_DOCUMENT_TYPES}
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
              placeholder="Special instructions, customs requirements, urgent handling notes, etc..."
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
              <ReviewSection title="Clearance Information" accent={accent}>
                <ReviewRow label="Clearance Type" value={data.clearanceType === 'import' ? 'Import Clearance' : 'Export Clearance'} />
                <ReviewRow label="Transport Mode" value={TRANSPORT_MODES.find(m => m.value === data.transportMode)?.label || '—'} />
                <ReviewRow label="Shipment Status" value={SHIPMENT_STATUSES.find(s => s.value === data.shipmentStatus)?.label || '—'} />
                <ReviewRow label="Port" value={data.portOfEntry || '—'} />
                {data.expectedDate && <ReviewRow label="Expected Date" value={new Date(data.expectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />}
              </ReviewSection>

              <ReviewSection title="Importer / Exporter" accent={accent}>
                <ReviewRow label="Name" value={data.fullName} />
                {data.companyName && <ReviewRow label="Company" value={data.companyName} />}
                <ReviewRow label="Email" value={data.email} />
                <ReviewRow label="Phone" value={data.phone} />
                {data.whatsapp && <ReviewRow label="WhatsApp" value={data.whatsapp} />}
                {data.rcNumber && <ReviewRow label="RC Number" value={data.rcNumber} />}
                {data.tin && <ReviewRow label="TIN" value={data.tin} />}
                {data.businessAddress && <ReviewRow label="Address" value={data.businessAddress} />}
              </ReviewSection>

              <ReviewSection title="Shipment Details" accent={accent}>
                <ReviewRow label="Origin" value={data.countryOrigin || '—'} />
                <ReviewRow label="Destination" value={data.countryDestination || '—'} />
                <ReviewRow label="Supplier / Consignee" value={data.supplierConsignee || '—'} />
                {data.invoiceNumber && <ReviewRow label="Invoice No." value={data.invoiceNumber} />}
              </ReviewSection>

              <ReviewSection title="Cargo Information" accent={accent}>
                {data.cargoItems.map((c, i) => (
                  <div key={c.id} className={`pb-2 ${i < data.cargoItems.length - 1 ? 'border-b border-gray-100 mb-2' : ''}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Item {i + 1}: {c.commodity}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <span className="text-gray-500">Packaging: <span className="text-gray-700">{PACKAGING_OPTIONS.find(p => p.value === c.packaging)?.label || '—'}</span></span>
                      <span className="text-gray-500">Qty: <span className="text-gray-700">{c.quantity || '—'}</span></span>
                      <span className="text-gray-500">Weight: <span className="text-gray-700">{c.weightKg ? `${c.weightKg} kg` : '—'}</span></span>
                      <span className="text-gray-500">Value: <span className="text-gray-700">{c.cargoValue ? `${c.cargoValue} ${c.currency}` : '—'}</span></span>
                    </div>
                    {c.hsCode && <p className="text-xs text-gray-500 mt-1">HS Code: <span className="text-gray-700">{c.hsCode}</span></p>}
                    {(c.hazardous || c.perishable || c.temperatureControlled) && (
                      <div className="flex gap-2 mt-1">
                        {c.hazardous && <span className="text-xs text-red-600">⚠ Hazardous</span>}
                        {c.perishable && <span className="text-xs text-orange-600">Perishable</span>}
                        {c.temperatureControlled && <span className="text-xs text-teal-600">Temp Controlled</span>}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Total: <span className="font-bold text-gray-800">{totalQty} units · {totalWeight.toFixed(1)} kg · {totalValue.toLocaleString()} {primaryCurrency}</span></span>
                </div>
              </ReviewSection>

              {isSea && data.containerLoad && (
                <ReviewSection title="Container" accent={accent}>
                  <ReviewRow label="Shipment Type" value={data.containerLoad} />
                  {data.containerLoad === 'FCL' && data.containerSize && <ReviewRow label="Container Size" value={CONTAINER_SIZES.find(c => c.value === data.containerSize)?.label || '—'} />}
                  {data.containerLoad === 'FCL' && data.containerCount && <ReviewRow label="Containers" value={data.containerCount} />}
                  {data.containerNumber && <ReviewRow label="Container No." value={data.containerNumber} />}
                  {data.sealNumber && <ReviewRow label="Seal No." value={data.sealNumber} />}
                </ReviewSection>
              )}

              {data.requiredServices.length > 0 && (
                <ReviewSection title="Required Services" accent={accent}>
                  <div className="flex flex-wrap gap-2">
                    {data.requiredServices.map(s => (
                      <span key={s} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${accent.bg} ${accent.textDark}`}>
                        {CUSTOMS_SERVICES.find(c => c.value === s)?.label || s}
                      </span>
                    ))}
                  </div>
                </ReviewSection>
              )}

              {data.documents.length > 0 && (
                <ReviewSection title="Documents Uploaded" accent={accent}>
                  {data.documents.map((d, i) => (
                    <ReviewRow key={i} label={CUSTOMS_DOCUMENT_TYPES.find(dt => dt.value === d.type)?.label || 'Other'} value={d.name} />
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
          isLastStep={step === visibleSteps[visibleSteps.length - 1].id} />
      )}
    </div>
  );
}
