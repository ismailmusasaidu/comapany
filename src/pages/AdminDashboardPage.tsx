import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';
import {
  LogOut, Inbox, Send, Users, Package, Image, MessageSquare, Settings as SettingsIcon,
  ShoppingCart, Star, Building2, Truck, Plus, DollarSign, MessageCircle, BarChart3,
  FileText, User, Bike, Search, Menu, X, Home, ClipboardList, ArrowUpRight, Activity,
  type LucideIcon,
} from 'lucide-react';

type BadgeKey = 'unread' | 'agents' | 'businesses' | 'riders' | 'unassigned';

interface DashCounts {
  unread: number;
  agents: number;
  businesses: number;
  riders: number;
  unassigned: number;
}

interface NavItem {
  path: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  badge?: BadgeKey;
  accent?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const EMPTY_COUNTS: DashCounts = { unread: 0, agents: 0, businesses: 0, riders: 0, unassigned: 0 };

const SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { path: '/admin/messages', label: 'Contact Messages', desc: 'Customer messages from the website contact form', icon: Inbox, badge: 'unread' },
      { path: '/admin/private-messages', label: 'Private Messages', desc: 'Chat with agents and businesses', icon: Send },
      { path: '/admin/booking/new', label: 'New Delivery Booking', desc: 'Create a delivery booking on behalf of a customer', icon: Plus, accent: 'from-orange-500 to-red-500' },
      { path: '/admin/delivery-request/new', label: 'New Delivery Request', desc: 'Create a business delivery request for a client', icon: Plus, accent: 'from-blue-600 to-cyan-500' },
      { path: '/admin/bookings', label: 'Booking Assignments', desc: 'Assign riders to deliveries and track progress', icon: ClipboardList, badge: 'unassigned' },
      { path: '/admin/orders-analytics', label: 'Orders Analytics', desc: 'Delivery and logistics performance across all portals', icon: BarChart3 },
      { path: '/admin/invoice-generator', label: 'Invoice Generator', desc: 'Generate invoices for deliveries and logistics', icon: FileText },
    ],
  },
  {
    title: 'Management',
    items: [
      { path: '/admin/agents', label: 'Agent Management', desc: 'Approve agents and manage their requests', icon: Users, badge: 'agents' },
      { path: '/admin/businesses', label: 'Business Management', desc: 'Approve businesses and manage their requests', icon: Building2, badge: 'businesses' },
      { path: '/admin/individuals', label: 'Individual Customers', desc: 'Manage individual bookings and requests', icon: User },
      { path: '/admin/riders', label: 'Rider Management', desc: 'Approve riders and manage their profiles', icon: Bike, badge: 'riders' },
    ],
  },
  {
    title: 'Logistics',
    items: [
      { path: '/admin/agents?tab=requests', label: 'Logistics Requests', desc: 'Review and process logistics service requests', icon: Truck },
      { path: '/admin/logistics-fees', label: 'Logistics Request Fees', desc: 'Set pricing for all logistics service types', icon: DollarSign },
      { path: '/admin/delivery-fees', label: 'Delivery Fee Settings', desc: 'Configure per-km delivery rates', icon: DollarSign },
    ],
  },
  {
    title: 'Website Content',
    items: [
      { path: '/admin/hero', label: 'Hero Section', desc: 'The main banner on the homepage', icon: Home },
      { path: '/admin/services', label: 'Services', desc: 'The services shown on the website', icon: Package },
      { path: '/admin/team', label: 'Team Members', desc: 'The people behind the company', icon: Users },
      { path: '/admin/partners', label: 'Partners', desc: 'Partner logos and companies', icon: Users },
      { path: '/admin/gallery', label: 'Gallery', desc: 'Photos shown across the website', icon: Image },
      { path: '/admin/contact', label: 'Contact Info', desc: 'Phone, email and address details', icon: MessageSquare },
      { path: '/admin/about', label: 'About Section', desc: 'The company story and values', icon: SettingsIcon },
    ],
  },
  {
    title: 'Marketplace Content',
    items: [
      { path: '/admin/marketplace-hero', label: 'Marketplace Hero', desc: 'The marketplace landing banner', icon: ShoppingCart },
      { path: '/admin/marketplace-categories', label: 'Categories', desc: 'What the marketplace offers', icon: Package },
      { path: '/admin/marketplace-featured', label: 'Featured Products', desc: 'Highlighted products and deals', icon: Star },
      { path: '/admin/marketplace-partners', label: 'Marketplace Partners', desc: 'Shops and vendors on the marketplace', icon: Building2 },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { path: '/admin/whatsapp', label: 'WhatsApp Booking', desc: 'WhatsApp number and booking messages', icon: MessageCircle },
    ],
  },
];

