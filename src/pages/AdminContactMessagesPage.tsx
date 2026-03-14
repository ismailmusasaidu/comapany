import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader, Trash2, Mail, User, Tag, Clock, Eye, EyeOff } from 'lucide-react';

interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  service_interest: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminContactMessagesPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setMessages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const markRead = async (id: string, is_read: boolean) => {
    const { error: err } = await supabase
      .from('contact_messages')
      .update({ is_read })
      .eq('id', id);
    if (!err) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read } : m));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, is_read } : prev);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    const { error: err } = await supabase.from('contact_messages').delete().eq('id', id);
    if (!err) {
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.is_read) markRead(msg.id, true);
  };

  const filtered = messages.filter(m =>
    filter === 'all' ? true : filter === 'unread' ? !m.is_read : m.is_read
  );

  const unreadCount = messages.filter(m => !m.is_read).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Customer Messages</h1>
            {unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f} {f === 'all' ? `(${messages.length})` : f === 'unread' ? `(${unreadCount})` : `(${messages.length - unreadCount})`}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Message list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
                No messages yet.
              </div>
            ) : (
              filtered.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => openMessage(msg)}
                  className={`w-full text-left bg-white rounded-xl border transition-all duration-200 p-4 hover:shadow-md ${
                    selected?.id === msg.id
                      ? 'border-orange-400 shadow-md ring-2 ring-orange-400/20'
                      : 'border-gray-200'
                  } ${!msg.is_read ? 'border-l-4 border-l-orange-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!msg.is_read && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
                        )}
                        <span className={`font-semibold text-slate-900 truncate ${!msg.is_read ? 'font-bold' : ''}`}>
                          {msg.full_name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{msg.email}</p>
                      <p className="text-sm text-gray-600 mt-1 truncate">{msg.message}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(msg.created_at)}</span>
                      <div className="mt-1">
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {msg.service_interest}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Message Detail</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markRead(selected.id, !selected.is_read)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-orange-300"
                    title={selected.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {selected.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {selected.is_read ? 'Unread' : 'Read'}
                  </button>
                  <button
                    onClick={() => deleteMessage(selected.id)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Full Name</p>
                    <p className="text-slate-800 font-semibold">{selected.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Email</p>
                    <a href={`mailto:${selected.email}`} className="text-orange-500 font-semibold hover:underline">
                      {selected.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Service Interest</p>
                    <p className="text-slate-800 font-semibold">{selected.service_interest}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Received</p>
                    <p className="text-slate-800 font-semibold">{formatDate(selected.created_at)}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Message</p>
                <div className="bg-gray-50 rounded-xl p-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>

              <a
                href={`mailto:${selected.email}?subject=Re: ${selected.service_interest} Inquiry`}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-bold transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-orange-500/25"
              >
                <Mail className="h-4 w-4" />
                Reply via Email
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 flex flex-col items-center justify-center text-center text-gray-400">
              <Mail className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
