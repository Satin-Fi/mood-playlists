/**
 * Ephemeral per-mood chat API (Vercel serverless).
 *
 * Required Vercel environment variables:
 *   SUPABASE_URL              — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (never expose to the browser)
 *
 * Run once in Supabase SQL editor:
 *
 *   CREATE TABLE chat_messages (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     room_id TEXT NOT NULL,
 *     display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 32),
 *     body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
 *     client_id TEXT NOT NULL,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX idx_chat_messages_room_created ON chat_messages (room_id, created_at DESC);
 *   ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "service_only" ON chat_messages FOR ALL USING (false);
 */

const TTL_HOURS = 2;
const MIN_GAP_SEC = 4;
const MAX_PER_MINUTE = 12;
const MAX_BODY = 280;

const LINK_RE =
  /(https?:\/\/|www\.|\.(com|org|net|io|co|in|me|app|dev|xyz|info|biz|us|uk|tv|cc|ly|link|click|page|site|shop|store|blog|online|live|chat)\b|telegram\.me|t\.me\/|wa\.me\/|chat\.whatsapp)/i;

const ALLOWED_ROOMS = new Set([
  'barber-shop',
  'truck-driver',
  'cafe',
  'pan-shop',
  'chai-tapri',
  'rain-season',
  'ocean',
  'mountain',
  'suhana-safar',
  'mehfil',
  'auto',
  'roof',
]);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function supabaseCfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

async function sbFetch(path, { method = 'GET', body } = {}) {
  const cfg = supabaseCfg();
  if (!cfg) throw new Error('chat_not_configured');

  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `supabase_${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function cleanupOld() {
  const cutoff = new Date(Date.now() - TTL_HOURS * 3600 * 1000).toISOString();
  await sbFetch(`chat_messages?created_at=lt.${cutoff}`, { method: 'DELETE' });
}

async function getMessages(room) {
  const since = new Date(Date.now() - TTL_HOURS * 3600 * 1000).toISOString();
  const q = `chat_messages?room_id=eq.${encodeURIComponent(room)}&created_at=gte.${since}&order=created_at.asc&limit=80&select=id,room_id,display_name,body,created_at`;
  return sbFetch(q);
}

async function rateLimit(room, clientId) {
  const sinceMinute = new Date(Date.now() - 60 * 1000).toISOString();
  const sinceGap = new Date(Date.now() - MIN_GAP_SEC * 1000).toISOString();

  const recent = await sbFetch(
    `chat_messages?room_id=eq.${encodeURIComponent(room)}&client_id=eq.${encodeURIComponent(clientId)}&created_at=gte.${sinceMinute}&order=created_at.desc&select=created_at&limit=${MAX_PER_MINUTE}`,
  );

  if (!Array.isArray(recent)) return;

  if (recent.length >= MAX_PER_MINUTE) {
    const err = new Error('rate_minute');
    err.code = 429;
    throw err;
  }

  if (recent.length && recent[0].created_at > sinceGap) {
    const err = new Error('rate_gap');
    err.code = 429;
    throw err;
  }
}

function sanitizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 32);
}

function sanitizeBody(body) {
  return String(body || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_BODY);
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!supabaseCfg()) {
    res.status(503).json({ error: 'Chat backend not configured yet.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const room = String(req.query.room || '').trim();
      if (!ALLOWED_ROOMS.has(room)) {
        res.status(400).json({ error: 'Invalid room.' });
        return;
      }
      await cleanupOld().catch(() => {});
      const messages = await getMessages(room);
      res.status(200).json({ messages: messages || [] });
      return;
    }

    if (req.method === 'POST') {
      const { room, displayName, body, clientId } = req.body || {};
      const roomId = String(room || '').trim();
      const name = sanitizeName(displayName);
      const text = sanitizeBody(body);
      const client = String(clientId || '').trim().slice(0, 64);

      if (!ALLOWED_ROOMS.has(roomId)) {
        res.status(400).json({ error: 'Invalid room.' });
        return;
      }
      if (name.length < 2) {
        res.status(400).json({ error: 'Name too short.' });
        return;
      }
      if (text.length < 1) {
        res.status(400).json({ error: 'Message empty.' });
        return;
      }
      if (LINK_RE.test(text) || LINK_RE.test(name)) {
        res.status(400).json({ error: 'Links and promos are not allowed.' });
        return;
      }
      if (!client) {
        res.status(400).json({ error: 'Missing client id.' });
        return;
      }

      await rateLimit(roomId, client);

      const inserted = await sbFetch('chat_messages', {
        method: 'POST',
        body: {
          room_id: roomId,
          display_name: name,
          body: text,
          client_id: client,
        },
      });

      res.status(201).json({ message: Array.isArray(inserted) ? inserted[0] : inserted });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    if (err.message === 'chat_not_configured') {
      res.status(503).json({ error: 'Chat backend not configured yet.' });
      return;
    }
    if (err.code === 429) {
      res.status(429).json({
        error:
          err.message === 'rate_minute'
            ? 'Too many messages this minute. Take a breath.'
            : 'Slow down — one message every few seconds.',
      });
      return;
    }
    console.error('chat error', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
