import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Save, CheckCircle, Phone, FileText, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WhatsAppSettings {
  id: string;
  phone_number: string;
  delivery_message: string;
  logistics_message: string;
  is_enabled: boolean;
}

function buildWhatsAppUrl(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export default function AdminWhatsAppPage() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [form, setForm] = useState({
    phone_number: '',
    delivery_message: 'Hello! I would like to book a delivery. Please provide me with the details and pricing.',
    logistics_message: 'Hello! I would like to make a logistics request. Please provide me with information on your services.',
    is_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('whatsapp_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setSettings(data);
        setForm({
          phone_number: data.phone_number,
          delivery_message: data.delivery_message,
          logistics_message: data.logistics_message,
          is_enabled: data.is_enabled,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    if (!form.phone_number.trim()) {
      setError('WhatsApp phone number is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (settings?.id) {
        const { error: err } = await supabase
          .from('whatsapp_settings')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', settings.id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase
          .from('whatsapp_settings')
          .insert(form)
          .select()
          .single();
        if (err) throw err;
        setSettings(data);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const deliveryPreviewUrl = form.phone_number
    ? buildWhatsAppUrl(form.phone_number, form.delivery_message)
    : null;
  const logisticsPreviewUrl = form.phone_number
    ? buildWhatsAppUrl(form.phone_number, form.logistics_message)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">WhatsApp Booking</h1>
                <p className="text-gray-500 text-xs">Configure customer booking via WhatsApp</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle className="h-4 w-4" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4" /> Save Settings</>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Visibility toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Show on Homepage</p>
                  <p className="text-sm text-gray-500 mt-0.5">Toggle the WhatsApp booking section visibility for customers</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setForm(p => ({ ...p, is_enabled: !p.is_enabled })); setSaved(false); }}
                  className="flex items-center gap-2 transition-colors"
                >
                  {form.is_enabled ? (
                    <><ToggleRight className="h-8 w-8 text-green-500" /><span className="text-sm font-medium text-green-600">Enabled</span></>
                  ) : (
                    <><ToggleLeft className="h-8 w-8 text-gray-400" /><span className="text-sm font-medium text-gray-400">Disabled</span></>
                  )}
                </button>
              </div>
            </div>

            {/* Phone number */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-50 p-2 rounded-xl"><Phone className="h-5 w-5 text-green-600" /></div>
                <div>
                  <h2 className="font-bold text-gray-900">WhatsApp Number</h2>
                  <p className="text-gray-500 text-sm">Include country code, no spaces or symbols (e.g. 2348012345678)</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+</span>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={set('phone_number')}
                  placeholder="2348012345678"
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all font-mono"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-50 p-2 rounded-xl"><FileText className="h-5 w-5 text-green-600" /></div>
                <div>
                  <h2 className="font-bold text-gray-900">Pre-filled Messages</h2>
                  <p className="text-gray-500 text-sm">These messages auto-populate when customers tap the WhatsApp button</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Delivery Booking Message
                </label>
                <textarea
                  value={form.delivery_message}
                  onChange={set('delivery_message')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all resize-none"
                  placeholder="Message customers send when booking a delivery..."
                />
                {deliveryPreviewUrl && (
                  <a
                    href={deliveryPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium mt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Preview delivery link
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Logistics Request Message
                </label>
                <textarea
                  value={form.logistics_message}
                  onChange={set('logistics_message')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all resize-none"
                  placeholder="Message customers send when making a logistics request..."
                />
                {logisticsPreviewUrl && (
                  <a
                    href={logisticsPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium mt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Preview logistics link
                  </a>
                )}
              </div>
            </div>

            {/* Live preview */}
            {form.phone_number && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Homepage Preview</p>
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Customers will see two buttons:</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={deliveryPreviewUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Book a Delivery
                    </a>
                    <a
                      href={logisticsPreviewUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Logistics Request
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
