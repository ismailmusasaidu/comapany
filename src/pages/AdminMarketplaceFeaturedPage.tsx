import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Loader } from 'lucide-react';

interface FeaturedProduct {
  id: string;
  title: string;
  description: string;
  image_url: string;
  rating: number;
  order_index: number;
}

export default function AdminMarketplaceFeaturedPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error: err } = await supabase
        .from('marketplace_featured_products')
        .select('*')
        .order('order_index', { ascending: true });

      if (err) throw err;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = () => {
    const newProduct: FeaturedProduct = {
      id: `new-${Date.now()}`,
      title: 'New Product',
      description: '',
      image_url: '',
      rating: 5,
      order_index: products.length,
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = async (id: string) => {
    if (id.startsWith('new-')) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      try {
        const { error: err } = await supabase
          .from('marketplace_featured_products')
          .delete()
          .eq('id', id);

        if (err) throw err;
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete product');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      for (const product of products) {
        if (product.id.startsWith('new-')) {
          const { error: insertErr } = await supabase
            .from('marketplace_featured_products')
            .insert([{
              title: product.title,
              description: product.description,
              image_url: product.image_url,
              rating: product.rating,
              order_index: product.order_index,
            }]);

          if (insertErr) throw insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('marketplace_featured_products')
            .update({
              title: product.title,
              description: product.description,
              image_url: product.image_url,
              rating: product.rating,
              order_index: product.order_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', product.id);

          if (updateErr) throw updateErr;
        }
      }

      alert('Featured products updated successfully!');
      await fetchProducts();
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
            <h1 className="text-2xl font-bold text-slate-900">Manage Featured Products</h1>
          </div>
          <button
            onClick={addProduct}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
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
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(e) =>
                      setProducts(products.map(p =>
                        p.id === product.id ? { ...p, title: e.target.value } : p
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={product.rating}
                    onChange={(e) =>
                      setProducts(products.map(p =>
                        p.id === product.id ? { ...p, rating: parseFloat(e.target.value) } : p
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
                  value={product.description}
                  onChange={(e) =>
                    setProducts(products.map(p =>
                      p.id === product.id ? { ...p, description: e.target.value } : p
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={product.image_url}
                  onChange={(e) =>
                    setProducts(products.map(p =>
                      p.id === product.id ? { ...p, image_url: e.target.value } : p
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={() => removeProduct(product.id)}
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
