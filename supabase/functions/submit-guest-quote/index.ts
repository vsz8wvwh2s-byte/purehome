// PureHome guest quote submission endpoint (deployment requires TURNSTILE_SECRET_KEY).
// This endpoint deliberately does not accept photo uploads or take payments.
import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};
const allowedOrigins = (Deno.env.get('PUREHOME_ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean);
const respond = (status: number, body: unknown, origin: string) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, ...(allowedOrigins.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}) },
});
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max + 1) : '';
Deno.serve(async request => {
  const origin = request.headers.get('origin') ?? '';
  if (!allowedOrigins.includes(origin)) return respond(403, { error: 'Origin not allowed' }, origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Origin': origin } });
  if (request.method !== 'POST') return respond(405, { error: 'Method not allowed' }, origin);
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return respond(415, { error: 'JSON request required' }, origin);
  if (Number(request.headers.get('content-length') ?? 0) > 16000) return respond(413, { error: 'Request too large' }, origin);
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!secret || !serviceKey || !supabaseUrl) return respond(503, { error: 'Quote requests are temporarily unavailable' }, origin);
  let payload: Record<string, unknown>;
  try {
    // Enforce the limit even when Content-Length is absent or inaccurate.
    const reader = request.body?.getReader();
    if (!reader) throw Error('Missing body');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16000) { await reader.cancel(); return respond(413, { error: 'Request too large' }, origin); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!payload || Array.isArray(payload) || typeof payload !== 'object') throw Error('Invalid JSON');
  }
  catch { return respond(400, { error: 'Invalid request' }, origin); }
  // Honeypot must remain empty. Do not expose whether bot detection triggered.
  if (payload.website) return respond(200, { received: true }, origin);
  const name = clean(payload.name, 120), email = clean(payload.email, 254), phone = clean(payload.phone, 30);
  const address = clean(payload.address, 300), description = clean(payload.description, 3000);
  const service = clean(payload.service, 50), preferredDate = clean(payload.preferredDate, 10);
  const token = clean(payload.turnstileToken, 4096);
  // Date parsing alone normalizes invalid dates such as February 30.
  const validDate = !preferredDate || (() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return false;
    const [year, month, day] = preferredDate.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
  })();
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    phone.length < 7 || phone.length > 30 || !address || address.length > 300 ||
    description.length < 10 || description.length > 3000 || !['Standard Cleaning', 'Deep Cleaning'].includes(service) ||
    (!validDate || (preferredDate && preferredDate < new Date().toISOString().slice(0, 10))) || !token)
    return respond(400, { error: 'Please check your details and verification' }, origin);
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  }).catch(() => null);
  const verdict = verify?.ok ? await verify.json().catch(() => null) : null;
  if (!verdict?.success || typeof verdict.hostname !== 'string' || !allowedOrigins.some(o => new URL(o).hostname === verdict.hostname))
    return respond(403, { error: 'Verification failed. Please try again' }, origin);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: selected, error: serviceError } = await db.from('services').select('id').eq('name', service).eq('is_active', true).single();
  if (serviceError || !selected) return respond(503, { error: 'Service temporarily unavailable' }, origin);
  const { error } = await db.from('quote_requests').insert({
    service_id: selected.id, customer_name: name, customer_email: email, customer_phone: phone,
    address, description, preferred_date: preferredDate || null, status: 'pending',
  });
  if (error) { console.error('Guest quote insertion failed', error.code); return respond(503, { error: 'Unable to submit your request right now' }, origin); }
  return respond(201, { received: true, message: 'Your request has been received for review.' }, origin);
});
