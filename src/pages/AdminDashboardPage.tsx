import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, Users, Package, Image, MessageSquare, Home, ShoppingCart, Star, Building2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const websiteItems = [
    { icon: Home, label: 'Hero Section', path: '/admin/hero' },
    { icon: Package, label: 'Services', path: '/admin/services' },
    { icon: Users, label: 'Team Members', path: '/admin/team' },
    { icon: Users, label: 'Partners', path: '/admin/partners' },
    { icon: Image, label: 'Gallery', path: '/admin/gallery' },
    { icon: MessageSquare, label: 'Contact Info', path: '/admin/contact' },
    { icon: Settings, label: 'About Section', path: '/admin/about' },
  ];

  const marketplaceItems = [
    { icon: ShoppingCart, label: 'Marketplace Hero', path: '/admin/marketplace-hero' },
    { icon: Package, label: 'Categories (What We Offer)', path: '/admin/marketplace-categories' },
    { icon: Star, label: 'Featured Products', path: '/admin/marketplace-featured' },
    { icon: Building2, label: 'Marketplace Partners', path: '/admin/marketplace-partners' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Website Content</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websiteItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <item.icon className="h-6 w-6 text-orange-500" />
                  <h3 className="text-lg font-semibold text-slate-900">{item.label}</h3>
                </div>
                <p className="text-gray-600 text-sm">Manage {item.label.toLowerCase()}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Marketplace Content</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaceItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <item.icon className="h-6 w-6 text-blue-900" />
                  <h3 className="text-lg font-semibold text-slate-900">{item.label}</h3>
                </div>
                <p className="text-gray-600 text-sm">Manage {item.label.toLowerCase()}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
