import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Plus, MessageSquare, User, Building2,
  Search, ChevronRight, CheckCheck, Check, X, Bike
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Thread {
  id: string;
  recipient_type: 'agent' | 'business' | 'rider';
  recipient_id: string;
  subject: string;
  created_at: string;
  updated_at: string;
  recipient_name?: string;
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_role: 'admin' | 'agent' | 'business' | 'rider';
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface Recipient {
  id: string;
  name: string;
  type: 'agent' | 'business' | 'rider';
}

export default function AdminMessagingPage() {
  const { user } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile: 'list' | 'thread'
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  const [composing, setComposing] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [composeError, setComposeError] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadThreads(); }, []);
  useEffect(() => { if (activeThread) loadMessages(activeThread.id); }, [activeThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadThreads = async () => {
    setLoading(true);
    const { data: threadData } = await supabase
      .from('message_threads')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!threadData) { setLoading(false); return; }

    const enriched = await Promise.all(threadData.map(async (t) => {
      let recipientName = 'Unknown';
      if (t.recipient_type === 'agent') {
        const { data: profile } = await supabase.from('agent_profiles').select('full_name').eq('id', t.recipient_id).maybeSingle();
        recipientName = profile?.full_name || 'Unknown Agent';
      } else if (t.recipient_type === 'business') {
        const { data: profile } = await supabase.from('business_profiles').select('company_name').eq('id', t.recipient_id).maybeSingle();
        recipientName = profile?.company_name || 'Unknown Business';
      } else if (t.recipient_type === 'rider') {
        const { data: profile } = await supabase.from('rider_profiles').select('full_name').eq('id', t.recipient_id).maybeSingle();
        recipientName = profile?.full_name || 'Unknown Rider';
      }
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('thread_id', t.id).eq('is_read', false).neq('sender_role', 'admin');
      const { data: last } = await supabase.from('messages').select('body').eq('thread_id', t.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return {
        ...t,
        recipient_name: recipientName,
        unread_count: count || 0,
        last_message: last?.body || '',
      };
    }));

    setThreads(enriched);
    setLoading(false);
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    await supabase.from('messages').update({ is_read: true })
      .eq('thread_id', threadId).neq('sender_role', 'admin');
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread_count: 0 } : t));
  };

  const openThread = (t: Thread) => {
    setActiveThread(t);
    setMobileView('thread');
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeThread || !user) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      thread_id: activeThread.id,
      sender_role: 'admin',
      sender_id: user.id,
      body: reply.trim(),
      is_read: false,
    });
    if (!error) {
      await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', activeThread.id);
      setReply('');
      await loadMessages(activeThread.id);
      await loadThreads();
    }
    setSending(false);
  };

  const loadRecipients = async (search: string) => {
    const [{ data: agents }, { data: businesses }, { data: riders }] = await Promise.all([
      supabase.from('agent_profiles').select('id, full_name').ilike('full_name', `%${search}%`).limit(5),
      supabase.from('business_profiles').select('id, company_name').ilike('company_name', `%${search}%`).limit(5),
      supabase.from('rider_profiles').select('id, full_name').ilike('full_name', `%${search}%`).limit(5),
    ]);
    const list: Recipient[] = [
      ...(agents || []).map(a => ({ id: a.id, name: a.full_name, type: 'agent' as const })),
      ...(businesses || []).map(b => ({ id: b.id, name: b.company_name, type: 'business' as const })),
      ...(riders || []).map(r => ({ id: r.id, name: r.full_name, type: 'rider' as const })),
    ];
    setRecipients(list);
  };

  const sendNewThread = async () => {
    if (!selectedRecipient || !newSubject.trim() || !newBody.trim() || !user) {
      setComposeError('Please fill in all fields.'); return;
    }
    setComposeSending(true);
    setComposeError('');
    const { data: thread, error: te } = await supabase.from('message_threads').insert({
      recipient_type: selectedRecipient.type,
      recipient_id: selectedRecipient.id,
      subject: newSubject.trim(),
    }).select().maybeSingle();
    if (te || !thread) { setComposeError('Failed to create thread.'); setComposeSending(false); return; }
    const { error: me } = await supabase.from('messages').insert({
      thread_id: thread.id,
      sender_role: 'admin',
      sender_id: user.id,
      body: newBody.trim(),
      is_read: false,
    });
    if (me) { setComposeError('Failed to send message.'); setComposeSending(false); return; }
    closeCompose();
    await loadThreads();
    setComposeSending(false);
  };

  const closeCompose = () => {
    setComposing(false);
    setSelectedRecipient(null);
    setRecipientSearch('');
    setRecipients([]);
    setNewSubject('');
    setNewBody('');
    setComposeError('');
  };

  const filtered = threads.filter(t =>
    (t.recipient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fmt = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // ── Thread list panel ──────────────────────────────────────────────────────
  const ThreadList = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden md:rounded-2xl md:border md:border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <MessageSquare className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No conversations yet</p>
          </div>
        ) : filtered.map(t => (
          <button key={t.id} onClick={() => openThread(t)}
            className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${activeThread?.id === t.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.recipient_type === 'agent' ? 'bg-orange-100' : t.recipient_type === 'rider' ? 'bg-red-100' : 'bg-blue-100'}`}>
                {t.recipient_type === 'agent'
                  ? <User className="h-4 w-4 text-orange-600" />
                  : t.recipient_type === 'rider'
                  ? <Bike className="h-4 w-4 text-red-600" />
                  : <Building2 className="h-4 w-4 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate">{t.recipient_name}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{fmt(t.updated_at)}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{t.subject}</p>
                {t.last_message && <p className="text-xs text-gray-400 truncate mt-0.5">{t.last_message}</p>}
              </div>
              {(t.unread_count || 0) > 0 && (
                <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {t.unread_count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Message area panel ─────────────────────────────────────────────────────
  const MessageArea = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden md:rounded-2xl md:border md:border-gray-100">
      {activeThread ? (
        <>
          {/* Thread header — back button visible on mobile */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden p-1.5 -ml-1 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${activeThread.recipient_type === 'agent' ? 'bg-orange-100' : activeThread.recipient_type === 'rider' ? 'bg-red-100' : 'bg-blue-100'}`}>
              {activeThread.recipient_type === 'agent'
                ? <User className="h-4 w-4 text-orange-600" />
                : activeThread.recipient_type === 'rider'
                ? <Bike className="h-4 w-4 text-red-600" />
                : <Building2 className="h-4 w-4 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{activeThread.recipient_name}</p>
              <p className="text-xs text-gray-500 truncate">{activeThread.subject}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${activeThread.recipient_type === 'agent' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              {activeThread.recipient_type}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(msg => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] sm:max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isAdmin
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.body}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-xs text-gray-400">{fmt(msg.created_at)}</span>
                      {isAdmin && (msg.is_read
                        ? <CheckCheck className="h-3 w-3 text-blue-400" />
                        : <Check className="h-3 w-3 text-gray-400" />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply bar */}
          <div className="px-3 py-3 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Type a message..."
                rows={2}
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600 mb-1">Select a conversation</p>
          <p className="text-gray-400 text-sm">Choose a thread from the list or start a new message</p>
          <button
            onClick={() => setComposing(true)}
            className="mt-6 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
          >
            <Plus className="h-4 w-4" /> New Message
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Private Messages</h1>
            </div>
          </div>
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Message</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-0 sm:px-4 py-0 sm:py-6 flex flex-col">

        {/* Desktop: side-by-side */}
        <div className="hidden md:flex gap-4 h-[calc(100vh-140px)]">
          <div className="w-80 flex-shrink-0"><ThreadList /></div>
          <div className="flex-1"><MessageArea /></div>
        </div>

        {/* Mobile: single panel, toggle between list and thread */}
        <div className="md:hidden flex-1 h-[calc(100vh-65px)]">
          {mobileView === 'list' ? <ThreadList /> : <MessageArea />}
        </div>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Message</h2>
              <button onClick={closeCompose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4 overflow-y-auto">
              {composeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm">{composeError}</div>
              )}

              {/* Recipient picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
                {selectedRecipient ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedRecipient.type === 'agent' ? 'bg-orange-100' : selectedRecipient.type === 'rider' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      {selectedRecipient.type === 'agent' ? <User className="h-3 w-3 text-orange-600" /> : selectedRecipient.type === 'rider' ? <Bike className="h-3 w-3 text-red-600" /> : <Building2 className="h-3 w-3 text-blue-600" />}
                    </div>
                    <span className="text-sm font-medium text-gray-800 flex-1">{selectedRecipient.name}</span>
                    <span className="text-xs text-gray-500 capitalize">{selectedRecipient.type}</span>
                    <button onClick={() => setSelectedRecipient(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={recipientSearch}
                      onChange={e => { setRecipientSearch(e.target.value); if (e.target.value.length > 0) loadRecipients(e.target.value); else setRecipients([]); }}
                      placeholder="Search agents or businesses..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {recipients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {recipients.map(r => (
                          <button key={r.id} onClick={() => { setSelectedRecipient(r); setRecipients([]); setRecipientSearch(''); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.type === 'agent' ? 'bg-orange-100' : r.type === 'rider' ? 'bg-red-100' : 'bg-blue-100'}`}>
                              {r.type === 'agent' ? <User className="h-3.5 w-3.5 text-orange-600" /> : r.type === 'rider' ? <Bike className="h-3.5 w-3.5 text-red-600" /> : <Building2 className="h-3.5 w-3.5 text-blue-600" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{r.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{r.type}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="Message subject..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeCompose}
                className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">
                Cancel
              </button>
              <button onClick={sendNewThread} disabled={composeSending}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50">
                {composeSending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
