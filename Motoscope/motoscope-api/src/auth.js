import bcrypt from 'bcrypt';
import { q } from './db.js';

// returns key record or null
export async function getKeyRecord(providedKey){
  // VERY IMPORTANT: do not q by key plaintext. Instead, fetch candidates (or fetch all active records and compare).
  // Simpler: query rows where revoked=false then compare hashes. If you have many keys, store a key_id prefix in token.
  const rows = await q('SELECT id, name, key_hash, revoked, quota_daily FROM api_keys WHERE revoked = false');
  for (const r of rows){
    // bcrypt.compare is safe / constant-time
    if (await bcrypt.compare(providedKey, r.key_hash)) return r;
  }
  return null;
}
