import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Loader } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  order_index: number;
}

export default function AdminServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error: err } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true });

      if (err) throw err;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setIsLoading(false);
    }
  };

  const addService = () => {
    const newService: Service = {
      id: `new-${Date.now()}`,
      title: 'New Service',
      description: '',
      icon: 'package',
      order_index: services.length,
    };
    setServices([...services, newService]);
  };

  const removeService = async (id: string) => {
    if (id.startsWith('new-')) {
      setServices(services.filter(s => s.id !== id));
    } else {
      try {
        const { error: err } = await supabase
          .from('services')
          .delete()
          .eq('id', id);

        if (err) throw err;
        setServices(services.filter(s => s.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete service');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      for (const service of services) {
        if (service.id.startsWith('new-')) {
          const { error: insertErr } = await supabase
            .from('services')
            .insert([{
              title: service.title,
              description: service.description,
              icon: service.icon,
              order_index: service.order_index,
            }]);

          if (insertErr) throw insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('services')
            .update({
              title: service.title,
              description: service.description,
              icon: service.icon,
              order_index: service.order_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', service.id);

          if (updateErr) throw updateErr;
        }
      }

      alert('Services updated successfully!');
      await fetchServices();
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
            <h1 className="text-2xl font-bold text-slate-900">Manage Services</h1>
          </div>
          <button
            onClick={addService}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
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
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={service.title}
                    onChange={(e) =>
                      setServices(services.map(s =>
                        s.id === service.id ? { ...s, title: e.target.value } : s
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={service.icon}
                    onChange={(e) =>
                      setServices(services.map(s =>
                        s.id === service.id ? { ...s, icon: e.target.value } : s
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={service.description}
                  onChange={(e) =>
                    setServices(services.map(s =>
                      s.id === service.id ? { ...s, description: e.target.value } : s
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              <button
                onClick={() => removeService(service.id)}
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
