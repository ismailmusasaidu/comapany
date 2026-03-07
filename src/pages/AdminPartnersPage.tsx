import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Loader } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string;
  description: string;
  order_index: number;
}

export default function AdminPartnersPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error: err } = await supabase
        .from('partners')
        .select('*')
        .order('order_index', { ascending: true });

      if (err) throw err;
      setPartners(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch partners');
    } finally {
      setIsLoading(false);
    }
  };

  const addPartner = () => {
    const newPartner: Partner = {
      id: `new-${Date.now()}`,
      name: 'New Partner',
      logo_url: '',
      website_url: '',
      description: '',
      order_index: partners.length,
    };
    setPartners([...partners, newPartner]);
  };

  const removePartner = async (id: string) => {
    if (id.startsWith('new-')) {
      setPartners(partners.filter(p => p.id !== id));
    } else {
      try {
        const { error: err } = await supabase
          .from('partners')
          .delete()
          .eq('id', id);

        if (err) throw err;
        setPartners(partners.filter(p => p.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete partner');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      for (const partner of partners) {
        if (partner.id.startsWith('new-')) {
          const { error: insertErr } = await supabase
            .from('partners')
            .insert([{
              name: partner.name,
              logo_url: partner.logo_url,
              website_url: partner.website_url,
              description: partner.description,
              order_index: partner.order_index,
            }]);

          if (insertErr) throw insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('partners')
            .update({
              name: partner.name,
              logo_url: partner.logo_url,
              website_url: partner.website_url,
              description: partner.description,
              order_index: partner.order_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', partner.id);

          if (updateErr) throw updateErr;
        }
      }

      alert('Partners updated successfully!');
      await fetchPartners();
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Manage Partners</h1>
          </div>
          <button
            onClick={addPartner}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={partner.name}
                    onChange={(e) =>
                      setPartners(partners.map(p =>
                        p.id === partner.id ? { ...p, name: e.target.value } : p
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={partner.website_url}
                    onChange={(e) =>
                      setPartners(partners.map(p =>
                        p.id === partner.id ? { ...p, website_url: e.target.value } : p
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={partner.logo_url}
                  onChange={(e) =>
                    setPartners(partners.map(p =>
                      p.id === partner.id ? { ...p, logo_url: e.target.value } : p
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={partner.description}
                  onChange={(e) =>
                    setPartners(partners.map(p =>
                      p.id === partner.id ? { ...p, description: e.target.value } : p
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              <button
                onClick={() => removePartner(partner.id)}
                className="flex items-center space-x-2 text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove</span>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
