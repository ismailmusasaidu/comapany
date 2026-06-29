import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageSquare, Check, CheckCheck, LogOut } from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { supabase } from '../lib/supabase';

interface Thread {
  id: string;
  subject: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_role: 'admin' | 'agent' | 'business';
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function AgentMessagesPage() {
  const { user, signOut } = useAgent();
  const navigate = useNavigate();
  const handleLogout = async () => { await signOut(); navigate('/agent/login'); };
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) loadThreads(); }, [user]);
  useEffect(() => { if (activeThread) loadMessages(activeThread.id); }, [activeThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadThreads = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('message_threads')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('recipient_type', 'agent')
      .order('updated_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    const enriched = await Promise.all(data.map(async (t) => {
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('thread_id', t.id).eq('is_read', false).eq('sender_role', 'admin');
      const { data: last } = await supabase.from('messages').select('body').eq('thread_id', t.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return { ...t, unread_count: count || 0, last_message: last?.body || '' };
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
      .eq('thread_id', threadId).eq('sender_role', 'admin');
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
      sender_role: 'agent',
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

  const fmt = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnread = threads.reduce((s, t) => s + (t.unread_count || 0), 0);

  const ThreadList = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden md:rounded-2xl md:border md:border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conversations</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <MessageSquare className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No messages yet</p>
            <p className="text-gray-300 text-xs mt-1">Admin will contact you here</p>
          </div>
        ) : threads.map(t => (
          <button key={t.id} onClick={() => openThread(t)}
            className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${activeThread?.id === t.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${(t.unread_count || 0) > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{t.subject}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{fmt(t.updated_at)}</span>
                </div>
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

  const MessageArea = () => (
    <div className="flex flex-col h-full bg-white overflow-hidden md:rounded-2xl md:border md:border-gray-100">
      {activeThread ? (
        <>
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3">
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden p-1.5 -ml-1 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{activeThread.subject}</p>
              <p className="text-xs text-gray-400 mt-0.5">Started {fmt(activeThread.created_at)}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map(msg => {
              const isMe = msg.sender_role === 'agent';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <p className="text-xs text-gray-400 px-1 font-medium">Admin</p>}
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.body}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-xs text-gray-400">{fmt(msg.created_at)}</span>
                      {isMe && (msg.is_read
                        ? <CheckCheck className="h-3 w-3 text-blue-400" />
                        : <Check className="h-3 w-3 text-gray-400" />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Reply to admin..."
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
          <p className="text-gray-400 text-sm">Messages from admin will appear here</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link to="/agent/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center relative">
              <MessageSquare className="h-4 w-4 text-white" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{totalUnread}</span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Messages from Admin</h1>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-0 sm:px-4 py-0 sm:py-6 flex flex-col">
        {/* Desktop: side-by-side */}
        <div className="hidden md:flex gap-4 h-[calc(100vh-140px)]">
          <div className="w-72 flex-shrink-0"><ThreadList /></div>
          <div className="flex-1"><MessageArea /></div>
        </div>

        {/* Mobile: single panel */}
        <div className="md:hidden flex-1 h-[calc(100vh-65px)]">
          {mobileView === 'list' ? <ThreadList /> : <MessageArea />}
        </div>
      </div>
    </div>
  );
}
