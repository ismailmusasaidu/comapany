import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Bike, MapPin, Package, Star, User, Phone,
  CheckCircle, XCircle, Clock, RefreshCw, Zap, Navigation,
  ChevronDown, ChevronUp, Search, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

type AssignmentStatus = 'unassigned' | 'pending' | 'accepted' | 'rejected';

interface UnifiedBooking {
  id: string;
  booking_ref: string;
  source_table: 'delivery' | 'business';
  sender_name: string;
  sender_phone: string;
  pickup_city: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_city: string;
  package_type: string;
  vehicle_type: string | null;
  delivery_type: string;
  status: string;
  assigned_rider_id: string | null;
  assignment_status: AssignmentStatus;
  assignment_note: string | null;
  assigned_at: string | null;
  created_at: string;
}

interface RiderProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  vehicle_type: string;
  status: string;
}

interface RiderLocation {
  rider_id: string;
  latitude: number;
  longitude: number;
  city: string | null;
  updated_at: string;
}

interface RiderStats {
  avg_rating: number;
  rating_count: number;
  active_assignments: number;
}

// ── Nigerian city coordinates for proximity scoring ───────────────────────────

const CITY_COORDS: Record<string, [number, number]> = {
  'lagos': [6.5244, 3.3792], 'abuja': [9.0765, 7.3986], 'kano': [12.0022, 8.5919],
  'ibadan': [7.3776, 3.9470], 'port harcourt': [4.8396, 7.0498], 'kaduna': [10.5222, 7.4383],
  'enugu': [6.4584, 7.5464], 'benin city': [6.3350, 5.6037], 'maiduguri': [11.8333, 13.1500],
  'zaria': [11.0641, 7.6901], 'aba': [5.1066, 7.3667], 'onitsha': [6.1445, 6.7869],
  'warri': [5.5167, 5.7500], 'jos': [9.9285, 8.8921], 'ilorin': [8.4966, 4.5426],
  'abeokuta': [7.1608, 3.3476], 'sokoto': [13.0531, 5.2411], 'uyo': [5.0480, 7.9150],
  'calabar': [4.9517, 8.3220], 'asaba': [6.2088, 6.7335],
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function riderScore(rider: RiderProfile, booking: UnifiedBooking, loc: RiderLocation | null, stats: RiderStats, pickupCoords: [number, number] | null): number {
  let score = 0;
  if (rider.vehicle_type === booking.vehicle_type) score += 30;
  if (rider.city.toLowerCase() === booking.pickup_city.toLowerCase()) score += 20;
  if (loc && pickupCoords) {
    const dist = haversineKm(loc.latitude, loc.longitude, pickupCoords[0], pickupCoords[1]);
    score += Math.max(0, 20 - dist / 10);
  } else if (loc) score += 5;
  score += (stats.avg_rating || 0) * 4;
  score -= stats.active_assignments * 5;
  return score;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  unassigned: { label: 'Unassigned', cls: 'bg-gray-100 text-gray-600' },
  pending:    { label: 'Awaiting',   cls: 'bg-yellow-100 text-yellow-700' },
  accepted:   { label: 'Accepted',   cls: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rejected',   cls: 'bg-red-100 text-red-700' },
};

const DELIVERY_STATUS_BADGE: Record<string, string> = {
  pending:    'bg-yellow-50 text-yellow-700',
  confirmed:  'bg-blue-50 text-blue-700',
  picked_up:  'bg-purple-50 text-purple-700',
  in_transit: 'bg-orange-50 text-orange-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-700',
};

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function ago(d: string) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Star rating component ─────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`h-7 w-7 transition-colors ${n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<UnifiedBooking[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [locations, setLocations] = useState<Record<string, RiderLocation>>({});
  const [riderStats, setRiderStats] = useState<Record<string, RiderStats>>({});
  const [riderMap, setRiderMap] = useState<Record<string, RiderProfile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | AssignmentStatus>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Assign modal
  const [assignTarget, setAssignTarget] = useState<UnifiedBooking | null>(null);
  const [riderSearch, setRiderSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  // Rate modal
  const [rateTarget, setRateTarget] = useState<{ booking: UnifiedBooking; rider: RiderProfile } | null>(null);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingDone, setRatingDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: del }, { data: biz }, { data: riderRows }, { data: locRows }, { data: ratingRows }] = await Promise.all([
      supabase.from('delivery_bookings').select('id,booking_ref,sender_name,sender_phone,pickup_city,recipient_name,recipient_phone,delivery_city,package_type,vehicle_type,delivery_type,status,assigned_rider_id,assignment_status,assignment_note,assigned_at,created_at').order('created_at', { ascending: false }),
      supabase.from('business_delivery_bookings').select('id,booking_ref,sender_name,sender_phone,pickup_city,recipient_name,recipient_phone,delivery_city,package_type,vehicle_type,delivery_type,status,assigned_rider_id,assignment_status,assignment_note,assigned_at,created_at').order('created_at', { ascending: false }),
      supabase.from('rider_profiles').select('id,full_name,email,phone,city,vehicle_type,status').eq('status', 'approved'),
      supabase.from('rider_locations').select('*'),
      supabase.from('rider_ratings').select('rider_id,rating'),
    ]);

    const merged: UnifiedBooking[] = [
      ...(del ?? []).map(b => ({ ...b, source_table: 'delivery' as const, assignment_status: (b.assignment_status || 'unassigned') as AssignmentStatus })),
      ...(biz ?? []).map(b => ({ ...b, source_table: 'business' as const, assignment_status: (b.assignment_status || 'unassigned') as AssignmentStatus })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setBookings(merged);

    const approved = riderRows ?? [];
    setRiders(approved);
    const rm: Record<string, RiderProfile> = {};
    for (const r of approved) rm[r.id] = r;
    setRiderMap(rm);

    const lm: Record<string, RiderLocation> = {};
    for (const l of locRows ?? []) lm[l.rider_id] = l;
    setLocations(lm);

    // Compute per-rider stats
    const sumMap: Record<string, { sum: number; count: number }> = {};
    for (const r of ratingRows ?? []) {
      if (!sumMap[r.rider_id]) sumMap[r.rider_id] = { sum: 0, count: 0 };
      sumMap[r.rider_id].sum += r.rating;
      sumMap[r.rider_id].count++;
    }
    const activeCounts: Record<string, number> = {};
    for (const b of merged) {
      if (b.assigned_rider_id && (b.assignment_status === 'pending' || b.assignment_status === 'accepted')) {
        activeCounts[b.assigned_rider_id] = (activeCounts[b.assigned_rider_id] || 0) + 1;
      }
    }
    const sm: Record<string, RiderStats> = {};
    for (const r of approved) {
      const s = sumMap[r.id];
      sm[r.id] = {
        avg_rating: s ? s.sum / s.count : 0,
        rating_count: s?.count ?? 0,
        active_assignments: activeCounts[r.id] ?? 0,
      };
    }
    setRiderStats(sm);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const counts = {
    all: bookings.length,
    unassigned: bookings.filter(b => b.assignment_status === 'unassigned').length,
    pending: bookings.filter(b => b.assignment_status === 'pending').length,
    accepted: bookings.filter(b => b.assignment_status === 'accepted').length,
    rejected: bookings.filter(b => b.assignment_status === 'rejected').length,
  };

  const visible = bookings.filter(b => {
    if (filter !== 'all' && b.assignment_status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.booking_ref.toLowerCase().includes(q) ||
        b.sender_name.toLowerCase().includes(q) ||
        b.recipient_name.toLowerCase().includes(q) ||
        b.pickup_city.toLowerCase().includes(q) ||
        b.delivery_city.toLowerCase().includes(q);
    }
    return true;
  });

  // Sorted riders for assign modal
  const sortedRiders = (() => {
    if (!assignTarget) return [];
    const pickupKey = assignTarget.pickup_city.toLowerCase();
    const pickupCoords = CITY_COORDS[pickupKey] ?? null;
    return [...riders]
      .filter(r => !riderSearch || r.full_name.toLowerCase().includes(riderSearch.toLowerCase()) || r.city.toLowerCase().includes(riderSearch.toLowerCase()))
      .map(r => ({ rider: r, score: riderScore(r, assignTarget, locations[r.id] ?? null, riderStats[r.id] ?? { avg_rating: 0, rating_count: 0, active_assignments: 0 }, pickupCoords) }))
      .sort((a, b) => b.score - a.score);
  })();

  // ── Actions ───────────────────────────────────────────────────────────────────

  const assignRider = async (riderId: string) => {
    if (!assignTarget) return;
    setAssigning(true); setAssignError('');
    try {
      const table = assignTarget.source_table === 'delivery' ? 'delivery_bookings' : 'business_delivery_bookings';
      const { error } = await supabase.from(table).update({
        assigned_rider_id: riderId,
        assignment_status: 'pending',
        assignment_note: null,
        assigned_at: new Date().toISOString(),
      }).eq('id', assignTarget.id);
      if (error) throw error;

      const rider = riderMap[riderId];
      await supabase.from('rider_notifications').insert({
        rider_id: riderId,
        title: 'New Delivery Assignment',
        message: `You have been assigned booking ${assignTarget.booking_ref} from ${assignTarget.pickup_city} to ${assignTarget.delivery_city}.`,
        type: 'assignment',
        booking_id: assignTarget.id,
        booking_type: assignTarget.source_table,
      });

      setBookings(prev => prev.map(b =>
        b.id === assignTarget.id
          ? { ...b, assigned_rider_id: riderId, assignment_status: 'pending', assignment_note: null, assigned_at: new Date().toISOString() }
          : b
      ));
      setRiderStats(prev => ({
        ...prev,
        [riderId]: { ...prev[riderId], active_assignments: (prev[riderId]?.active_assignments ?? 0) + 1 },
      }));
      // Decrement previous rider's active count if reassigning
      const prevRiderId = assignTarget.assigned_rider_id;
      if (prevRiderId && prevRiderId !== riderId) {
        setRiderStats(prev => ({
          ...prev,
          [prevRiderId]: { ...prev[prevRiderId], active_assignments: Math.max(0, (prev[prevRiderId]?.active_assignments ?? 1) - 1) },
        }));
      }
      setAssignTarget(null);
      console.log(`Assigned ${rider?.full_name ?? riderId} to ${assignTarget.booking_ref}`);
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const submitRating = async () => {
    if (!rateTarget || ratingVal === 0) return;
    setRatingLoading(true); setRatingError('');
    try {
      const { error } = await supabase.from('rider_ratings').upsert({
        rider_id: rateTarget.rider.id,
        booking_id: rateTarget.booking.id,
        booking_type: rateTarget.booking.source_table,
        rating: ratingVal,
        comment: ratingComment.trim() || null,
      }, { onConflict: 'booking_id,booking_type' });
      if (error) throw error;
      setRatingDone(rateTarget.booking.id);
      setRateTarget(null); setRatingVal(0); setRatingComment('');
      load();
    } catch (e) {
      setRatingError(e instanceof Error ? e.message : 'Rating failed');
    } finally {
      setRatingLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const FILTERS: { key: string; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'unassigned', label: `Unassigned (${counts.unassigned})` },
    { key: 'pending', label: `Awaiting (${counts.pending})` },
    { key: 'accepted', label: `Accepted (${counts.accepted})` },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bike className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Booking Assignments</h1>
              <p className="text-xs text-gray-500">Assign riders to deliveries</p>
            </div>
          </div>
          {counts.unassigned > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {counts.unassigned} unassigned
            </span>
          )}
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by ref, name or city..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f.key ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Booking list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(booking => {
              const ab = STATUS_BADGE[booking.assignment_status] ?? STATUS_BADGE.unassigned;
              const assignedRider = booking.assigned_rider_id ? riderMap[booking.assigned_rider_id] : null;
              const expanded = expandedId === booking.id;
              const canRate = booking.assignment_status === 'accepted' && booking.status === 'delivered' && assignedRider && !ratingDone?.includes(booking.id);

              return (
                <div key={`${booking.source_table}-${booking.id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 text-sm">{booking.booking_ref}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${booking.source_table === 'business' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                            {booking.source_table === 'business' ? 'Business' : 'Agent/Individual'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DELIVERY_STATUS_BADGE[booking.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {cap(booking.status)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ab.cls}`}>
                            {ab.label}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">{ago(booking.created_at)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <MapPin className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                          <span className="font-medium">{booking.pickup_city}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">{booking.delivery_city}</span>
                          {booking.vehicle_type && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-1">{cap(booking.vehicle_type)}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{booking.sender_name} → {booking.recipient_name}</span>
                          <span className="text-gray-300">|</span>
                          <span>{cap(booking.package_type)}</span>
                        </div>

                        {assignedRider && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                              <Bike className="h-3 w-3 text-orange-600" />
                            </div>
                            <span className="font-medium text-gray-700">{assignedRider.full_name}</span>
                            <span className="text-gray-400">{assignedRider.phone}</span>
                            {booking.assignment_note && (
                              <span className="text-red-500 italic">— "{booking.assignment_note}"</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setAssignTarget(booking); setRiderSearch(''); setAssignError(''); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            booking.assignment_status === 'unassigned'
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : booking.assignment_status === 'rejected'
                              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Bike className="h-3.5 w-3.5" />
                          {booking.assignment_status === 'unassigned' ? 'Assign Rider' :
                           booking.assignment_status === 'rejected' ? 'Reassign' : 'Change Rider'}
                        </button>

                        {canRate && (
                          <button
                            onClick={() => { setRateTarget({ booking, rider: assignedRider! }); setRatingVal(0); setRatingComment(''); setRatingError(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-all"
                          >
                            <Star className="h-3.5 w-3.5" /> Rate Rider
                          </button>
                        )}

                        <button onClick={() => setExpandedId(expanded ? null : booking.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Sender</p>
                          <p className="text-gray-700 font-medium">{booking.sender_name}</p>
                          <p className="text-gray-500">{booking.sender_phone}</p>
                          <p className="text-gray-500">{booking.pickup_city}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Recipient</p>
                          <p className="text-gray-700 font-medium">{booking.recipient_name}</p>
                          <p className="text-gray-500">{booking.recipient_phone}</p>
                          <p className="text-gray-500">{booking.delivery_city}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Assign Rider Modal ─────────────────────────────────────────────── */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Assign Rider</h3>
                <p className="text-xs text-gray-500">{assignTarget.booking_ref} · {assignTarget.pickup_city} → {assignTarget.delivery_city}</p>
              </div>
              <button onClick={() => setAssignTarget(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={riderSearch} onChange={e => setRiderSearch(e.target.value)}
                  placeholder="Search riders by name or city..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              {assignTarget.vehicle_type && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                  Sorted by best match — vehicle type, city proximity, rating &amp; workload
                </p>
              )}
            </div>

            {assignError && (
              <div className="px-5 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100">{assignError}</div>
            )}

            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {riders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No approved riders available</p>
                </div>
              ) : sortedRiders.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No riders match your search</div>
              ) : (
                sortedRiders.map(({ rider, score }) => {
                  const stats = riderStats[rider.id] ?? { avg_rating: 0, rating_count: 0, active_assignments: 0 };
                  const loc = locations[rider.id];
                  const vehicleMatch = rider.vehicle_type === assignTarget.vehicle_type;
                  const cityMatch = rider.city.toLowerCase() === assignTarget.pickup_city.toLowerCase();
                  const isCurrentRider = rider.id === assignTarget.assigned_rider_id;

                  return (
                    <div key={rider.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCurrentRider ? 'border-orange-300 bg-orange-50' : 'border-gray-100 hover:border-orange-200 bg-white hover:bg-orange-50/30'}`}>
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bike className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{rider.full_name}</p>
                          {isCurrentRider && <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full">Current</span>}
                          {vehicleMatch && <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Vehicle match</span>}
                          {cityMatch && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Same city</span>}
                          {loc && <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Navigation className="h-2.5 w-2.5" />GPS</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span>{cap(rider.vehicle_type)}</span>
                          <span className="text-gray-300">·</span>
                          <span>{rider.city}</span>
                          <span className="text-gray-300">·</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            {stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '—'}
                            {stats.rating_count > 0 && ` (${stats.rating_count})`}
                          </span>
                          {stats.active_assignments > 0 && (
                            <span className="text-orange-600">{stats.active_assignments} active</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-orange-400 to-green-400 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">{Math.round(score)}pts</span>
                        </div>
                      </div>
                      <button onClick={() => assignRider(rider.id)} disabled={assigning}
                        className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0">
                        {assigning ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Assign
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rate Rider Modal ───────────────────────────────────────────────── */}
      {rateTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Rate Rider</h3>
                <p className="text-xs text-gray-500">{rateTarget.rider.full_name} — {rateTarget.booking.booking_ref}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">How did the rider perform?</p>
              <StarPicker value={ratingVal} onChange={setRatingVal} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment (optional)</label>
              <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                rows={2} placeholder="Fast delivery, handled with care..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
            </div>

            {ratingError && <p className="text-sm text-red-600">{ratingError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setRateTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={submitRating} disabled={ratingVal === 0 || ratingLoading}
                className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {ratingLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Star className="h-4 w-4 fill-white" />}
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
