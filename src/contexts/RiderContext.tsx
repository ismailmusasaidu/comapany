import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RiderProfile {
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

export type AssignmentStatus = 'pending' | 'accepted' | 'rejected';

export interface AssignedBooking {
  id: string;
  booking_ref: string;
  source_table: 'delivery' | 'business';
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  pickup_city: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_city: string;
  package_type: string;
  package_description: string;
  vehicle_type: string | null;
  delivery_type: string;
  status: string;
  special_instructions: string | null;
  payment_method: string;
  assignment_status: AssignmentStatus;
  assignment_note: string | null;
  assigned_at: string;
  created_at: string;
}

export interface RiderNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  booking_id: string | null;
  booking_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface RiderRating {
  id: string;
  booking_id: string;
  booking_type: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface RiderLocation {
  latitude: number;
  longitude: number;
  city: string | null;
  updated_at: string;
}

interface RiderContextType {
  user: User | null;
  profile: RiderProfile | null;
  assignments: AssignedBooking[];
  notifications: RiderNotification[];
  unreadNotifications: number;
  ratings: RiderRating[];
  avgRating: number;
  location: RiderLocation | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  acceptAssignment: (bookingId: string, sourceTable: 'delivery' | 'business') => Promise<void>;
  rejectAssignment: (bookingId: string, sourceTable: 'delivery' | 'business', reason: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, sourceTable: 'delivery' | 'business', newStatus: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateLocation: (latitude: number, longitude: number, accuracy?: number) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [assignments, setAssignments] = useState<AssignedBooking[]>([]);
  const [notifications, setNotifications] = useState<RiderNotification[]>([]);
  const [ratings, setRatings] = useState<RiderRating[]>([]);
  const [location, setLocation] = useState<RiderLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('rider_profiles').select('*').eq('id', uid).maybeSingle();
    setProfile(data ?? null);
    return data;
  };

  const fetchAssignments = async (uid: string) => {
    const cols = 'id,booking_ref,sender_name,sender_phone,sender_address,pickup_city,recipient_name,recipient_phone,recipient_address,delivery_city,package_type,package_description,vehicle_type,delivery_type,status,special_instructions,payment_method,assignment_status,assignment_note,assigned_at,created_at';
    const [{ data: del }, { data: biz }] = await Promise.all([
      supabase.from('delivery_bookings').select(cols).eq('assigned_rider_id', uid).neq('assignment_status', 'unassigned').order('assigned_at', { ascending: false }),
      supabase.from('business_delivery_bookings').select(cols).eq('assigned_rider_id', uid).neq('assignment_status', 'unassigned').order('assigned_at', { ascending: false }),
    ]);
    const merged: AssignedBooking[] = [
      ...(del ?? []).map(b => ({ ...b, source_table: 'delivery' as const })),
      ...(biz ?? []).map(b => ({ ...b, source_table: 'business' as const })),
    ].sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());
    setAssignments(merged);
  };

  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase.from('rider_notifications').select('*').eq('rider_id', uid).order('created_at', { ascending: false }).limit(50);
    setNotifications(data ?? []);
  };

  const fetchRatings = async (uid: string) => {
    const { data } = await supabase.from('rider_ratings').select('id,booking_id,booking_type,rating,comment,created_at').eq('rider_id', uid).order('created_at', { ascending: false });
    setRatings(data ?? []);
  };

  const fetchLocation = async (uid: string) => {
    const { data } = await supabase.from('rider_locations').select('latitude,longitude,city,updated_at').eq('rider_id', uid).maybeSingle();
    setLocation(data ?? null);
  };

  const loadAll = async (uid: string) => {
    await Promise.all([fetchAssignments(uid), fetchNotifications(uid), fetchRatings(uid), fetchLocation(uid)]);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        if (p?.status === 'approved') await loadAll(session.user.id);
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          if (p?.status === 'approved') await loadAll(session.user.id);
        } else {
          setProfile(null);
          setAssignments([]);
          setNotifications([]);
          setRatings([]);
          setLocation(null);
        }
      })();
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!profile?.id || profile.status !== 'approved') return;
    const channel = supabase
      .channel(`rider-notifs-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rider_notifications', filter: `rider_id=eq.${profile.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as RiderNotification, ...prev]);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'delivery_bookings', filter: `assigned_rider_id=eq.${profile.id}` },
        () => { fetchAssignments(profile.id); }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'business_delivery_bookings', filter: `assigned_rider_id=eq.${profile.id}` },
        () => { fetchAssignments(profile.id); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, profile?.status]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const p = await fetchProfile(data.user.id);
      if (p?.status === 'approved') await loadAll(data.user.id);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setAssignments([]);
    setNotifications([]);
    setRatings([]);
    setLocation(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p?.status === 'approved') await loadAll(user.id);
  };

  const acceptAssignment = async (bookingId: string, sourceTable: 'delivery' | 'business') => {
    const table = sourceTable === 'delivery' ? 'delivery_bookings' : 'business_delivery_bookings';
    const { error } = await supabase.from(table).update({ assignment_status: 'accepted' }).eq('id', bookingId);
    if (error) throw error;
    setAssignments(prev => prev.map(a => a.id === bookingId ? { ...a, assignment_status: 'accepted' } : a));
  };

  const rejectAssignment = async (bookingId: string, sourceTable: 'delivery' | 'business', reason: string) => {
    const table = sourceTable === 'delivery' ? 'delivery_bookings' : 'business_delivery_bookings';
    const { error } = await supabase.from(table).update({ assignment_status: 'rejected', assignment_note: reason }).eq('id', bookingId);
    if (error) throw error;
    setAssignments(prev => prev.map(a => a.id === bookingId ? { ...a, assignment_status: 'rejected', assignment_note: reason } : a));
  };

  const updateBookingStatus = async (bookingId: string, sourceTable: 'delivery' | 'business', newStatus: string) => {
    // Optimistic update — change UI immediately so the button reflects the new state at once
    setAssignments(prev => prev.map(a => a.id === bookingId ? { ...a, status: newStatus } : a));
    const table = sourceTable === 'delivery' ? 'delivery_bookings' : 'business_delivery_bookings';
    await supabase.from(table).update({ status: newStatus }).eq('id', bookingId);
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('rider_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    if (!profile) return;
    await supabase.from('rider_notifications').update({ is_read: true }).eq('rider_id', profile.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const updateLocation = async (latitude: number, longitude: number, accuracy?: number) => {
    if (!profile) return;
    const payload = { rider_id: profile.id, latitude, longitude, accuracy: accuracy ?? null, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('rider_locations').upsert(payload, { onConflict: 'rider_id' });
    if (!error) setLocation({ latitude, longitude, city: location?.city ?? null, updated_at: payload.updated_at });
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;

  return (
    <RiderContext.Provider value={{
      user, profile, assignments, notifications, unreadNotifications, ratings, avgRating, location,
      isLoading, signIn, signOut, refreshProfile,
      acceptAssignment, rejectAssignment, updateBookingStatus, markNotificationRead, markAllNotificationsRead, updateLocation,
    }}>
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error('useRider must be used within RiderProvider');
  return ctx;
}
