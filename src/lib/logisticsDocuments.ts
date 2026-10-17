import { supabase } from './supabase';

export interface StoredDocument {
  path: string;
  name: string;
  type: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadRequestDocuments(
  userId: string,
  requestRef: string,
  docs: { file?: File; name: string; type?: string }[],
): Promise<StoredDocument[]> {
  const stored: StoredDocument[] = [];
  for (const { file, name, type } of docs) {
    if (!file) continue;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`"${name}" is larger than 10 MB. Please remove it or attach a smaller file.`);
    }
    const safeName = name.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const path = `${userId}/${requestRef}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('logistics-documents').upload(path, file);
    if (error) throw new Error(`Could not upload "${name}". Please try again.`);
    stored.push({ path, name, type: type || 'other' });
  }
  return stored;
}

export async function getDocumentViewUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('logistics-documents')
    .createSignedUrl(path, 300);
  if (error || !data) return null;
  return data.signedUrl;
}
