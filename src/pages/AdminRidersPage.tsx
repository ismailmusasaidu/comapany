import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bike, Check, CheckCheck, Clock, Search, Send, MessageSquare, XCircle, CheckCircle, ChevronDown, User, Phone, Mail, MapPin, CreditCard, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RiderProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  vehicle_type: string;
  license_number: string;
  nin: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  admin_notes: string;
  created_at: string;
}

interface MsgThread {
  id: string;
  subject: string;
  recipient_id: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: string;
  rider_name?: string;
}

interface MsgMessage {
  id: string;
  thread_id: string;
  sender_role: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

const VEHICLE_LABEL: Record<string, string> = {
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
  tricycle: 'Tricycle (Keke)',
  car: 'Car',
};

type Tab = 'overview' | 'riders' | 'messages';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminRidersPage() {
  const { user: adminUser } = useAuth();
  const [tab, setTab] = useState<Tab>('riders');
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRider, setSelectedRider] = useState<RiderProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Messaging state
  const [msgThreads, setMsgThreads] = useState<MsgThread[]>([]);
  const [msgActive, setMsgActive] = useState<MsgThread | null>(null);
  const [msgMessages, setMsgMessages] = useState<MsgMessage[]>([]);
  const [msgReply, setMsgReply] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeRider, setComposeRider] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState('');
  const msgBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadRiders(); }, []);
  useEffect(() => { if (tab === 'messages') loadMsgThreads(); }, [tab]);
  useEffect(() => { if (msgActive) loadMsgMessages(msgActive.id); }, [msgActive]);
  useEffect(() => { msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgMessages]);

  const loadRiders = async () => {
    setLoading(true);
    const { data } = await supabase.from('rider_profiles').select('*').order('created_at', { ascending: false });
    setRiders(data || []);
    setLoading(false);
  };

  const loadMsgThreads = async () => {
    setMsgLoading(true);
    const { data: threads } = await supabase
      .from('message_threads')
      .select('*')
      .eq('recipient_type', 'rider')
      .order('updated_at', { ascending: false });
    if (!threads) { setMsgLoading(false); return; }

    const enriched = await Promise.all(threads.map(async (t) => {
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('thread_id', t.id).eq('is_read', false).neq('sender_role', 'admin');
      const { data: last } = await supabase.from('messages').select('body').eq('thread_id', t.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      const { data: rp } = await supabase.from('rider_profiles').select('full_name').eq('id', t.recipient_id).maybeSingle();
      return { ...t, unread_count: count || 0, last_message: last?.body || '', rider_name: rp?.full_name || 'Unknown Rider' };
    }));

    setMsgThreads(enriched);
    setMsgLoading(false);
  };

  const loadMsgMessages = async (threadId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    setMsgMessages(data || []);
    await supabase.from('messages').update({ is_read: true }).eq('thread_id', threadId).neq('sender_role', 'admin');
    setMsgThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread_count: 0 } : t));
  };

  const sendMsgReply = async () => {
    if (!msgReply.trim() || !msgActive || !adminUser) return;
    setMsgSending(true);
    const { error } = await supabase.from('messages').insert({
      thread_id: msgActive.id, sender_role: 'admin', sender_id: adminUser.id,
      body: msgReply.trim(), is_read: false,
    });
    if (!error) {
      await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', msgActive.id);
      setMsgReply('');
      await loadMsgMessages(msgActive.id);
      await loadMsgThreads();
    }
    setMsgSending(false);
  };

  const sendNewThread = async () => {
    if (!composeRider || !composeSubject.trim() || !composeBody.trim() || !adminUser) return;
    setComposeSending(true);
    setComposeError('');
    const { data: thread, error: tErr } = await supabase.from('message_threads').insert({
      recipient_type: 'rider', recipient_id: composeRider, subject: composeSubject.trim(),
    }).select().maybeSingle();
    if (tErr || !thread) { setComposeError('Failed to create thread.'); setComposeSending(false); return; }
    await supabase.from('messages').insert({
      thread_id: thread.id, sender_role: 'admin', sender_id: adminUser.id,
      body: composeBody.trim(), is_read: false,
    });
    setComposing(false);
    setComposeRider(''); setComposeSubject(''); setComposeBody('');
    await loadMsgThreads();
    setMsgActive(thread);
    setComposeSending(false);
  };

  const updateStatus = async (riderId: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    await supabase.from('rider_profiles').update({
      status,
      rejection_reason: status === 'rejected' ? rejectionReason : '',
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    }).eq('id', riderId);
    await loadRiders();
    setSelectedRider(null);
    setRejectionReason('');
    setAdminNotes('');
    setActionLoading(false);
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredRiders = riders.filter(r => {
    const matchesSearch = !search || r.full_name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || r.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = riders.filter(r => r.status === 'pending').length;
  const approvedCount = riders.filter(r => r.status === 'approved').length;
  const totalUnread = msgThreads.reduce((s, t) => s + (t.unread_count || 0), 0);

  const TABS: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'riders', label: 'Riders', icon: Bike, count: pendingCount || undefined },
    { key: 'messages', label: 'Messages', icon: MessageSquare, count: totalUnread || undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Bike className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Rider Management</h1>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Riders', value: riders.length, color: 'text-gray-900' },
            { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
            { label: 'Approved', value: approvedCount, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count !== undefined && (
                <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Riders Tab */}
        {tab === 'riders' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search riders..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="relative">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white appearance-none">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <span className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : filteredRiders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                <Bike className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No riders found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRiders.map(rider => (
                  <div key={rider.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bike className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{rider.full_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[rider.status]}`}>{rider.status}</span>
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{VEHICLE_LABEL[rider.vehicle_type] || rider.vehicle_type}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                          <span>{rider.email}</span>
                          <span>{rider.phone}</span>
                          <span>{rider.city}</span>
                        </div>
                        {rider.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1">Rejection reason: {rider.rejection_reason}</p>
                        )}
                      </div>
                      <button onClick={() => { setSelectedRider(rider); setAdminNotes(rider.admin_notes || ''); setRejectionReason(''); }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {tab === 'messages' && (
          <div className="flex gap-4 h-[calc(100vh-340px)] min-h-96">
            {/* Thread list */}
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Threads</p>
                <button onClick={() => setComposing(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg transition-colors">
                  <Send className="h-3 w-3" /> New
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <span className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  </div>
                ) : msgThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                    <MessageSquare className="h-7 w-7 text-gray-200 mb-2" />
                    <p className="text-gray-400 text-xs">No threads yet. Start a conversation.</p>
                  </div>
                ) : msgThreads.map(t => (
                  <button key={t.id} onClick={() => setMsgActive(t)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${msgActive?.id === t.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs truncate ${(t.unread_count || 0) > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{t.rider_name}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{fmt(t.updated_at)}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{t.subject}</p>
                        {t.last_message && <p className="text-xs text-gray-400 truncate">{t.last_message}</p>}
                      </div>
                      {(t.unread_count || 0) > 0 && (
                        <span className="w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">{t.unread_count}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
              {msgActive ? (
                <>
                  <div className="px-4 py-3.5 border-b border-gray-100">
                    <p className="font-bold text-gray-900">{msgActive.subject}</p>
                    <p className="text-xs text-gray-400">{msgActive.rider_name} · Started {fmt(msgActive.created_at)}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {msgMessages.map(msg => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                            {!isAdmin && <p className="text-xs text-gray-400 px-1 font-medium">{msgActive.rider_name}</p>}
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAdmin ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                              {msg.body}
                            </div>
                            <div className="flex items-center gap-1.5 px-1">
                              <span className="text-xs text-gray-400">{fmt(msg.created_at)}</span>
                              {isAdmin && (msg.is_read ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3 text-gray-400" />)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={msgBottomRef} />
                  </div>
                  <div className="px-3 py-3 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                      <textarea value={msgReply} onChange={e => setMsgReply(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsgReply(); } }}
                        placeholder="Reply..." rows={2}
                        className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                      <button onClick={sendMsgReply} disabled={msgSending || !msgReply.trim()}
                        className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 flex-shrink-0">
                        {msgSending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <MessageSquare className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-600 mb-1">Select a conversation</p>
                  <p className="text-gray-400 text-sm">Or start a new one with a rider</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rider Review Modal */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Rider Profile Review</h3>
              <button onClick={() => setSelectedRider(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <Bike className="h-7 w-7 text-orange-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selectedRider.full_name}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[selectedRider.status]}`}>{selectedRider.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow icon={Mail} label="Email" value={selectedRider.email} />
                <InfoRow icon={Phone} label="Phone" value={selectedRider.phone} />
                <InfoRow icon={MapPin} label="City" value={selectedRider.city} />
                <InfoRow icon={Bike} label="Vehicle" value={VEHICLE_LABEL[selectedRider.vehicle_type] || selectedRider.vehicle_type} />
                <InfoRow icon={CreditCard} label="License" value={selectedRider.license_number} />
                <InfoRow icon={CreditCard} label="NIN" value={selectedRider.nin} />
                <InfoRow icon={MapPin} label="Address" value={selectedRider.address} />
                <InfoRow icon={User} label="Registered" value={new Date(selectedRider.created_at).toLocaleDateString()} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Notes (optional)</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Internal notes about this rider..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>

              {selectedRider.status !== 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rejection Reason (if rejecting)</label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={2} placeholder="Reason for rejection..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {selectedRider.status !== 'approved' && (
                  <button onClick={() => updateStatus(selectedRider.id, 'approved')} disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60">
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                )}
                {selectedRider.status !== 'rejected' && (
                  <button onClick={() => updateStatus(selectedRider.id, 'rejected')} disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                )}
                <button onClick={() => setSelectedRider(null)} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {composing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">New Message to Rider</h3>
              <button onClick={() => { setComposing(false); setComposeError(''); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {composeError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{composeError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Rider</label>
                <select value={composeRider} onChange={e => setComposeRider(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                  <option value="">Choose a rider...</option>
                  {riders.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Message subject..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={4} placeholder="Write your message..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
              <button onClick={sendNewThread} disabled={composeSending || !composeRider || !composeSubject.trim() || !composeBody.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {composeSending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}
