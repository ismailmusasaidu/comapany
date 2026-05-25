import { useRef } from 'react';
import { X, Printer, Download, Truck, Package } from 'lucide-react';

// ─── Booking invoice data ────────────────────────────────────────────────────
export interface BookingInvoiceData {
  type: 'booking';
  booking_ref: string;
  created_at: string;
  status: string;
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
  agent_name?: string;
  agent_company?: string;
  agent_phone?: string;
  agent_email?: string;
  business_name?: string;
  business_contact?: string;
  business_phone?: string;
  business_email?: string;
}

// ─── Logistics request invoice data ─────────────────────────────────────────
export interface RequestInvoiceData {
  type: 'request';
  request_ref: string;
  created_at: string;
  status: string;
  title: string;
  description: string;
  service_type: string;
  origin: string;
  destination: string;
  quantity?: string | number | null;
  weight_kg?: string | number | null;
  weight?: string | number | null;
  preferred_date?: string | null;
  budget_range: string;
  admin_notes?: string;
  agent_name?: string;
  agent_company?: string;
  agent_phone?: string;
  agent_email?: string;
  business_name?: string;
  business_contact?: string;
  business_phone?: string;
  business_email?: string;
}

export type InvoiceData = BookingInvoiceData | RequestInvoiceData;

interface Props {
  data: InvoiceData;
  onClose: () => void;
}

