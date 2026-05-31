import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, FileText, Package, Truck, Calendar,
  Download, Printer, Filter, Building2, Users, User, CheckCircle,
  XCircle, Clock, ChevronDown, Search, X, Hash, MapPin, Weight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodMode = 'daily' | 'weekly' | 'monthly' | 'custom';
type PortalFilter = 'all' | 'individual' | 'agent' | 'business';
type RecordType = 'both' | 'delivery' | 'logistics';

interface DeliveryRow {
  id: string;
  booking_ref: string;
  created_at: string;
  status: string;
  sender_name: string;
  sender_phone: string;
  pickup_city: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_city: string;
  package_type: string;
  package_description: string;
  weight_kg: number | null;
  declared_value: number | null;
  delivery_type?: string | null;
  vehicle_type?: string | null;
  payment_method?: string | null;
  special_instructions?: string;
  portal: 'individual' | 'agent' | 'business';
  owner_name: string;
  owner_email: string;
  owner_phone: string;
}

interface LogisticsRow {
  id: string;
  request_ref: string;
  created_at: string;
  status: string;
  title: string;
  service_type: string;
  description: string;
  origin: string;
  destination: string;
  quantity?: string | number | null;
  weight_kg?: number | null;
  weight?: string | null;
  preferred_date?: string | null;
  budget_range: string;
  admin_notes?: string;
  vehicle_type?: string | null;
  portal: 'individual' | 'agent' | 'business';
  owner_name: string;
  owner_email: string;
  owner_phone: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cap(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtDateFull(d: string) { return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }); }
function naira(n: number | null | undefined) { return n != null ? `₦${Number(n).toLocaleString('en-NG')}` : '—'; }

