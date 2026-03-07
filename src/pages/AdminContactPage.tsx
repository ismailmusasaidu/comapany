import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader } from 'lucide-react';

interface ContactInfo {
  id: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export default function AdminContactPage() {
  const navigate = useNavigate();
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    try {
      const { data, error: err } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (err) throw err;

      if (data) {
        setContact(data);
      } else {
        const { data: newContact, error: insertErr } = await supabase
          .from('contact_info')
          .insert([{}])
          .select()
          .single();

        if (insertErr) throw insertErr;
        setContact(newContact);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contact info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contact) return;

    setIsSaving(true);
    setError('');

    try {
      const { error: err } = await supabase
        .from('contact_info')
        .update({
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          hours: contact.hours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contact.id);

      if (err) throw err;
      alert('Contact info updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Edit Contact Info</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={contact?.email || ''}
                onChange={(e) => setContact(contact ? { ...contact, email: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={contact?.phone || ''}
                onChange={(e) => setContact(contact ? { ...contact, phone: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={contact?.address || ''}
              onChange={(e) => setContact(contact ? { ...contact, address: e.target.value } : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Hours
            </label>
            <textarea
              value={contact?.hours || ''}
              onChange={(e) => setContact(contact ? { ...contact, hours: e.target.value } : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="e.g., Mon-Fri: 9AM-5PM&#10;Sat: 10AM-3PM"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
