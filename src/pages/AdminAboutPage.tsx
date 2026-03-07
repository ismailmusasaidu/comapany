import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader } from 'lucide-react';

interface AboutData {
  id: string;
  title: string;
  description: string;
  mission: string;
  vision: string;
}

export default function AdminAboutPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AboutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const { data: aboutData, error: err } = await supabase
        .from('about_section')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (err) throw err;

      if (aboutData) {
        setData(aboutData);
      } else {
        const { data: newAbout, error: insertErr } = await supabase
          .from('about_section')
          .insert([{}])
          .select()
          .single();

        if (insertErr) throw insertErr;
        setData(newAbout);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    setIsSaving(true);
    setError('');

    try {
      const { error: err } = await supabase
        .from('about_section')
        .update({
          title: data.title,
          description: data.description,
          mission: data.mission,
          vision: data.vision,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (err) throw err;
      alert('About section updated successfully!');
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
          <h1 className="text-2xl font-bold text-slate-900">Edit About Section</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={data?.title || ''}
              onChange={(e) => setData(data ? { ...data, title: e.target.value } : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={data?.description || ''}
              onChange={(e) => setData(data ? { ...data, description: e.target.value } : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission
            </label>
            <textarea
              value={data?.mission || ''}
              onChange={(e) => setData(data ? { ...data, mission: e.target.value } : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vision
            </label>
            <textarea
              value={data?.vision || ''}
              onChange={(e) => setData(data ? { ...data, vision: e.target.value } : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={4}
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