function getDateRange(mode: PeriodMode, customStart: string, customEnd: string, numDays: number): { start: Date; end: Date; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (mode === 'daily') {
    const end = new Date(today); end.setHours(23, 59, 59, 999);
    return { start: today, end, label: `Today — ${fmtDateFull(today.toISOString())}` };
  }
  if (mode === 'weekly') {
    const start = new Date(today); start.setDate(today.getDate() - 6);
    const end = new Date(today); end.setHours(23, 59, 59, 999);
    return { start, end, label: `${fmtDate(start.toISOString())} – ${fmtDate(end.toISOString())} (Last 7 Days)` };
  }
  if (mode === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, label: now.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) };
  }
  if (mode === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd); end.setHours(23, 59, 59, 999);
    return { start, end, label: `${fmtDate(customStart)} – ${fmtDate(customEnd)}` };
  }
  // custom with numDays fallback
  const start = new Date(today); start.setDate(today.getDate() - (numDays - 1));
  const end = new Date(today); end.setHours(23, 59, 59, 999);
  return { start, end, label: `Last ${numDays} Day${numDays !== 1 ? 's' : ''}` };
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  pending:          { bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
  confirmed:        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  picked_up:        { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  in_transit:       { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  out_for_delivery: { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  delivered:        { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  cancelled:        { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  reviewing:        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  approved:         { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  in_progress:      { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  completed:        { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  rejected:         { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

const STATUS_PILL_CLASS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border border-blue-200',
  picked_up: 'bg-orange-100 text-orange-700 border border-orange-200',
  in_transit: 'bg-orange-100 text-orange-600 border border-orange-200',
  out_for_delivery: 'bg-teal-100 text-teal-700 border border-teal-200',
  delivered: 'bg-green-100 text-green-700 border border-green-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
  reviewing: 'bg-blue-100 text-blue-700 border border-blue-200',
  approved: 'bg-teal-100 text-teal-700 border border-teal-200',
  in_progress: 'bg-orange-100 text-orange-700 border border-orange-200',
  completed: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-600 border border-red-200',
};

const PORTAL_COLORS = {
  individual: { label: 'Individual', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  agent: { label: 'Agent', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  business: { label: 'Business', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

// ─── Invoice print content ────────────────────────────────────────────────────

function buildInvoiceHTML(
  deliveries: DeliveryRow[],
  logistics: LogisticsRow[],
  periodLabel: string,
  portal: PortalFilter,
  recordType: RecordType,
  contact: ContactInfo,
  invoiceNumber: string,
): string {
  const totalDeclared = deliveries.reduce((s, d) => s + (d.declared_value ?? 0), 0);
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;
  const completedCount = logistics.filter(r => r.status === 'completed').length;
  const cancelledCount = deliveries.filter(d => d.status === 'cancelled').length + logistics.filter(r => r.status === 'rejected').length;

  const portalLabel = portal === 'all' ? 'All Portals' : cap(portal);
  const typeLabel = recordType === 'both' ? 'Deliveries & Logistics' : recordType === 'delivery' ? 'Delivery Bookings' : 'Logistics Requests';

  const statusSummary: Record<string, number> = {};
  [...deliveries, ...logistics].forEach(r => { statusSummary[r.status] = (statusSummary[r.status] ?? 0) + 1; });

  const deliveriesHTML = deliveries.length > 0 ? `
    <div style="margin-bottom:32px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #ea580c">
        <div style="width:8px;height:8px;border-radius:50%;background:#ea580c"></div>
        <span style="font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.06em">Delivery Bookings (${deliveries.length})</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px">
        <thead>
          <tr style="background:#1e293b;color:#fff">
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">#</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Ref</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Date</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Client</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Route</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Package</th>
            <th style="padding:9px 10px;text-align:right;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Value</th>
            <th style="padding:9px 10px;text-align:center;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Status</th>
          </tr>
        </thead>
        <tbody>
          ${deliveries.map((d, i) => {
            const sc = STATUS_STYLE[d.status] ?? { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' };
            return `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};border-bottom:1px solid #f3f4f6">
                <td style="padding:9px 10px;color:#9ca3af;font-size:10px">${i + 1}</td>
                <td style="padding:9px 10px;font-weight:700;color:#ea580c;font-size:11px">${d.booking_ref}</td>
                <td style="padding:9px 10px;color:#374151;white-space:nowrap">${fmtDate(d.created_at)}</td>
                <td style="padding:9px 10px">
                  <div style="font-weight:600;color:#111827">${d.owner_name}</div>
                  <div style="font-size:10px;color:#9ca3af">${d.portal === 'individual' ? 'Individual' : d.portal === 'agent' ? 'Agent' : 'Business'}</div>
                </td>
                <td style="padding:9px 10px">
                  <div style="color:#111827">${d.pickup_city}</div>
                  <div style="color:#6b7280;font-size:10px">→ ${d.delivery_city}</div>
                </td>
                <td style="padding:9px 10px">
                  <div style="color:#374151">${cap(d.package_type)}</div>
                  ${d.weight_kg ? `<div style="font-size:10px;color:#9ca3af">${d.weight_kg} kg</div>` : ''}
                </td>
                <td style="padding:9px 10px;text-align:right;font-weight:700;color:#111827">${naira(d.declared_value)}</td>
                <td style="padding:9px 10px;text-align:center">
                  <span style="background:${sc.bg};color:${sc.text};border:1px solid ${sc.border};border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700;white-space:nowrap">${cap(d.status)}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#fafafa;border-top:2px solid #e5e7eb">
            <td colspan="6" style="padding:10px 10px;text-align:right;font-weight:700;font-size:12px;color:#374151">Total Declared Value:</td>
            <td style="padding:10px 10px;text-align:right;font-weight:800;font-size:14px;color:#ea580c">${naira(totalDeclared)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>` : '';

  const logisticsHTML = logistics.length > 0 ? `
    <div style="margin-bottom:32px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #2563eb">
        <div style="width:8px;height:8px;border-radius:50%;background:#2563eb"></div>
        <span style="font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.06em">Logistics Requests (${logistics.length})</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px">
        <thead>
          <tr style="background:#1e293b;color:#fff">
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">#</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Ref</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Date</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Client</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Service</th>
            <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Route</th>
            <th style="padding:9px 10px;text-align:right;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Budget</th>
            <th style="padding:9px 10px;text-align:center;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.05em">Status</th>
          </tr>
        </thead>
        <tbody>
          ${logistics.map((r, i) => {
            const sc = STATUS_STYLE[r.status] ?? { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' };
            return `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};border-bottom:1px solid #f3f4f6">
                <td style="padding:9px 10px;color:#9ca3af;font-size:10px">${i + 1}</td>
                <td style="padding:9px 10px;font-weight:700;color:#2563eb;font-size:11px">${r.request_ref}</td>
                <td style="padding:9px 10px;color:#374151;white-space:nowrap">${fmtDate(r.created_at)}</td>
                <td style="padding:9px 10px">
                  <div style="font-weight:600;color:#111827">${r.owner_name}</div>
                  <div style="font-size:10px;color:#9ca3af">${r.portal === 'individual' ? 'Individual' : r.portal === 'agent' ? 'Agent' : 'Business'}</div>
                </td>
                <td style="padding:9px 10px;font-weight:600;color:#2563eb">${cap(r.service_type)}</td>
                <td style="padding:9px 10px">
                  <div style="color:#111827">${r.origin}</div>
                  <div style="color:#6b7280;font-size:10px">→ ${r.destination}</div>
                </td>
                <td style="padding:9px 10px;text-align:right;font-weight:700;color:#111827">${r.budget_range || '—'}</td>
                <td style="padding:9px 10px;text-align:center">
                  <span style="background:${sc.bg};color:${sc.text};border:1px solid ${sc.border};border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700;white-space:nowrap">${cap(r.status)}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice — ${periodLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { margin: 16mm 14mm; size: A4 landscape; }
          }
        </style>
      </head>
      <body style="padding:32px;max-width:1100px;margin:0 auto">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;border-bottom:3px solid #ea580c;padding-bottom:22px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;background:linear-gradient(135deg,#f97316,#dc2626);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <p style="font-size:22px;font-weight:800;color:#111827;line-height:1">Danhausa Logistics</p>
              <p style="font-size:11px;color:#6b7280;margin-top:3px">Professional Logistics & Delivery Solutions</p>
              <p style="font-size:11px;color:#9ca3af;margin-top:1px">${contact.email || 'support@danhausalogistics.com'} · Nigeria</p>
            </div>
          </div>
          <div style="text-align:right">
            <p style="font-size:30px;font-weight:800;color:#ea580c;letter-spacing:-1px">INVOICE</p>
            <p style="font-size:12px;font-weight:700;color:#374151;margin-top:3px">${invoiceNumber}</p>
            <p style="font-size:11px;color:#6b7280;margin-top:1px">Generated: ${fmtDateFull(new Date().toISOString())}</p>
          </div>
        </div>

        <!-- Period / scope info -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">
          <div style="background:#f9fafb;border-radius:10px;padding:14px">
            <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">Invoice Period</p>
            <p style="font-size:13px;font-weight:700;color:#111827">${periodLabel}</p>
          </div>
          <div style="background:#f9fafb;border-radius:10px;padding:14px">
            <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">Portal / Record Type</p>
            <p style="font-size:13px;font-weight:700;color:#111827">${portalLabel} · ${typeLabel}</p>
          </div>
          <div style="background:#f9fafb;border-radius:10px;padding:14px">
            <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px">Total Records</p>
            <p style="font-size:13px;font-weight:700;color:#111827">${deliveries.length + logistics.length} (${deliveries.length} deliveries · ${logistics.length} requests)</p>
          </div>
        </div>

        <!-- Summary KPIs -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px">
          ${[
            { label: 'Total Deliveries', value: String(deliveries.length), color: '#ea580c', bg: '#fff7ed' },
            { label: 'Logistics Requests', value: String(logistics.length), color: '#2563eb', bg: '#eff6ff' },
            { label: 'Delivered', value: String(deliveredCount), color: '#15803d', bg: '#f0fdf4' },
            { label: 'Completed Requests', value: String(completedCount), color: '#0f766e', bg: '#f0fdfa' },
            { label: 'Cancelled / Rejected', value: String(cancelledCount), color: '#b91c1c', bg: '#fef2f2' },
          ].map(k => `
            <div style="background:${k.bg};border-radius:10px;padding:12px;text-align:center">
              <p style="font-size:22px;font-weight:800;color:${k.color}">${k.value}</p>
              <p style="font-size:10px;color:#6b7280;margin-top:2px;line-height:1.3">${k.label}</p>
            </div>
          `).join('')}
        </div>

        <!-- Status breakdown -->
        ${Object.keys(statusSummary).length > 0 ? `
        <div style="margin-bottom:24px;background:#f9fafb;border-radius:10px;padding:14px">
          <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px">Status Breakdown</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${Object.entries(statusSummary).sort((a,b)=>b[1]-a[1]).map(([s, c]) => {
              const sc = STATUS_STYLE[s] ?? { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' };
              return `<span style="background:${sc.bg};color:${sc.text};border:1px solid ${sc.border};border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700">${cap(s)}: ${c}</span>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- Delivery table -->
        ${deliveriesHTML}

        <!-- Logistics table -->
        ${logisticsHTML}

        <!-- Footer -->
        <div style="border-top:2px solid #e5e7eb;padding-top:18px;margin-top:8px;display:flex;justify-content:space-between;align-items:flex-end">
          <div>
            <p style="font-size:12px;font-weight:700;color:#111827">Danhausa Logistics</p>
            <p style="font-size:11px;color:#6b7280;margin-top:1px">Professional Logistics & Delivery Solutions</p>
            <p style="font-size:11px;color:#6b7280">${contact.email || 'support@danhausalogistics.com'}</p>
          </div>
          <div style="text-align:right">
            <p style="font-size:11px;color:#9ca3af">This document is an official record generated by Danhausa Logistics.</p>
            <p style="font-size:11px;color:#9ca3af;margin-top:1px">Invoice No: ${invoiceNumber}</p>
            <div style="margin-top:16px;border-top:1px solid #d1d5db;padding-top:8px;min-width:180px">
              <p style="font-size:10px;color:#9ca3af;text-align:center">Authorized Signature</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminInvoiceGeneratorPage() {
  const navigate = useNavigate();

  // Filter state
  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [numDays, setNumDays] = useState(7);
  const [portalFilter, setPortalFilter] = useState<PortalFilter>('all');
  const [recordType, setRecordType] = useState<RecordType>('both');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Data
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [allDeliveries, setAllDeliveries] = useState<DeliveryRow[]>([]);
  const [allLogistics, setAllLogistics] = useState<LogisticsRow[]>([]);
  const [contact, setContact] = useState<ContactInfo>({ email: '', phone: '', address: '' });

  const fetchData = async () => {
    setLoading(true);
    const [
      indProfRes, agentProfRes, bizProfRes,
      indBookRes, indReqRes,
      agentBookRes, agentReqRes,
      bizBookRes, bizReqRes,
      contactRes,
    ] = await Promise.all([
      supabase.from('individual_profiles').select('id, full_name, email, phone'),
      supabase.from('agent_profiles').select('id, full_name, email, phone, company_name'),
      supabase.from('business_profiles').select('id, company_name, contact_person, email, phone'),
      supabase.from('delivery_bookings').select('id,booking_ref,created_at,status,sender_name,sender_phone,pickup_city,recipient_name,recipient_phone,delivery_city,package_type,package_description,weight_kg,declared_value,delivery_type,vehicle_type,payment_method,special_instructions,individual_id').not('individual_id','is',null).order('created_at',{ascending:false}),
      supabase.from('logistics_requests').select('id,request_ref,created_at,status,title,service_type,description,origin,destination,quantity,weight_kg,preferred_date,budget_range,admin_notes,vehicle_type,individual_id').not('individual_id','is',null).order('created_at',{ascending:false}),
      supabase.from('delivery_bookings').select('id,booking_ref,created_at,status,sender_name,sender_phone,pickup_city,recipient_name,recipient_phone,delivery_city,package_type,package_description,weight_kg,declared_value,delivery_type,vehicle_type,payment_method,special_instructions,agent_id').not('agent_id','is',null).order('created_at',{ascending:false}),
      supabase.from('logistics_requests').select('id,request_ref,created_at,status,title,service_type,description,origin,destination,quantity,weight_kg,preferred_date,budget_range,admin_notes,vehicle_type,agent_id').not('agent_id','is',null).order('created_at',{ascending:false}),
      supabase.from('business_delivery_bookings').select('id,booking_ref,created_at,status,sender_name,sender_phone,pickup_city,recipient_name,recipient_phone,delivery_city,package_type,package_description,weight_kg,declared_value,delivery_type,vehicle_type,payment_method,special_instructions,business_id').order('created_at',{ascending:false}),
      supabase.from('business_logistics_requests').select('id,request_ref,created_at,status,title,service_type,description,origin,destination,quantity,weight,preferred_date,budget_range,admin_notes,vehicle_type,business_id').order('created_at',{ascending:false}),
      supabase.from('contact_info').select('email,phone,address').maybeSingle(),
    ]);

    const indMap: Record<string, { full_name: string; email: string; phone: string }> = {};
    for (const p of indProfRes.data ?? []) indMap[p.id] = { full_name: p.full_name, email: p.email, phone: p.phone };

    const agentMap: Record<string, { full_name: string; email: string; phone: string; company_name: string }> = {};
    for (const p of agentProfRes.data ?? []) agentMap[p.id] = { full_name: p.full_name, email: p.email, phone: p.phone, company_name: p.company_name };

    const bizMap: Record<string, { company_name: string; contact_person: string; email: string; phone: string }> = {};
    for (const p of bizProfRes.data ?? []) bizMap[p.id] = { company_name: p.company_name, contact_person: p.contact_person, email: p.email, phone: p.phone };

    const deliveries: DeliveryRow[] = [
      ...(indBookRes.data ?? []).map((b: any): DeliveryRow => {
        const p = indMap[b.individual_id] ?? { full_name: 'Unknown', email: '', phone: '' };
        return { ...b, portal: 'individual', owner_name: p.full_name, owner_email: p.email, owner_phone: p.phone };
      }),
      ...(agentBookRes.data ?? []).map((b: any): DeliveryRow => {
        const p = agentMap[b.agent_id] ?? { full_name: 'Unknown', email: '', phone: '', company_name: '' };
        return { ...b, portal: 'agent', owner_name: p.company_name || p.full_name, owner_email: p.email, owner_phone: p.phone };
      }),
      ...(bizBookRes.data ?? []).map((b: any): DeliveryRow => {
        const p = bizMap[b.business_id] ?? { company_name: 'Unknown', contact_person: '', email: '', phone: '' };
        return { ...b, portal: 'business', owner_name: p.company_name, owner_email: p.email, owner_phone: p.phone };
      }),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at));

    const logistics: LogisticsRow[] = [
      ...(indReqRes.data ?? []).map((r: any): LogisticsRow => {
        const p = indMap[r.individual_id] ?? { full_name: 'Unknown', email: '', phone: '' };
        return { ...r, portal: 'individual', owner_name: p.full_name, owner_email: p.email, owner_phone: p.phone };
      }),
      ...(agentReqRes.data ?? []).map((r: any): LogisticsRow => {
        const p = agentMap[r.agent_id] ?? { full_name: 'Unknown', email: '', phone: '', company_name: '' };
        return { ...r, portal: 'agent', owner_name: p.company_name || p.full_name, owner_email: p.email, owner_phone: p.phone };
      }),
      ...(bizReqRes.data ?? []).map((r: any): LogisticsRow => {
        const p = bizMap[r.business_id] ?? { company_name: 'Unknown', contact_person: '', email: '', phone: '' };
        return { ...r, weight_kg: null, portal: 'business', owner_name: p.company_name, owner_email: p.email, owner_phone: p.phone };
      }),
    ].sort((a, b) => b.created_at.localeCompare(a.created_at));

    setAllDeliveries(deliveries);
    setAllLogistics(logistics);
    if (contactRes.data) setContact(contactRes.data as ContactInfo);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ── Derived filtered data ──────────────────────────────────────────────────
  const { start, end, label: periodLabel } = useMemo(
    () => getDateRange(periodMode, customStart, customEnd, numDays),
    [periodMode, customStart, customEnd, numDays]
  );

  const filtered = useMemo(() => {
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    let deliveries = allDeliveries.filter(d => d.created_at >= startISO && d.created_at <= endISO);
    let logistics = allLogistics.filter(r => r.created_at >= startISO && r.created_at <= endISO);

    if (portalFilter !== 'all') {
      deliveries = deliveries.filter(d => d.portal === portalFilter);
      logistics = logistics.filter(r => r.portal === portalFilter);
    }
    if (statusFilter !== 'all') {
      deliveries = deliveries.filter(d => d.status === statusFilter);
      logistics = logistics.filter(r => r.status === statusFilter);
    }
    if (recordType === 'delivery') logistics = [];
    if (recordType === 'logistics') deliveries = [];

    return { deliveries, logistics };
  }, [allDeliveries, allLogistics, start, end, portalFilter, statusFilter, recordType]);

  const invoiceNumber = useMemo(() => {
    const d = new Date();
    return `DHL-INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
  }, []);

  const totalDeclared = filtered.deliveries.reduce((s, d) => s + (d.declared_value ?? 0), 0);
  const deliveredCount = filtered.deliveries.filter(d => d.status === 'delivered').length;
  const completedCount = filtered.logistics.filter(r => r.status === 'completed').length;

  const allStatuses = useMemo(() => {
    const s = new Set<string>();
    allDeliveries.forEach(d => s.add(d.status));
    allLogistics.forEach(r => s.add(r.status));
    return Array.from(s).sort();
  }, [allDeliveries, allLogistics]);

  const handlePrint = () => {
    setGenerating(true);
    try {
      const html = buildInvoiceHTML(filtered.deliveries, filtered.logistics, periodLabel, portalFilter, recordType, contact, invoiceNumber);
      const win = window.open('', '_blank', 'width=1200,height=800');
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); setGenerating(false); }, 500);
    } catch {
      setGenerating(false);
    }
  };

  const PERIOD_MODES: { key: PeriodMode; label: string }[] = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'Last 7 Days' },
    { key: 'monthly', label: 'This Month' },
    { key: 'custom', label: 'Custom Range' },
  ];

  const RECORD_TYPES: { key: RecordType; label: string }[] = [
    { key: 'both', label: 'Deliveries & Logistics' },
    { key: 'delivery', label: 'Deliveries Only' },
    { key: 'logistics', label: 'Logistics Only' },
  ];

  const PORTAL_FILTERS: { key: PortalFilter; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'all', label: 'All Portals', icon: Filter },
    { key: 'individual', label: 'Individual', icon: User },
    { key: 'agent', label: 'Agent', icon: Users },
    { key: 'business', label: 'Business', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Invoice Generator</h1>
                <p className="text-gray-500 text-sm">Generate period invoices for deliveries and logistics</p>
              </div>
            </div>
          </div>
          <button onClick={fetchData} className={`p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[340px_1fr] gap-6">

          {/* ── Left panel: controls ── */}
          <div className="space-y-4">

            {/* Period selector */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <p className="font-bold text-gray-900 text-sm">Invoice Period</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {PERIOD_MODES.map(m => (
                  <button key={m.key} onClick={() => setPeriodMode(m.key)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${periodMode === m.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {m.label}
                  </button>
                ))}

                {/* Custom: date range pickers */}
                {periodMode === 'custom' && (
                  <div className="pt-2 space-y-3 border-t border-gray-100 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
                      <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
                      <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">— or enter number of days —</label>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" max="365" value={numDays} onChange={e => setNumDays(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        <span className="text-xs text-gray-400 flex-shrink-0">days back</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Portal filter */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <p className="font-bold text-gray-900 text-sm">Portal</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {PORTAL_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setPortalFilter(f.key)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${portalFilter === f.key ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <f.icon className="h-4 w-4 flex-shrink-0" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Record type */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-teal-500" />
                  <p className="font-bold text-gray-900 text-sm">Record Type</p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {RECORD_TYPES.map(r => (
                  <button key={r.key} onClick={() => setRecordType(r.key)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${recordType === r.key ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <p className="font-bold text-gray-900 text-sm">Status Filter</p>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                <button onClick={() => setStatusFilter('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${statusFilter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  All Statuses
                </button>
                {allStatuses.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === s ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {statusFilter !== s && <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_PILL_CLASS[s] ?? 'bg-gray-100 text-gray-600'}`}>{cap(s)}</span>}
                    {statusFilter === s && <span>{cap(s)}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right panel: preview + generate ── */}
          <div className="space-y-5">

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">Invoice Preview</p>
                  <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
                </div>
                <button onClick={handlePrint} disabled={generating || loading || (filtered.deliveries.length + filtered.logistics.length === 0)}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-orange-500/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  {generating ? 'Generating...' : 'Print / Save PDF'}
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* KPI row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-gray-100 border-b border-gray-100">
                    {[
                      { icon: Package, label: 'Deliveries', value: filtered.deliveries.length, color: 'text-orange-600', bg: 'bg-orange-50' },
                      { icon: Truck, label: 'Logistics', value: filtered.logistics.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { icon: CheckCircle, label: 'Delivered', value: deliveredCount, color: 'text-green-600', bg: 'bg-green-50' },
                      { icon: Hash, label: 'Total Records', value: filtered.deliveries.length + filtered.logistics.length, color: 'text-gray-600', bg: 'bg-gray-100' },
                    ].map(k => (
                      <div key={k.label} className="flex items-center gap-3 p-5">
                        <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <k.icon className={`h-4 w-4 ${k.color}`} />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900">{k.value}</p>
                          <p className="text-xs text-gray-400">{k.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Secondary stats */}
                  <div className="grid sm:grid-cols-3 gap-0 divide-x divide-gray-100 border-b border-gray-100">
                    {[
                      { label: 'Total Declared Value', value: naira(totalDeclared), icon: Weight },
                      { label: 'Completed Requests', value: String(completedCount), icon: CheckCircle },
                      { label: 'Cancelled / Rejected', value: String(filtered.deliveries.filter(d => d.status === 'cancelled').length + filtered.logistics.filter(r => r.status === 'rejected').length), icon: XCircle },
                    ].map(k => (
                      <div key={k.label} className="flex items-center gap-3 px-5 py-4">
                        <k.icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-gray-800">{k.value}</p>
                          <p className="text-xs text-gray-400">{k.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filtered.deliveries.length + filtered.logistics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-semibold">No records match your filters</p>
                      <p className="text-gray-400 text-sm mt-1">Adjust the period, portal, or status filters</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-6">

                      {/* Delivery table preview */}
                      {(recordType === 'both' || recordType === 'delivery') && filtered.deliveries.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <p className="text-sm font-bold text-gray-800">Delivery Bookings</p>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{filtered.deliveries.length}</span>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-800 text-white">
                                  {['Ref', 'Date', 'Client', 'Route', 'Package', 'Value', 'Status'].map(h => (
                                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide first:rounded-tl-xl last:rounded-tr-xl">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {filtered.deliveries.map((d, i) => (
                                  <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    <td className="px-3 py-2.5 font-bold text-orange-600 whitespace-nowrap">{d.booking_ref}</td>
                                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(d.created_at)}</td>
                                    <td className="px-3 py-2.5">
                                      <p className="font-semibold text-gray-800">{d.owner_name}</p>
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${PORTAL_COLORS[d.portal].bg} ${PORTAL_COLORS[d.portal].text}`}>{PORTAL_COLORS[d.portal].label}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{d.pickup_city} → {d.delivery_city}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{cap(d.package_type)}{d.weight_kg ? ` · ${d.weight_kg}kg` : ''}</td>
                                    <td className="px-3 py-2.5 font-bold text-gray-800 whitespace-nowrap">{naira(d.declared_value)}</td>
                                    <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_PILL_CLASS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>{cap(d.status)}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-50 border-t-2 border-gray-200">
                                  <td colSpan={5} className="px-3 py-2.5 text-right text-xs font-bold text-gray-600">Total Declared Value:</td>
                                  <td className="px-3 py-2.5 font-bold text-orange-600">{naira(totalDeclared)}</td>
                                  <td />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Logistics table preview */}
                      {(recordType === 'both' || recordType === 'logistics') && filtered.logistics.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <p className="text-sm font-bold text-gray-800">Logistics Requests</p>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{filtered.logistics.length}</span>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-gray-100">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-800 text-white">
                                  {['Ref', 'Date', 'Client', 'Service', 'Route', 'Budget', 'Status'].map(h => (
                                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide first:rounded-tl-xl last:rounded-tr-xl">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {filtered.logistics.map((r, i) => (
                                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    <td className="px-3 py-2.5 font-bold text-blue-600 whitespace-nowrap">{r.request_ref}</td>
                                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                                    <td className="px-3 py-2.5">
                                      <p className="font-semibold text-gray-800">{r.owner_name}</p>
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${PORTAL_COLORS[r.portal].bg} ${PORTAL_COLORS[r.portal].text}`}>{PORTAL_COLORS[r.portal].label}</span>
                                    </td>
                                    <td className="px-3 py-2.5 font-semibold text-blue-600">{cap(r.service_type)}</td>
                                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.origin} → {r.destination}</td>
                                    <td className="px-3 py-2.5 font-bold text-gray-800">{r.budget_range || '—'}</td>
                                    <td className="px-3 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_PILL_CLASS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{cap(r.status)}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </>
              )}
            </div>

            {/* Invoice info card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">Invoice #{invoiceNumber}</p>
                  <p className="text-slate-300 text-sm mt-1">{periodLabel}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Portal</p>
                      <p className="font-semibold">{portalFilter === 'all' ? 'All Portals' : cap(portalFilter)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Records</p>
                      <p className="font-semibold">{filtered.deliveries.length + filtered.logistics.length} total</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Type</p>
                      <p className="font-semibold">{recordType === 'both' ? 'All' : cap(recordType)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Declared Value</p>
                      <p className="font-semibold text-orange-300">{naira(totalDeclared)}</p>
                    </div>
                  </div>
                  <button onClick={handlePrint} disabled={generating || loading || (filtered.deliveries.length + filtered.logistics.length === 0)}
                    className="mt-5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <Printer className="h-4 w-4" />
                    Generate & Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
