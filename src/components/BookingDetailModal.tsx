import { useState } from 'react';
import {
  X, Package, MapPin, Phone, User, Weight, DollarSign,
  FileText, CheckCircle, Truck, Clock, XCircle, ChevronRight,
  Building2, Calendar, Hash, StickyNote
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingDetail {
  id: string;
  booking_ref: string;
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
  weight_kg: number | null;
  declared_value: number | null;
  special_instructions: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent_profiles?: { full_name: string; company_name: string; phone: string; email: string } | null;
}

interface Props {
  booking: BookingDetail;
  onClose: () => void;
  isAdmin?: boolean;
  onStatusChange?: (id: string, status: string) => void;
}

const STATUS_STEPS = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:           { label: 'Pending',           color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200', icon: Clock },
  confirmed:         { label: 'Confirmed',         color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: CheckCircle },
  picked_up:         { label: 'Picked Up',         color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200', icon: Package },
  in_transit:        { label: 'In Transit',        color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', icon: Truck },
  out_for_delivery:  { label: 'Out for Delivery',  color: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',   icon: Truck },
  delivered:         { label: 'Delivered',         color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  icon: CheckCircle },
  cancelled:         { label: 'Cancelled',         color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    icon: XCircle },
};

const BOOKING_STATUS_OPTIONS = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function BookingDetailModal({ booking, onClose, isAdmin = false, onStatusChange }: Props) {
  const [status, setStatus] = useState(booking.status);
  const [saving, setSaving] = useState(false);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const currentStepIdx = STATUS_STEPS.indexOf(status);
  const isCancelled = status === 'cancelled';

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    await supabase.from('delivery_bookings').update({ status: newStatus }).eq('id', booking.id);
    setStatus(newStatus);
    onStatusChange?.(booking.id, newStatus);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 border-b ${cfg.border} ${cfg.bg} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white/60 border ${cfg.border}`}>
              <Icon className={`h-5 w-5 ${cfg.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-lg">{booking.booking_ref}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'delivered' ? 'bg-green-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`} />
                  {cfg.label}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">Created {fmtDate(booking.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-xl transition-colors text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Progress stepper */}
          {!isCancelled && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Delivery Progress</p>
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 hidden sm:block">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
                    style={{ width: currentStepIdx >= 0 ? `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                  />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    const scfg = STATUS_CONFIG[step];
                    const StepIcon = scfg.icon;
                    const done = idx <= currentStepIdx;
                    const active = idx === currentStepIdx;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? (active ? 'bg-orange-500 border-orange-500 text-white shadow shadow-orange-200' : 'bg-green-500 border-green-500 text-white') : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          <StepIcon className="h-3.5 w-3.5" />
                        </div>
                        <p className={`text-xs font-medium text-center leading-tight hidden sm:block ${active ? 'text-orange-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                          {scfg.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Route summary */}
          <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Pickup</p>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <p className="text-white font-semibold text-sm truncate">{booking.pickup_city}</p>
              </div>
              <p className="text-gray-400 text-xs mt-0.5 truncate">{booking.sender_address}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Delivery</p>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-white font-semibold text-sm truncate">{booking.delivery_city}</p>
              </div>
              <p className="text-gray-400 text-xs mt-0.5 truncate">{booking.recipient_address}</p>
            </div>
          </div>

          {/* Sender & Recipient */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Sender
              </p>
              <div className="space-y-2">
                <InfoRow icon={User} label="Name" value={booking.sender_name} />
                <InfoRow icon={Phone} label="Phone" value={booking.sender_phone} />
                <InfoRow icon={MapPin} label="Address" value={booking.sender_address} />
              </div>
            </div>
            <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Recipient
              </p>
              <div className="space-y-2">
                <InfoRow icon={User} label="Name" value={booking.recipient_name} />
                <InfoRow icon={Phone} label="Phone" value={booking.recipient_phone} />
                <InfoRow icon={MapPin} label="Address" value={booking.recipient_address} />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Package Details
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <InfoRow icon={Hash} label="Type" value={cap(booking.package_type)} />
              <InfoRow icon={FileText} label="Description" value={booking.package_description} />
              {booking.weight_kg !== null && <InfoRow icon={Weight} label="Weight" value={`${booking.weight_kg} kg`} />}
              {booking.declared_value !== null && <InfoRow icon={DollarSign} label="Declared Value" value={`₦${booking.declared_value.toLocaleString()}`} />}
            </div>
            {booking.special_instructions && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                <StickyNote className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-600 font-medium mb-0.5">Special Instructions</p>
                  <p className="text-sm text-amber-800">{booking.special_instructions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Agent info (admin only) */}
          {isAdmin && booking.agent_profiles && (
            <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Agent
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <InfoRow icon={User} label="Name" value={booking.agent_profiles.full_name} />
                <InfoRow icon={Building2} label="Company" value={booking.agent_profiles.company_name} />
                <InfoRow icon={Phone} label="Phone" value={booking.agent_profiles.phone} />
                <InfoRow icon={FileText} label="Email" value={booking.agent_profiles.email} />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created: {fmtDate(booking.created_at)}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Updated: {fmtDate(booking.updated_at)}</span>
          </div>
        </div>

        {/* Footer — admin status control */}
        {isAdmin && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-700">Update Status:</p>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {BOOKING_STATUS_OPTIONS.map(s => {
                  const scfg = STATUS_CONFIG[s];
                  const active = status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={saving || active}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        active
                          ? `${scfg.bg} ${scfg.border} ${scfg.color} cursor-default`
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {saving && active ? '...' : scfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 leading-snug">{value || '—'}</p>
      </div>
    </div>
  );
}