function cap(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  pending:           { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
  confirmed:         { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  picked_up:         { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  in_transit:        { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  out_for_delivery:  { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  delivered:         { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  cancelled:         { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  reviewing:         { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  approved:          { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  in_progress:       { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  completed:         { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  rejected:          { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

export default function InvoiceModal({ data, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${data.type === 'booking' ? data.booking_ref : data.request_ref}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; padding: 0; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>${el.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const sc = STATUS_COLOR[data.status] ?? { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' };
  const isBooking = data.type === 'booking';
  const ref = isBooking ? (data as BookingInvoiceData).booking_ref : (data as RequestInvoiceData).request_ref;

  const clientName = isBooking
    ? ((data as BookingInvoiceData).business_name || (data as BookingInvoiceData).agent_company || 'Client')
    : ((data as RequestInvoiceData).business_name || (data as RequestInvoiceData).agent_company || 'Client');

  const clientContact = isBooking
    ? ((data as BookingInvoiceData).business_contact || (data as BookingInvoiceData).agent_name || '')
    : ((data as RequestInvoiceData).business_contact || (data as RequestInvoiceData).agent_name || '');

  const clientPhone = isBooking
    ? ((data as BookingInvoiceData).business_phone || (data as BookingInvoiceData).agent_phone || '')
    : ((data as RequestInvoiceData).business_phone || (data as RequestInvoiceData).agent_phone || '');

  const clientEmail = isBooking
    ? ((data as BookingInvoiceData).business_email || (data as BookingInvoiceData).agent_email || '')
    : ((data as RequestInvoiceData).business_email || (data as RequestInvoiceData).agent_email || '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">

        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            {isBooking
              ? <Package className="h-5 w-5 text-orange-500" />
              : <Truck className="h-5 w-5 text-blue-600" />}
            <div>
              <p className="font-bold text-gray-900 text-sm">{isBooking ? 'Delivery Booking Invoice' : 'Logistics Request Invoice'}</p>
              <p className="text-xs text-gray-400">{ref}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Invoice content */}
        <div className="p-6">
          <div ref={printRef}>
            <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: '#111827', background: '#fff', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '3px solid #ea580c', paddingBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f97316, #dc2626)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '20px', fontWeight: '800', color: '#111827', lineHeight: 1 }}>Danhausa Logistics</p>
                      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Professional Logistics & Delivery Solutions</p>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.6', marginTop: '8px' }}>
                    <p>support@danhausalogistics.com</p>
                    <p>Nigeria</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '28px', fontWeight: '800', color: '#ea580c', letterSpacing: '-1px' }}>INVOICE</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginTop: '4px' }}>{ref}</p>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Date: {fmtDate(data.created_at)}</p>
                  <div style={{ marginTop: '8px', display: 'inline-block', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: '20px', padding: '3px 12px', fontSize: '11px', fontWeight: '700' }}>
                    {cap(data.status)}
                  </div>
                </div>
              </div>

              {/* Bill To / Service Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Bill To</p>
                  {clientName && <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827', marginBottom: '2px' }}>{clientName}</p>}
                  {clientContact && <p style={{ fontSize: '12px', color: '#374151', marginBottom: '2px' }}>{clientContact}</p>}
                  {clientPhone && <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{clientPhone}</p>}
                  {clientEmail && <p style={{ fontSize: '12px', color: '#6b7280' }}>{clientEmail}</p>}
                  {!clientName && !clientContact && <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Not specified</p>}
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    {isBooking ? 'Booking Details' : 'Service Details'}
                  </p>
                  <div style={{ fontSize: '12px', lineHeight: '2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Reference:</span>
                      <span style={{ fontWeight: '700', color: '#ea580c' }}>{ref}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Date Issued:</span>
                      <span style={{ fontWeight: '600' }}>{fmtDate(data.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Type:</span>
                      <span style={{ fontWeight: '600' }}>{isBooking ? 'Delivery Booking' : 'Logistics Request'}</span>
                    </div>
                    {isBooking ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Package Type:</span>
                        <span style={{ fontWeight: '600' }}>{cap((data as BookingInvoiceData).package_type)}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Service:</span>
                        <span style={{ fontWeight: '600' }}>{cap((data as RequestInvoiceData).service_type)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main service table */}
              {isBooking ? (
                <>
                  {/* Booking – Shipment route */}
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Shipment Route</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ padding: '16px', background: '#fff7ed' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Origin / Pickup</p>
                        <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{(data as BookingInvoiceData).sender_name}</p>
                        <p style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>{(data as BookingInvoiceData).sender_phone}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{(data as BookingInvoiceData).sender_address}</p>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#ea580c', marginTop: '6px' }}>{(data as BookingInvoiceData).pickup_city}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#f9fafb', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', minWidth: '48px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                        </svg>
                      </div>
                      <div style={{ padding: '16px', background: '#f0fdf4' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Destination / Delivery</p>
                        <p style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{(data as BookingInvoiceData).recipient_name}</p>
                        <p style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>{(data as BookingInvoiceData).recipient_phone}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{(data as BookingInvoiceData).recipient_address}</p>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', marginTop: '6px' }}>{(data as BookingInvoiceData).delivery_city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Package details table */}
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Package Information</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', color: '#fff' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '0' }}>Description</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Declared Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 14px', color: '#374151' }}>{(data as BookingInvoiceData).package_description || '—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: '#ea580c' }}>{cap((data as BookingInvoiceData).package_type)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: '#374151' }}>{(data as BookingInvoiceData).weight_kg != null ? `${(data as BookingInvoiceData).weight_kg} kg` : '—'}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{(data as BookingInvoiceData).declared_value != null ? `₦${Number((data as BookingInvoiceData).declared_value).toLocaleString()}` : '—'}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #e5e7eb', background: '#fff' }}>
                          <td colSpan={3} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', fontSize: '13px', color: '#374151' }}>Total Declared Value:</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', fontSize: '15px', color: '#ea580c' }}>
                            {(data as BookingInvoiceData).declared_value != null ? `₦${Number((data as BookingInvoiceData).declared_value).toLocaleString()}` : 'N/A'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  {/* Request – service details table */}
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Service Information</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', color: '#fff' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Title</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '600', color: '#111827' }}>{(data as RequestInvoiceData).title}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '600', color: '#2563eb' }}>{cap((data as RequestInvoiceData).service_type)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', color: '#374151' }}>{(data as RequestInvoiceData).origin} → {(data as RequestInvoiceData).destination}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>{(data as RequestInvoiceData).budget_range || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Route + Specs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Route</p>
                      <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: '#6b7280', minWidth: '80px' }}>Origin:</span>
                          <span style={{ fontWeight: '700', color: '#111827' }}>{(data as RequestInvoiceData).origin}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: '#6b7280', minWidth: '80px' }}>Destination:</span>
                          <span style={{ fontWeight: '700', color: '#111827' }}>{(data as RequestInvoiceData).destination}</span>
                        </div>
                        {(data as RequestInvoiceData).preferred_date && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', minWidth: '80px' }}>Pref. Date:</span>
                            <span style={{ fontWeight: '600', color: '#111827' }}>{fmtDate((data as RequestInvoiceData).preferred_date!)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Specifications</p>
                      <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                        {((data as RequestInvoiceData).quantity) && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', minWidth: '70px' }}>Quantity:</span>
                            <span style={{ fontWeight: '700', color: '#111827' }}>{(data as RequestInvoiceData).quantity}</span>
                          </div>
                        )}
                        {((data as RequestInvoiceData).weight_kg || (data as RequestInvoiceData).weight) && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', minWidth: '70px' }}>Weight:</span>
                            <span style={{ fontWeight: '700', color: '#111827' }}>{(data as RequestInvoiceData).weight_kg || (data as RequestInvoiceData).weight} kg</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: '#6b7280', minWidth: '70px' }}>Budget:</span>
                          <span style={{ fontWeight: '700', color: '#15803d' }}>{(data as RequestInvoiceData).budget_range}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Description / Notes */}
              {(isBooking ? (data as BookingInvoiceData).special_instructions : (data as RequestInvoiceData).description) && (
                <div style={{ marginBottom: '24px', background: '#f9fafb', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #ea580c' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    {isBooking ? 'Special Instructions' : 'Description'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                    {isBooking ? (data as BookingInvoiceData).special_instructions : (data as RequestInvoiceData).description}
                  </p>
                </div>
              )}

              {/* Admin notes for request */}
              {!isBooking && (data as RequestInvoiceData).admin_notes && (
                <div style={{ marginBottom: '24px', background: '#eff6ff', borderRadius: '12px', padding: '16px', borderLeft: '4px solid #2563eb' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Admin Notes</p>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{(data as RequestInvoiceData).admin_notes}</p>
                </div>
              )}

              {/* Footer */}
              <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>Danhausa Logistics</p>
                  <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Professional Logistics & Delivery Solutions</p>
                  <p style={{ fontSize: '11px', color: '#6b7280' }}>support@danhausalogistics.com</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Generated on {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>This document serves as an official service record.</p>
                  <div style={{ marginTop: '12px', borderTop: '1px solid #d1d5db', paddingTop: '8px', minWidth: '180px' }}>
                    <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>Authorized Signature</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
