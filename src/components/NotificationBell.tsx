import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Truck, Package, Building2, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AdminNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function kindIcon(kind: string) {
  if (kind.includes('delivery')) return { Icon: Truck, tint: 'text-orange-600 bg-orange-50' };
  if (kind.includes('logistics')) return { Icon: Package, tint: 'text-blue-600 bg-blue-50' };
  return { Icon: Building2, tint: 'text-slate-600 bg-slate-100' };
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const loadState = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('admin_notification_state')
      .select('last_read_at')
      .eq('user_id', user.id)
      .maybeSingle();
    setLastReadAt(data?.last_read_at ? new Date(data.last_read_at) : null);
  }, [user]);

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from('admin_notifications')
      .select('id, kind, title, body, link, created_at')
      .order('created_at', { ascending: false })
      .limit(25);
    setItems((data as AdminNotification[]) ?? []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadState(), loadItems()]);
    } finally {
      setLoading(false);
    }
  }, [loadState, loadItems]);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, () => {
        loadItems();
        loadState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, loadItems, loadState]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!lastReadAt) { setUnread(items.length); return; }
    setUnread(items.filter(it => new Date(it.created_at) > lastReadAt).length);
  }, [items, lastReadAt]);

  const markAllRead = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase
      .from('admin_notification_state')
      .upsert({ user_id: user.id, last_read_at: now }, { onConflict: 'user_id' });
    setLastReadAt(new Date(now));
    setUnread(0);
  };

  const handleItemClick = (item: AdminNotification) => {
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-orange-600 hover:border-orange-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(90vw,22rem)] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-scaleIn origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-900 text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              items.map(item => {
                const { Icon, tint } = kindIcon(item.kind);
                const isUnread = lastReadAt && new Date(item.created_at) > lastReadAt;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <span className={`flex-shrink-0 w-9 h-9 rounded-xl ${tint} flex items-center justify-center mt-0.5`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">{item.title}</span>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                      </span>
                      {item.body && <span className="block text-sm text-slate-500 mt-0.5 line-clamp-2">{item.body}</span>}
                      <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(item.created_at)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-[11px] text-slate-400">New bookings and logistics requests appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
