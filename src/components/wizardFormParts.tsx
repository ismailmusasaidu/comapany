import { useState } from 'react';
import { ChevronDown, CheckCircle, X } from 'lucide-react';

export interface AccentTheme {
  ring: string;
  border: string;
  bg: string;
  text: string;
  textDark: string;
  btn: string;
  btnHover: string;
}

// --- TextField ---

export function TextField({ label, value, onChange, placeholder, type = 'text', accent, required, optional, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  accent: AccentTheme; required?: boolean; optional?: boolean; icon?: typeof ChevronDown;
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

// --- TextArea ---

export function TextArea({ label, value, onChange, placeholder, accent, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  accent: AccentTheme; rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all resize-none`} />
    </div>
  );
}

// --- SearchableSelect ---

export function SearchableSelect({ label, value, onChange, options, accent, optional, allowOther, onOther }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; accent: AccentTheme; optional?: boolean; allowOther?: boolean; onOther?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setSearch('');
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      onChange(otherValue.trim());
      if (onOther) onOther(otherValue.trim());
    }
    setShowOtherInput(false);
    setOpen(false);
    setOtherValue('');
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label} {optional && <span className="text-gray-400">(optional)</span>}
      </label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)}
          className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent text-sm transition-all text-left flex items-center justify-between bg-white`}>
          <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || 'Select...'}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setShowOtherInput(false); }} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-gray-100">
                <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>
              <div className="overflow-y-auto flex-1">
                {filtered.length === 0 && !allowOther ? (
                  <p className="text-sm text-gray-400 text-center py-4">No results found</p>
                ) : (
                  filtered.map(opt => (
                    <button key={opt} type="button" onClick={() => handleSelect(opt)}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${value === opt ? accent.bg + ' ' + accent.textDark + ' font-semibold' : 'text-gray-700'}`}>
                      {opt}
                    </button>
                  ))
                )}
                {allowOther && (
                  <div className="border-t border-gray-100 p-2">
                    {showOtherInput ? (
                      <div className="flex gap-2">
                        <input autoFocus type="text" value={otherValue} onChange={e => setOtherValue(e.target.value)}
                          placeholder="Enter custom value..."
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleOtherSubmit())}
                          className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                        <button type="button" onClick={handleOtherSubmit}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${accent.btn}`}>
                          Add
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowOtherInput(true)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-2">
                        + Add custom value...
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- SelectCard (selectable card for single-choice) ---

export function SelectCard({ active, accent, onClick, icon: Icon, title, desc, compact }: {
  active: boolean; accent: AccentTheme; onClick: () => void; icon?: typeof ChevronDown;
  title: string; desc?: string; compact?: boolean;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all w-full ${active ? accent.border + ' ' + accent.bg : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? accent.bg : 'bg-gray-50'}`}>
            <Icon className={`h-5 w-5 ${active ? accent.text : 'text-gray-400'}`} />
          </div>
        )}
        <span className={`font-semibold text-sm ${active ? accent.textDark : 'text-gray-800'}`}>{title}</span>
      </div>
      {desc && <p className={`text-xs ${compact ? '' : 'mt-0.5'} text-gray-500 ${Icon ? 'ml-11' : ''}`}>{desc}</p>}
    </button>
  );
}

// --- ToggleRow ---

export function ToggleRow({ icon: Icon, iconColor, bg, label, value, onChange }: {
  icon: typeof CheckCircle; iconColor: string; bg: string; label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
        <span className="font-medium text-sm text-gray-700">{label}</span>
      </div>
      <button type="button" onClick={() => onChange(!value)} role="switch" aria-checked={value}
        className={`relative w-12 h-6 rounded-full transition-all ${value ? 'bg-green-500' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${value ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );
}

// --- CheckboxPill (multi-select pill) ---

export function CheckboxPill({ checked, accent, onClick, label, icon: Icon }: {
  checked: boolean; accent: AccentTheme; onClick: () => void; label: string; icon?: typeof CheckCircle;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 w-full ${checked ? accent.border + ' ' + accent.bg : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${checked ? accent.border : 'border-gray-300'}`}>
        {checked && <CheckCircle className={`h-3.5 w-3.5 ${accent.text}`} />}
      </div>
      {Icon && <Icon className={`h-4 w-4 ${checked ? accent.text : 'text-gray-400'}`} />}
      <span className={`font-semibold text-sm ${checked ? accent.textDark : 'text-gray-700'}`}>{label}</span>
    </button>
  );
}

// --- FileUpload ---

export function FileUpload({ accent, documentTypes, files, onAddFiles, onRemoveFile }: {
  accent: AccentTheme;
  documentTypes: { value: string; label: string }[];
  files: { name: string; type: string }[];
  onAddFiles: (names: string[], type: string) => void;
  onRemoveFile: (idx: number) => void;
}) {
  const [selectedType, setSelectedType] = useState('');
  const inputId = 'file-upload-' + Math.random().toString(36).slice(2, 8);

  return (
    <div className="space-y-3">
      <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${accent.border} ${accent.bg}`}>
        <div className={`w-12 h-12 ${accent.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
          <svg className={`h-6 w-6 ${accent.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">Upload Documents</p>
        <p className="text-xs text-gray-400 mb-3">PDF, DOCX, JPG or PNG · Multiple files allowed</p>

        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 max-w-xs w-full">
            <option value="">Select document type...</option>
            {documentTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden" id={inputId}
            onChange={e => {
              if (e.target.files) {
                const names = Array.from(e.target.files).map(f => f.name);
                onAddFiles(names, selectedType || 'other');
                e.target.value = '';
              }
            }} />
          <label htmlFor={inputId}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${accent.btn} cursor-pointer transition-all ${accent.btnHover} whitespace-nowrap`}>
            Choose Files
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 ${accent.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <svg className={`h-4 w-4 ${accent.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{documentTypes.find(d => d.value === f.type)?.label || 'Other Document'}</p>
                </div>
              </div>
              <button type="button" onClick={() => onRemoveFile(i)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- ReviewSection ---

export function ReviewSection({ title, accent, children }: { title: string; accent: AccentTheme; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <h4 className={`font-semibold text-sm ${accent.textDark} mb-3 flex items-center gap-2`}>
        <div className={`w-1.5 h-4 rounded-full bg-gradient-to-b ${accent.btn}`} /> {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

// --- ReviewRow ---

export function ReviewRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`flex gap-3 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="text-gray-400 flex-shrink-0 w-28">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

// --- ProgressBar ---

export function ProgressBar({ steps, currentStep, accent, autoSaved }: {
  steps: { id: number; label: string; icon: typeof ChevronDown }[];
  currentStep: number; accent: AccentTheme; autoSaved: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">Request Wizard</h3>
        {autoSaved && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Auto-saved</span>}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
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
              {i < steps.length - 1 && <div className={`w-3 sm:w-6 h-0.5 mx-0.5 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- NavButtons ---

export function NavButtons({ step, accent, onBack, onCancel, onNext, onSubmit, loading, isLastStep, nextLabel = 'Continue', submitLabel = 'Submit Request' }: {
  step: number; accent: AccentTheme; onBack: () => void; onCancel: () => void; onNext: () => void; onSubmit: () => void; loading: boolean; isLastStep: boolean; nextLabel?: string; submitLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={step === 0 ? onCancel : onBack}
        className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        {step === 0 ? 'Cancel' : 'Back'}
      </button>
      {!isLastStep ? (
        <button type="button" onClick={onNext}
          className={`flex items-center gap-2 bg-gradient-to-r ${accent.btn} text-white px-8 py-3 rounded-xl font-bold text-sm ${accent.btnHover} transition-all hover:shadow-lg`}>
          {nextLabel} <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      ) : (
        <button type="button" onClick={onSubmit} disabled={loading}
          className={`flex items-center gap-2 bg-gradient-to-r ${accent.btn} text-white px-8 py-3 rounded-xl font-bold text-sm ${accent.btnHover} transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}>
          {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><CheckCircle className="h-4 w-4" /> {submitLabel}</>}
        </button>
      )}
    </div>
  );
}