const STAT_CARDS: { key: BadgeKey; label: string; icon: LucideIcon; tint: string }[] = [
  { key: 'unread', label: 'Unread Messages', icon: Inbox, tint: 'text-orange-600 bg-orange-50' },
  { key: 'agents', label: 'Pending Agents', icon: Users, tint: 'text-blue-600 bg-blue-50' },
  { key: 'businesses', label: 'Pending Businesses', icon: Building2, tint: 'text-indigo-600 bg-indigo-50' },
  { key: 'riders', label: 'Pending Riders', icon: Bike, tint: 'text-emerald-600 bg-emerald-50' },
  { key: 'unassigned', label: 'Unassigned Bookings', icon: ClipboardList, tint: 'text-red-600 bg-red-50' },
];

const QUICK_ACTIONS: NavItem[] = [
  { path: '/admin/booking/new', label: 'New Delivery Booking', desc: 'Book a delivery for an agent or customer', icon: Truck, accent: 'from-orange-500 to-red-500' },
  { path: '/admin/delivery-request/new', label: 'New Delivery Request', desc: 'Create a business delivery request', icon: Building2, accent: 'from-blue-600 to-cyan-500' },
  { path: '/admin/messages', label: 'Contact Messages', desc: 'Reply to incoming customer messages', icon: Inbox, badge: 'unread' },
  { path: '/admin/private-messages', label: 'Private Messages', desc: 'Chat with agents and businesses', icon: Send },
  { path: '/admin/bookings', label: 'Booking Assignments', desc: 'Assign riders and track deliveries', icon: ClipboardList, badge: 'unassigned' },
  { path: '/admin/invoice-generator', label: 'Invoice Generator', desc: 'Generate invoices for any period', icon: FileText },
];

