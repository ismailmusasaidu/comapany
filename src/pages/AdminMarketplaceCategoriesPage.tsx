import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Loader } from 'lucide-react';

interface Category {
  id: string;
  title: string;
  description: string;
  image_url: string;
  order_index: number;
}

export default function AdminMarketplaceCategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error: err } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (err) throw err;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: `new-${Date.now()}`,
      title: 'New Category',
      description: '',
      image_url: '',
      order_index: categories.length,
    };
    setCategories([...categories, newCategory]);
  };

  const removeCategory = async (id: string) => {
    if (id.startsWith('new-')) {
      setCategories(categories.filter(c => c.id !== id));
    } else {
      try {
        const { error: err } = await supabase
          .from('marketplace_categories')
          .delete()
          .eq('id', id);

        if (err) throw err;
        setCategories(categories.filter(c => c.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete category');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      for (const category of categories) {
        if (category.id.startsWith('new-')) {
          const { error: insertErr } = await supabase
            .from('marketplace_categories')
            .insert([{
              title: category.title,
              description: category.description,
              image_url: category.image_url,
              order_index: category.order_index,
            }]);

          if (insertErr) throw insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('marketplace_categories')
            .update({
              title: category.title,
              description: category.description,
              image_url: category.image_url,
              order_index: category.order_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', category.id);

          if (updateErr) throw updateErr;
        }
      }

      alert('Categories updated successfully!');
      await fetchCategories();
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
            <h1 className="text-2xl font-bold text-slate-900">Manage Categories (What We Offer)</h1>
          </div>
          <button
            onClick={addCategory}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
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
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={category.title}
                    onChange={(e) =>
                      setCategories(categories.map(c =>
                        c.id === category.id ? { ...c, title: e.target.value } : c
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={category.description}
                    onChange={(e) =>
                      setCategories(categories.map(c =>
                        c.id === category.id ? { ...c, description: e.target.value } : c
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={category.image_url}
                  onChange={(e) =>
                    setCategories(categories.map(c =>
                      c.id === category.id ? { ...c, image_url: e.target.value } : c
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={() => removeCategory(category.id)}
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
