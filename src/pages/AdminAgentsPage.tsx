import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Package, Truck, CheckCircle, XCircle, Clock,
  Search, Filter, Eye, Building2, MapPin, Phone, Mail, RefreshCw,
  ChevronDown, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BookingDetailModal from '../components/BookingDetailModal';

type Tab = 'agents' | 'bookings' | 'requests';
type AgentStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface Agent {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  city: string;
  id_number: string;
  address: string;
  status: string;
  rejection_reason: string;
  created_at: string;
}

interface Booking {
  id: string;
  booking_ref: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  pickup_city: string;
  delivery_city: string;
  package_type: string;
  package_description: string;
  weight_kg: number | null;
  declared_value: number | null;
  special_instructions: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent_profiles: { full_name: string; company_name: string; phone: string; email: string } | null;
}

interface Request {
  id: string;
  request_ref: string;
  title: string;
  service_type: string;
  origin: string;
  destination: string;
  status: string;
  created_at: string;
  admin_notes: string;
  agent_profiles: { full_name: string; company_name: string } | null;
}

const BOOKING_STATUS_OPTIONS = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
const REQUEST_STATUS_OPTIONS = ['pending', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected'];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-orange-50 text-orange-700 border-orange-200',
  in_transit: 'bg-orange-50 text-orange-600 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

export default function AdminAgentsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus>('all');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counts, setCounts] = useState({ agents: 0, bookings: 0, requests: 0, pending: 0 });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [agentsRes, bookingsRes, requestsRes] = await Promise.all([
      supabase.from('agent_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('delivery_bookings').select('*, agent_profiles(full_name, company_name, phone, email)').order('created_at', { ascending: false }),
      supabase.from('logistics_requests').select('*, agent_profiles(full_name, company_name)').order('created_at', { ascending: false }),
    ]);

    const agentList = agentsRes.data ?? [];
    setAgents(agentList);
    setBookings(bookingsRes.data as Booking[] ?? []);
    setRequests(requestsRes.data as Request[] ?? []);
    setCounts({
      agents: agentList.length,
      bookings: bookingsRes.data?.length ?? 0,
      requests: requestsRes.data?.length ?? 0,
      pending: agentList.filter(a => a.status === 'pending').length,
    });
    setLoading(false);
  };

  const approveAgent = async (id: string) => {
    setActionLoading(id);
    await supabase.from('agent_profiles').update({ status: 'approved', rejection_reason: '' }).eq('id', id);
    await fetchAll();
    setSelectedAgent(null);
    setActionLoading(null);
  };

  const rejectAgent = async (id: string) => {
    setActionLoading(id);
    await supabase.from('agent_profiles').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', id);
    await fetchAll();
    setSelectedAgent(null);
    setRejectReason('');
    setActionLoading(null);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    await supabase.from('delivery_bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updateRequestStatus = async (id: string, status: string, notes?: string) => {
    await supabase.from('logistics_requests').update({ status, ...(notes !== undefined ? { admin_notes: notes } : {}) }).eq('id', id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, ...(notes !== undefined ? { admin_notes: notes } : {}) } : r));
  };

  const filteredAgents = agents.filter(a => {
    const matchSearch = search === '' || a.full_name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.company_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Agent Management</h1>
              <p className="text-gray-500 text-sm">Manage agents, bookings & logistics requests</p>
            </div>
          </div>
          <button onClick={fetchAll} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Agents', value: counts.agents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Approval', value: counts.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', highlight: counts.pending > 0 },
            { label: 'Delivery Bookings', value: counts.bookings, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Logistics Requests', value: counts.requests, icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className={`bg-white rounded-2xl border p-5 flex items-center gap-4 ${stat.highlight ? 'border-yellow-200 shadow-yellow-100 shadow-md' : 'border-gray-100'}`}>
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'agents', label: 'Agents', icon: Users, count: counts.agents },
              { key: 'bookings', label: 'Delivery Bookings', icon: Package, count: counts.bookings },
              { key: 'requests', label: 'Logistics Requests', icon: Truck, count: counts.requests },
            ] as { key: Tab; label: string; icon: typeof Users; count: number }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tab === t.key ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Agents Tab */}
          {tab === 'agents' && (
            <div>
              {/* Filters */}
              <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as AgentStatus)}
                    className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">No agents found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredAgents.map(agent => (
                    <div key={agent.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {agent.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{agent.full_name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGE[agent.status] ?? ''}`}>
                              {cap(agent.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                            <Building2 className="h-3 w-3" /> {agent.company_name} · <MapPin className="h-3 w-3" /> {agent.city}
                          </p>
                          <p className="text-xs text-gray-400">{agent.email} · Registered {fmtDate(agent.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs font-medium transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {agent.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveAgent(agent.id)}
                              disabled={actionLoading === agent.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => setSelectedAgent(agent)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-all"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {agent.status === 'approved' && (
                          <button
                            onClick={() => rejectAgent(agent.id)}
                            disabled={actionLoading === agent.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-medium transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Revoke
                          </button>
                        )}
                        {agent.status === 'rejected' && (
                          <button
                            onClick={() => approveAgent(agent.id)}
                            disabled={actionLoading === agent.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg text-xs font-medium transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Re-approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {tab === 'bookings' && (
            <div>
              {loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : bookings.length === 0 ? (
                <div className="p-12 text-center"><Package className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No bookings yet</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="text-left px-6 py-3 font-semibold">Booking Ref</th>
                        <th className="text-left px-6 py-3 font-semibold">Agent</th>
                        <th className="text-left px-6 py-3 font-semibold">Route</th>
                        <th className="text-left px-6 py-3 font-semibold">Package</th>
                        <th className="text-left px-6 py-3 font-semibold">Status</th>
                        <th className="text-left px-6 py-3 font-semibold">Date</th>
                        <th className="text-left px-6 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-orange-600">{b.booking_ref}</p>
                            <p className="text-xs text-gray-400">{b.sender_name} → {b.recipient_name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800 text-xs">{b.agent_profiles?.full_name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{b.agent_profiles?.company_name ?? ''}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-700 font-medium">{b.pickup_city} → {b.delivery_city}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-xs text-gray-600">{b.package_type}</span>
                          </td>
                          <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                            <select
                              value={b.status}
                              onChange={e => updateBookingStatus(b.id, e.target.value)}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${STATUS_BADGE[b.status] ?? ''}`}
                            >
                              {BOOKING_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">{fmtDate(b.created_at)}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedBooking(b); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs font-medium transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Requests Tab */}
          {tab === 'requests' && (
            <div>
              {loading ? (
                <div className="p-12 text-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center"><Truck className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">No logistics requests yet</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="text-left px-6 py-3 font-semibold">Request</th>
                        <th className="text-left px-6 py-3 font-semibold">Agent</th>
                        <th className="text-left px-6 py-3 font-semibold">Service</th>
                        <th className="text-left px-6 py-3 font-semibold">Route</th>
                        <th className="text-left px-6 py-3 font-semibold">Status</th>
                        <th className="text-left px-6 py-3 font-semibold">Date</th>
                        <th className="text-left px-6 py-3 font-semibold">Admin Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {requests.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-blue-600">{r.request_ref}</p>
                            <p className="text-xs text-gray-700 font-medium">{r.title}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-800 text-xs">{r.agent_profiles?.full_name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{r.agent_profiles?.company_name ?? ''}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-xs text-gray-600">{cap(r.service_type)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-700">{r.origin} → {r.destination}</p>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={r.status}
                              onChange={e => updateRequestStatus(r.id, e.target.value)}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${STATUS_BADGE[r.status] ?? ''}`}
                            >
                              {REQUEST_STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">{fmtDate(r.created_at)}</td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="Add notes..."
                              defaultValue={r.admin_notes}
                              onBlur={e => updateRequestStatus(r.id, r.status, e.target.value)}
                              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg w-36 focus:outline-none focus:ring-1 focus:ring-orange-400"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Agent Profile</h2>
              <button onClick={() => { setSelectedAgent(null); setRejectReason(''); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                  {selectedAgent.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selectedAgent.full_name}</p>
                  <p className="text-gray-500 text-sm">{selectedAgent.company_name}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium mt-1 inline-block ${STATUS_BADGE[selectedAgent.status] ?? ''}`}>
                    {cap(selectedAgent.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: Mail, label: 'Email', value: selectedAgent.email },
                  { icon: Phone, label: 'Phone', value: selectedAgent.phone },
                  { icon: MapPin, label: 'City', value: selectedAgent.city },
                  { icon: Building2, label: 'ID Number', value: selectedAgent.id_number },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">{item.label}</span>
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Address</p>
                <p className="font-medium text-gray-800 text-sm">{selectedAgent.address}</p>
              </div>

              {selectedAgent.rejection_reason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-600 font-medium">Rejection Reason</p>
                    <p className="text-sm text-red-700">{selectedAgent.rejection_reason}</p>
                  </div>
                </div>
              )}

              {selectedAgent.status === 'pending' && (
                <div className="border border-red-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Rejection reason (if rejecting):</p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain why the application is rejected..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                </div>
              )}
            </div>

            {selectedAgent.status === 'pending' && (
              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => approveAgent(selectedAgent.id)}
                  disabled={actionLoading === selectedAgent.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" /> Approve Agent
                </button>
                <button
                  onClick={() => rejectAgent(selectedAgent.id)}
                  disabled={actionLoading === selectedAgent.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Reject Agent
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isAdmin={true}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={(id, newStatus) => {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}
    </div>
  );
}
