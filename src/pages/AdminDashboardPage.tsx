import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, Users, Package, Image, MessageSquare, Home, ShoppingCart, Star, Building2, Inbox, Truck, Clock, Plus, Send } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingAgents, setPendingAgents] = useState(0);
  const [pendingBusinesses, setPendingBusinesses] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: unread }, { count: pending }, { count: pendingBiz }] = await Promise.all([
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('agent_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('business_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setUnreadCount(unread || 0);
      setPendingAgents(pending || 0);
      setPendingBusinesses(pendingBiz || 0);
    };
    fetchCounts();
  }, []);

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
        {/* Customer Messages + Agents */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Operations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/messages')}
              className="relative bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
            >
              {unreadCount > 0 && (
                <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
              <div className="flex items-center space-x-3 mb-2">
                <Inbox className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-slate-900">Contact Messages</h3>
              </div>
              <p className="text-gray-600 text-sm">View and manage customer messages from the contact form</p>
            </button>

            <button
              onClick={() => navigate('/admin/private-messages')}
              className="relative bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Send className="h-6 w-6 text-slate-700" />
                <h3 className="text-lg font-semibold text-slate-900">Private Messages</h3>
              </div>
              <p className="text-gray-600 text-sm">Send and receive private messages with agents and businesses</p>
            </button>

            <button
              onClick={() => navigate('/admin/agents')}
              className="relative bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
            >
              {pendingAgents > 0 && (
                <span className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {pendingAgents} pending
                </span>
              )}
              <div className="flex items-center space-x-3 mb-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Agent Management</h3>
              </div>
              <p className="text-gray-600 text-sm">Approve agents, manage delivery bookings & logistics requests</p>
            </button>

            <button
              onClick={() => navigate('/admin/agents')}
              className="relative bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Truck className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900">Logistics Requests</h3>
              </div>
              <p className="text-gray-600 text-sm">Review and process agent logistics service requests</p>
            </button>

            <button
              onClick={() => navigate('/admin/businesses')}
              className="relative bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
            >
              {pendingBusinesses > 0 && (
                <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {pendingBusinesses} pending
                </span>
              )}
              <div className="flex items-center space-x-3 mb-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Business Management</h3>
              </div>
              <p className="text-gray-600 text-sm">Approve businesses, manage their bookings & logistics requests</p>
            </button>

            <button
              onClick={() => navigate('/admin/booking/new')}
              className="relative bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">New Delivery Booking</h3>
              </div>
              <p className="text-gray-600 text-sm">Create a delivery booking on behalf of an agent or customer</p>
            </button>

            <button
              onClick={() => navigate('/admin/delivery-request/new')}
              className="relative bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 text-left"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">New Delivery Request</h3>
              </div>
              <p className="text-gray-600 text-sm">Create a business delivery request on behalf of a client</p>
            </button>
          </div>
        </div>

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
