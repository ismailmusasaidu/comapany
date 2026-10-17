import { supabase } from './supabase';

export type AuditCategory = 'bookings' | 'logistics' | 'payments' | 'content' | 'auth' | 'general';

export interface AuditLogEntry {
  action: string;
  category: AuditCategory;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Records an admin action in the audit_logs table. Never throws —
 * logging must not break the action it is recording.
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      admin_user_id: user.id,
      admin_email: user.email ?? null,
      action: entry.action,
      category: entry.category,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      entity_label: entry.entityLabel ?? null,
      details: entry.details ?? null,
    });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}
