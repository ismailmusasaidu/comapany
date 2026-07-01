import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Bike, Users, CheckCircle, XCircle, Clock,
  Search, Eye, MapPin, Phone, RefreshCw,
  ChevronDown, AlertCircle, UserCheck, UserX, Car, CreditCard, Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type RiderStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface Rider {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  nin: string;
  vehicle_type: string;
  vehicle_registration: string;
  guarantor_name: string;
  guarantor_phone: string;
  status: string;
  rejection_reason: string;
  created_at: string;
}

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: '🏍️ Motorcycle',
  bicycle:    '🚲 Bicycle',
  tricycle:   '🛺 Tricycle',
  car:        '🚗 Car',
};

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pending:  Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RiderStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => { fetchRiders(); }, []);

  const fetchRiders = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('rider_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    const rows = data ?? [];
    setRiders(rows);
    setStats({
      total:    rows.length,
      pending:  rows.filter(r => r.status === 'pending').length,
      approved: rows.filter(r => r.status === 'approved').length,
      rejected: rows.filter(r => r.status === 'rejected').length,
    });
    setLoading(false);
  };

  const approveRider = async (id: string) => {
    setActionLoading(true);
    setError('');
    const { error: err } = await supabase
      .from('rider_profiles')
      .update({ status: 'approved', rejection_reason: '', updated_at: new Date().toISOString() })
      .eq('id', id);
    setActionLoading(false);
    if (err) { setError(err.message); return; }
    setSelectedRider(null);
    await fetchRiders();
  };

  const rejectRider = async (id: string, reason: string) => {
    if (!reason.trim()) { setError('Please provide a rejection reason.'); return; }
    setActionLoading(true);
    setError('');
    const { error: err } = await supabase
      .from('rider_profiles')
      .update({ status: 'rejected', rejection_reason: reason.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    setActionLoading(false);
    if (err) { setError(err.message); return; }
    setSelectedRider(null);
    setRejectionReason('');
    await fetchRiders();
  };

  const filtered = riders.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Bike className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Rider Management</h1>
              <p className="text-xs text-gray-500">Review and approve delivery rider applications</p>
            </div>
          </div>
          <button
            onClick={fetchRiders}
            className="ml-auto p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',    value: stats.total,    color: 'text-gray-700',   bg: 'bg-gray-100',  icon: Users },
            { label: 'Pending',  value: stats.pending,  color: 'text-yellow-700', bg: 'bg-yellow-50', icon: Clock },
            { label: 'Approved', value: stats.approved, color: 'text-green-700',  bg: 'bg-green-50',  icon: UserCheck },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-700',    bg: 'bg-red-50',    icon: UserX },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">{s.label}</p>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or city..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as RiderStatus)}
              className="w-full sm:w-44 pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Riders</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Bike className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="font-semibold text-gray-400">No riders found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No rider applications yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-6 py-3">Rider</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">City</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Vehicle</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Applied</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(rider => {
                    const SIcon = STATUS_ICON[rider.status] ?? Clock;
                    return (
                      <tr key={rider.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">{rider.full_name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{rider.full_name}</p>
                              <p className="text-xs text-gray-500">{rider.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />{rider.city}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-sm text-gray-600">{VEHICLE_LABELS[rider.vehicle_type] ?? rider.vehicle_type}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_BADGE[rider.status] ?? STATUS_BADGE.pending}`}>
                            <SIcon className="h-3 w-3" />
                            {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-xs text-gray-500">
                            {new Date(rider.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => { setSelectedRider(rider); setRejectionReason(rider.rejection_reason || ''); setError(''); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500">{filtered.length} rider{filtered.length !== 1 ? 's' : ''} shown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRider(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-5 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{selectedRider.full_name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{selectedRider.full_name}</h2>
                  <p className="text-green-100 text-sm">{selectedRider.email}</p>
                </div>
                <span className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 text-white">
                  {selectedRider.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <ModalField icon={Phone}      label="Phone"        value={selectedRider.phone} />
                <ModalField icon={MapPin}     label="City"         value={selectedRider.city} />
                <ModalField icon={MapPin}     label="Address"      value={selectedRider.address} />
                <ModalField icon={CreditCard} label="NIN"          value={selectedRider.nin} />
                <ModalField icon={Car}        label="Vehicle"      value={VEHICLE_LABELS[selectedRider.vehicle_type] ?? selectedRider.vehicle_type} />
                <ModalField icon={Car}        label="Plate No."    value={selectedRider.vehicle_registration || '—'} />
                <ModalField icon={Shield}     label="Guarantor"    value={selectedRider.guarantor_name} />
                <ModalField icon={Phone}      label="G. Phone"     value={selectedRider.guarantor_phone} />
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Applied</p>
                <p className="text-sm text-gray-800">
                  {new Date(selectedRider.created_at).toLocaleDateString('en-NG', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>

              {(selectedRider.status === 'pending' || selectedRider.status === 'approved') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason <span className="text-gray-400 font-normal">(required to reject)</span>
                  </label>
                  <textarea
                    rows={3} value={rejectionReason}
                    onChange={e => { setRejectionReason(e.target.value); setError(''); }}
                    placeholder="e.g. Incomplete documents. NIN could not be verified."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {selectedRider.status === 'rejected' && selectedRider.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selectedRider.rejection_reason}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {selectedRider.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approveRider(selectedRider.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                    >
                      {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                      Approve Rider
                    </button>
                    <button
                      onClick={() => rejectRider(selectedRider.id, rejectionReason)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                    >
                      {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                      Reject
                    </button>
                  </>
                )}
                {selectedRider.status === 'approved' && (
                  <button
                    onClick={() => rejectRider(selectedRider.id, rejectionReason)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                  >
                    {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                    Revoke Approval
                  </button>
                )}
                {selectedRider.status === 'rejected' && (
                  <button
                    onClick={() => approveRider(selectedRider.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
                  >
                    {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    Re-approve Rider
                  </button>
                )}
                <button
                  onClick={() => { setSelectedRider(null); setRejectionReason(''); setError(''); }}
                  className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalField({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <p className="text-xs font-semibold text-gray-500">{label}</p>
      </div>
      <p className="text-sm font-medium text-gray-800 break-words">{value || '—'}</p>
    </div>
  );
}
