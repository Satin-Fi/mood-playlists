/**
 * Ephemeral per-mood chat API (Vercel serverless).
 *
 * Backend (first match wins):
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN — recommended
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — legacy Postgres store
 *
 * Supabase setup (only if using Postgres):
 *   CREATE TABLE chat_messages (...);  — see git history for full DDL
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

function chatBackend() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return 'redis';
  }
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'supabase';
  }
  return null;
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function roomKey(room) {
  return `chat:room:${room}`;
}

function rateKey(room, clientId) {
  return `chat:rl:${room}:${clientId}`;
}

function publicError(err) {
  if (!err) return 'Something went wrong.';
  if (err.message === 'chat_not_configured') {
    return 'Chat backend not configured yet. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN on Vercel.';
  }
  if (err.code === 'chat_unreachable') {
    return 'Chat database is offline or unreachable. Check backend credentials.';
  }
  const cause = err.cause || {};
  if (cause.code === 'ENOTFOUND' || cause.code === 'ECONNREFUSED') {
    return 'Chat database is offline or unreachable. Check backend credentials.';
  }
  if (err.message === 'fetch failed' || err.name === 'TypeError') {
    return 'Chat database is offline or unreachable. Check backend credentials.';
  }
  if (typeof err.message === 'string' && err.message.includes('relation') && err.message.includes('chat_messages')) {
    return 'Chat table missing in database. Run the chat_messages migration.';
  }
  return null;
}

/* ── Upstash Redis ──────────────────────────────────────────── */

async function redisCmd(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('chat_not_configured');

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
  } catch (err) {
    const wrapped = new Error('fetch failed');
    wrapped.cause = err.cause || err;
    throw wrapped;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `redis_${res.status}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function redisCleanupRoom(room) {
  const cutoff = Date.now() - TTL_HOURS * 3600 * 1000;
  await redisCmd(['ZREMRANGEBYSCORE', roomKey(room), '-inf', cutoff]);
}

async function redisGetMessages(room) {
  const since = Date.now() - TTL_HOURS * 3600 * 1000;
  await redisCleanupRoom(room);
  const rows = await redisCmd(['ZRANGEBYSCORE', roomKey(room), since, '+inf', 'LIMIT', 0, 80]);
  if (!Array.isArray(rows)) return [];
  return rows.map((raw) => {
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      id: msg.id,
      room_id: msg.room_id || room,
      display_name: msg.display_name,
      body: msg.body,
      created_at: msg.created_at,
    };
  });
}

async function redisRateLimit(room, clientId) {
  const key = rateKey(room, clientId);
  const now = Date.now();
  const sinceMinute = now - 60 * 1000;
  const sinceGap = now - MIN_GAP_SEC * 1000;

  await redisCmd(['ZREMRANGEBYSCORE', key, '-inf', sinceMinute]);
  const count = await redisCmd(['ZCARD', key]);
  if (Number(count) >= MAX_PER_MINUTE) {
    const err = new Error('rate_minute');
    err.code = 429;
    throw err;
  }

  const latest = await redisCmd(['ZREVRANGE', key, 0, 0, 'WITHSCORES']);
  if (Array.isArray(latest) && latest.length >= 2) {
    const lastTs = Number(latest[1]);
    if (lastTs > sinceGap) {
      const err = new Error('rate_gap');
      err.code = 429;
      throw err;
    }
  }
}

async function redisInsert(room, name, text, client) {
  const now = Date.now();
  const created_at = new Date(now).toISOString();
  const message = {
    id: newId(),
    room_id: room,
    display_name: name,
    body: text,
    created_at,
    client_id: client,
  };

  await redisCmd(['ZADD', roomKey(room), now, JSON.stringify(message)]);
  await redisCmd(['ZADD', rateKey(room, client), now, String(now)]);
  await redisCmd(['EXPIRE', roomKey(room), TTL_HOURS * 3600]);
  await redisCmd(['EXPIRE', rateKey(room, client), 120]);

  return message;
}

/* ── Supabase (legacy) ─────────────────────────────────────── */

function supabaseCfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

async function sbFetch(path, { method = 'GET', body } = {}) {
  const cfg = supabaseCfg();
  if (!cfg) throw new Error('chat_not_configured');

  let res;
  try {
    res = await fetch(`${cfg.url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const wrapped = new Error('fetch failed');
    wrapped.cause = err.cause || err;
    throw wrapped;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `supabase_${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function sbCleanupOld() {
  const cutoff = new Date(Date.now() - TTL_HOURS * 3600 * 1000).toISOString();
  await sbFetch(`chat_messages?created_at=lt.${cutoff}`, { method: 'DELETE' });
}

async function sbGetMessages(room) {
  const since = new Date(Date.now() - TTL_HOURS * 3600 * 1000).toISOString();
  const q = `chat_messages?room_id=eq.${encodeURIComponent(room)}&created_at=gte.${since}&order=created_at.asc&limit=80&select=id,room_id,display_name,body,created_at`;
  return sbFetch(q);
}

async function sbRateLimit(room, clientId) {
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

async function sbInsert(room, name, text, client) {
  const inserted = await sbFetch('chat_messages', {
    method: 'POST',
    body: {
      room_id: room,
      display_name: name,
      body: text,
      client_id: client,
    },
  });
  return Array.isArray(inserted) ? inserted[0] : inserted;
}

/* ── Shared ─────────────────────────────────────────────────── */

async function cleanupOld(room) {
  if (chatBackend() === 'redis') {
    await redisCleanupRoom(room);
    return;
  }
  await sbCleanupOld();
}

async function getMessages(room) {
  if (chatBackend() === 'redis') return redisGetMessages(room);
  return sbGetMessages(room);
}

async function rateLimit(room, clientId) {
  if (chatBackend() === 'redis') return redisRateLimit(room, clientId);
  return sbRateLimit(room, clientId);
}

async function insertMessage(room, name, text, client) {
  if (chatBackend() === 'redis') return redisInsert(room, name, text, client);
  return sbInsert(room, name, text, client);
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

function parseBody(req) {
  try {
    const raw = req.body;
    if (raw && typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return raw || null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const backend = chatBackend();
  if (!backend) {
    res.status(503).json({
      error:
        'Chat backend not configured yet. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel project settings.',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const room = String(req.query.room || '').trim();
      if (!ALLOWED_ROOMS.has(room)) {
        res.status(400).json({ error: 'Invalid room.' });
        return;
      }
      await cleanupOld(room).catch(() => {});
      const messages = await getMessages(room);
      res.status(200).json({ messages: messages || [] });
      return;
    }

    if (req.method === 'POST') {
      const payload = parseBody(req);
      if (!payload) {
        res.status(400).json({ error: 'Invalid JSON body.' });
        return;
      }

      const { room, displayName, body, clientId } = payload;
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
      const message = await insertMessage(roomId, name, text, client);
      res.status(201).json({ message });
      return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    if (err.message === 'chat_not_configured') {
      res.status(503).json({ error: publicError(err) });
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

    const friendly = publicError(err);
    if (friendly) {
      console.error('chat error', err);
      res.status(503).json({ error: friendly });
      return;
    }

    console.error('chat error', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