const DASH_COUNT_TABLES: { key: BadgeKey; table: string; filter: [string, string] }[] = [
  { key: 'unread', table: 'contact_messages', filter: ['is_read', 'false'] },
  { key: 'agents', table: 'agent_profiles', filter: ['status', 'pending'] },
  { key: 'businesses', table: 'business_profiles', filter: ['status', 'pending'] },
  { key: 'riders', table: 'rider_profiles', filter: ['status', 'pending'] },
];

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState<DashCounts>(EMPTY_COUNTS);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const settled = await Promise.allSettled([
          ...DASH_COUNT_TABLES.map(({ table, filter }) =>
            supabase.from(table).select('id', { count: 'exact', head: true }).eq(filter[0], filter[1] === 'false' ? false : filter[1])
          ),
          supabase.from('delivery_bookings').select('id', { count: 'exact', head: true }).eq('assignment_status', 'unassigned'),
          supabase.from('business_delivery_bookings').select('id', { count: 'exact', head: true }).eq('assignment_status', 'unassigned'),
        ]);
        let next: DashCounts = { ...EMPTY_COUNTS };
        settled.forEach((res, i) => {
          if (res.status !== 'fulfilled') return;
          const value = res.value.count ?? 0;
          if (i < DASH_COUNT_TABLES.length) next[DASH_COUNT_TABLES[i].key] = value;
          else if (i === DASH_COUNT_TABLES.length) next.unassigned += value;
          else next.unassigned += value;
        });
        setCounts(next);
      } catch {
        setCounts(EMPTY_COUNTS);
      }
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

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map(s => ({
      ...s,
      items: s.items.filter(it => it.label.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)),
    })).filter(s => s.items.length > 0);
  }, [query]);

  const allItems = useMemo(() => SECTIONS.flatMap(s => s.items), []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter(it => it.label.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q));
  }, [query, allItems]);

  const badge = (key?: BadgeKey) => {
    if (!key) return null;
    const value = counts[key];
    if (!value) return null;
    return <span className="ml-auto text-[10px] font-bold text-white bg-orange-500 rounded-full px-2 py-0.5 min-w-[20px] text-center">{value > 99 ? '99+' : value}</span>;
  };

  const goItem = (item: NavItem) => {
    navigate(item.path);
    setSidebarOpen(false);
    setQuery('');
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white leading-tight">Admin Console</p>
            <p className="text-[11px] text-slate-400">Dan Hausa Logistics</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {filteredSections.map(section => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.path + item.label}
                    onClick={() => goItem(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                      active ? 'bg-gradient-to-r from-orange-500/15 to-red-500/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${active ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium truncate">{item.label}</span>
                    {badge(item.badge)}
                    {active && <ArrowUpRight className="h-3.5 w-3.5 text-orange-400 ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filteredSections.length === 0 && (
          <p className="px-3 text-sm text-slate-500">No pages match your search.</p>
        )}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-slate-950 border-r border-white/10 animate-scaleIn">{sidebar}</aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-white/10">{sidebar}</aside>

      {/* Main column */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-slate-100/80 backdrop-blur-md border-b border-slate-200">
          <div className="px-4 sm:px-6 py-3.5 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pages — e.g. fees, messages, gallery…"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="hidden sm:block text-right min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">Administrator</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <NotificationBell />
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
          {results.length > 0 && query.trim() ? (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">Search Results</h1>
                <p className="text-slate-500 text-sm mt-0.5">{results.length} page{results.length === 1 ? '' : 's'} match “{query.trim()}”</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.path + item.label} onClick={() => goItem(item)}
                      className="group bg-white rounded-2xl border border-slate-200 p-5 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                          <Icon className="h-5 w-5 text-slate-500 group-hover:text-orange-600 transition-colors" />
                        </span>
                        <h3 className="font-semibold text-slate-900">{item.label}</h3>
                        {badge(item.badge)}
                      </div>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Welcome */}
              <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 sm:p-9">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.25),transparent_55%)]" />
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Overview</p>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight max-w-xl">Welcome back to your command centre</h1>
                  <p className="text-slate-300 mt-2 max-w-xl">Everything you need to run Dan Hausa Logistics — approvals, bookings, content and fees — is one click away.</p>
                </div>
              </section>

              {/* Stats */}
              <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {STAT_CARDS.map(card => {
                  const Icon = card.icon;
                  const value = counts[card.key];
                  return (
                    <button key={card.key} onClick={() => navigate(card.key === 'unread' ? '/admin/messages' : card.key === 'agents' || card.key === 'businesses' || card.key === 'riders' ? `/admin/${card.key === 'agents' ? 'agents' : card.key === 'businesses' ? 'businesses' : 'riders'}` : '/admin/bookings')}
                      className="bg-white rounded-2xl border border-slate-200 p-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <div className={`w-10 h-10 rounded-xl ${card.tint} flex items-center justify-center mb-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-2xl font-bold font-display text-slate-900">{value > 99 ? '99+' : value}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
                    </button>
                  );
                })}
              </section>

              {/* Quick actions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-slate-900">Quick Actions</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {QUICK_ACTIONS.map(item => {
                    const Icon = item.icon;
                    return (
                      <button key={item.path + item.label} onClick={() => goItem(item)}
                        className="group bg-white rounded-2xl border border-slate-200 p-5 text-left shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.accent ?? 'from-slate-700 to-slate-900'} flex items-center justify-center shadow-lg shadow-slate-900/10`}>
                            <Icon className="h-5 w-5 text-white" />
                          </span>
                          {badge(item.badge)}
                        </div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{item.label}</h3>
                        <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* All sections */}
              <section>
                <h2 className="font-display text-xl font-bold text-slate-900 mb-4">All Sections</h2>
                <div className="space-y-6">
                  {SECTIONS.map(section => (
                    <div key={section.title}>
                      <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-500">{section.title}</p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {section.items.map(item => {
                          const Icon = item.icon;
                          return (
                            <button key={item.path + item.label} onClick={() => goItem(item)}
                              className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 text-left shadow-sm hover:shadow-md hover:border-orange-200 hover:bg-orange-50/40 transition-all">
                              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                                <Icon className="h-4 w-4 text-slate-500 group-hover:text-orange-600 transition-colors" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-slate-800 truncate">{item.label}</p>
                                <p className="text-xs text-slate-500 truncate hidden sm:block">{item.desc}</p>
                              </div>
                              {badge(item.badge)}
                              <ChevronRightIcon />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />;
}
