import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Search, ScrollText, Filter, X,
  LogIn, Truck, Package, Wallet, FileText, ShieldCheck, Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  admin_email: string | null;
  action: string;
  category: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Truck; chip: string }> = {
  bookings: { label: 'Bookings', icon: Package, chip: 'bg-orange-50 text-orange-700 border-orange-200' },
  logistics: { label: 'Logistics', icon: Truck, chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  payments: { label: 'Payments & Fees', icon: Wallet, chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  content: { label: 'Content', icon: FileText, chip: 'bg-purple-50 text-purple-700 border-purple-200' },
  auth: { label: 'Sign-ins', icon: LogIn, chip: 'bg-teal-50 text-teal-700 border-teal-200' },
  general: { label: 'General', icon: Activity, chip: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const PAGE_SIZE = 50;

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(d: string) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function describeDetails(details: Record<string, unknown> | null): string {
  if (!details) return '';
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${cap(k)}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ');
}

export default function AdminAuditLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (!error) setLogs((data ?? []) as AuditLog[]);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = useMemo(() => logs.filter(l => {
    const q = search.trim().toLowerCase();
    const matchSearch = q === '' ||
      (l.admin_email ?? '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.entity_label ?? '').toLowerCase().includes(q) ||
      (l.entity_type ?? '').toLowerCase().includes(q) ||
      describeDetails(l.details).toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'all' || l.category === categoryFilter;
    return matchSearch && matchCategory;
  }), [logs, search, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageLogs = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, categoryFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: logs.length };
    for (const l of logs) c[l.category] = (c[l.category] ?? 0) + 1;
    return c;
  }, [logs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
              <p className="text-gray-500 text-sm">Every change and event made in the admin dashboard</p>
            </div>
          </div>
          <button onClick={fetchLogs} className={`p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {([['all', 'All Events', ShieldCheck, 'text-slate-600 bg-slate-100'], ...Object.entries(CATEGORY_META).map(([k, v]) => [k, v.label, v.icon, 'text-gray-600 bg-gray-100'])] as [string, string, typeof Truck, string][]).map(([key, label, Icon, tint]) => (
            <button key={key} onClick={() => setCategoryFilter(key)}
              className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md ${categoryFilter === key ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-100'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tint}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{counts[key] ?? 0}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by admin, action, reference or details…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none">
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Log list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pageLogs.length === 0 ? (
            <div className="text-center py-20">
              <ScrollText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No audit entries found</p>
              <p className="text-gray-400 text-sm mt-1">Admin actions will be recorded here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pageLogs.map(l => {
                const meta = CATEGORY_META[l.category] ?? CATEGORY_META.general;
                const Icon = meta.icon;
                const desc = describeDetails(l.details);
                return (
                  <div key={l.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors flex items-start gap-3">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${meta.chip}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{cap(l.action)}</p>
                        {l.entity_label && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            {l.entity_label}
                          </span>
                        )}
                      </div>
                      {desc && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {l.admin_email ?? 'Unknown admin'} · {l.entity_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 font-medium">{timeAgo(l.created_at)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{fmtDateTime(l.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  Previous
                </button>
                <span className="text-xs text-gray-500">Page {page + 1} of {pageCount}</span>
                <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
