import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader } from 'lucide-react';

interface HeroData {
  id: string;
  title: string;
  subtitle: string;
  cta_button_text: string;
  cta_button_link: string;
}

export default function AdminHeroPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<HeroData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      const { data: heroData, error: err } = await supabase
        .from('hero_section')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (err) throw err;

      if (heroData) {
        setData(heroData);
      } else {
        const { data: newHero, error: insertErr } = await supabase
          .from('hero_section')
          .insert([{}])
          .select()
          .single();

        if (insertErr) throw insertErr;
        setData(newHero);
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
        .from('hero_section')
        .update({
          title: data.title,
          subtitle: data.subtitle,
          cta_button_text: data.cta_button_text,
          cta_button_link: data.cta_button_link,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (err) throw err;
      alert('Hero section updated successfully!');
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
          <h1 className="text-2xl font-bold text-slate-900">Edit Hero Section</h1>
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
              Subtitle
            </label>
            <textarea
              value={data?.subtitle || ''}
              onChange={(e) => setData(data ? { ...data, subtitle: e.target.value } : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={data?.cta_button_text || ''}
                onChange={(e) => setData(data ? { ...data, cta_button_text: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Button Link
              </label>
              <input
                type="text"
                value={data?.cta_button_link || ''}
                onChange={(e) => setData(data ? { ...data, cta_button_link: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
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
