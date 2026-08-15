/* Mood Suite — shared mood pills + Chit Chat panel */

const MOOD_PILLS = [
  { id: 'barber-shop', label: 'Barber Shop', href: 'delux-saloon.html' },
  { id: 'truck-driver', label: 'Truck Driver', href: 'truck.html' },
  { id: 'cafe', label: 'Cafe', href: 'cafe.html', comingSoon: true },
  { id: 'pan-shop', label: 'Pan Shop', href: 'pan-shop.html', comingSoon: true },
  { id: 'chai-tapri', label: 'Chai Tapri', href: 'chai-tapri.html', comingSoon: true },
  { id: 'rain-season', label: 'Rain Season', href: 'baarish.html' },
  { id: 'ocean', label: 'Ocean', href: 'ocean.html', comingSoon: true },
  { id: 'mountain', label: 'Mountain', href: 'mountain.html', comingSoon: true },
  { id: 'suhana-safar', label: 'Suhana Safar', href: 'suhana-safar.html', comingSoon: true },
  { id: 'mehfil', label: 'Mehfil', href: 'mehfil.html', comingSoon: true },
];

const CHAT = {
  nameKey: 'moodChatName',
  clientKey: 'moodChatClientId',
  pollMs: 4000,
  maxBody: 280,
};

const shellCfg = {
  moodId: null,
  ...window.MOOD_CONFIG,
};

function currentMoodId() {
  if (shellCfg.moodId) return shellCfg.moodId;
  const path = (window.location.pathname.split('/').pop() || '').toLowerCase();
  const map = {
    'delux-saloon.html': 'barber-shop',
    'truck.html': 'truck-driver',
    'baarish.html': 'rain-season',
    'auto.html': 'auto',
    'roof.html': 'roof',
    'cafe.html': 'cafe',
    'pan-shop.html': 'pan-shop',
    'chai-tapri.html': 'chai-tapri',
    'ocean.html': 'ocean',
    'mountain.html': 'mountain',
    'suhana-safar.html': 'suhana-safar',
    'mehfil.html': 'mehfil',
  };
  return map[path] || null;
}

function uuid() {
  return crypto.randomUUID?.() || `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getClientId() {
  let id = sessionStorage.getItem(CHAT.clientKey);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(CHAT.clientKey, id);
  }
  return id;
}

function getDisplayName() {
  return (sessionStorage.getItem(CHAT.nameKey) || '').trim();
}

function setDisplayName(name) {
  sessionStorage.setItem(CHAT.nameKey, name.trim());
}

/* ── Mood pills ─────────────────────────────────────────────── */

function mountMoodPills() {
  const dock = document.querySelector('.dock');
  if (!dock || dock.querySelector('.mood-pills')) return;

  const activeId = currentMoodId();
  const nav = document.createElement('nav');
  nav.className = 'mood-pills';
  nav.setAttribute('aria-label', 'Mood selector');

  const track = document.createElement('div');
  track.className = 'mood-pills__track';
  track.setAttribute('role', 'list');

  MOOD_PILLS.forEach((mood) => {
    const a = document.createElement('a');
    a.className = 'mood-pill';
    a.href = mood.href;
    a.textContent = mood.label;
    a.setAttribute('role', 'listitem');
    if (mood.id === activeId) a.classList.add('is-active');
    if (mood.comingSoon) a.setAttribute('data-coming-soon', 'true');
    track.append(a);
  });

  nav.append(track);
  const player = dock.querySelector('.player');
  const comingSoon = dock.querySelector('.coming-soon');
  const anchor = player || comingSoon || dock.lastElementChild;
  dock.insertBefore(nav, anchor);

  const active = track.querySelector('.is-active');
  if (active) {
    requestAnimationFrame(() =>
      active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }),
    );
  }
}

/* ── Chit Chat button ───────────────────────────────────────── */

function mountChatButton() {
  const links = document.querySelector('.topbar .links');
  if (!links || document.getElementById('chatOpen')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'chatOpen';
  btn.className = 'link chat-open';
  btn.setAttribute('aria-label', 'Open Chit Chat');
  btn.setAttribute('aria-controls', 'chatPanel');
  btn.setAttribute('aria-expanded', 'false');
  btn.title = 'Chit Chat';
  btn.innerHTML = `<span class="chat-open__label">Chit Chat</span>`;
  links.prepend(btn);
  btn.addEventListener('click', () => openChat());
}

/* ── Chat panel ─────────────────────────────────────────────── */

let chatEls = null;
let pollTimer = null;
let lastSeen = null;

function buildChatPanel() {
  if (document.getElementById('chatPanel')) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'chat-backdrop';
  backdrop.id = 'chatBackdrop';
  backdrop.hidden = true;

  const panel = document.createElement('aside');
  panel.className = 'chat-panel';
  panel.id = 'chatPanel';
  panel.setAttribute('aria-label', 'Chit Chat');
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <header class="chat-panel__head">
      <div>
        <p class="chat-panel__eyebrow">Live room</p>
        <h2 class="chat-panel__title">Chit Chat</h2>
      </div>
      <button type="button" class="chat-panel__close" id="chatClose" aria-label="Close chat">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
    </header>
    <section class="chat-gate" id="chatGate">
      <p class="chat-gate__lead">Pick a name before you join the room.</p>
      <label class="chat-gate__label" for="chatNameInput">Display name</label>
      <input id="chatNameInput" class="chat-gate__input" type="text" maxlength="32" autocomplete="nickname" placeholder="e.g. Sharma ji" />
      <button type="button" class="chat-gate__btn" id="chatNameBtn">Enter chat</button>
    </section>
    <div class="chat-body" id="chatBody" hidden>
      <div class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-relevant="additions"></div>
      <p class="chat-status" id="chatStatus" hidden></p>
      <form class="chat-compose" id="chatForm">
        <input id="chatInput" class="chat-compose__input" type="text" maxlength="280" autocomplete="off" placeholder="Say something nice…" />
        <button type="submit" class="chat-compose__send" aria-label="Send message">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M3.4 20.6l17.8-8.4a1 1 0 000-1.8L3.4 2a1 1 0 00-1.5.9v6.2a1 1 0 00.7.9L14 12 2.6 14a1 1 0 00-.7.9v6.2a1 1 0 001.5.9z"/>
          </svg>
        </button>
      </form>
    </div>
  `;

  document.body.append(backdrop, panel);

  chatEls = {
    backdrop,
    panel,
    gate: panel.querySelector('#chatGate'),
    body: panel.querySelector('#chatBody'),
    messages: panel.querySelector('#chatMessages'),
    status: panel.querySelector('#chatStatus'),
    form: panel.querySelector('#chatForm'),
    input: panel.querySelector('#chatInput'),
    nameInput: panel.querySelector('#chatNameInput'),
    nameBtn: panel.querySelector('#chatNameBtn'),
    openBtn: () => document.getElementById('chatOpen'),
    closeBtn: panel.querySelector('#chatClose'),
  };

  chatEls.closeBtn.addEventListener('click', closeChat);
  backdrop.addEventListener('click', closeChat);
  chatEls.nameBtn.addEventListener('click', submitName);
  chatEls.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitName();
    }
  });
  chatEls.form.addEventListener('submit', sendMessage);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatEls.panel.classList.contains('is-open')) closeChat();
  });

  if (getDisplayName()) showChatBody();
}

function openChat() {
  buildChatPanel();
  chatEls.panel.classList.add('is-open');
  chatEls.backdrop.hidden = false;
  chatEls.panel.setAttribute('aria-hidden', 'false');
  const openBtn = chatEls.openBtn();
  if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('chat-is-open');

  if (getDisplayName()) {
    showChatBody();
    fetchMessages(true);
    startPolling();
    chatEls.input?.focus();
  } else {
    chatEls.nameInput.focus();
  }
}

function closeChat() {
  if (!chatEls) return;
  chatEls.panel.classList.remove('is-open');
  chatEls.backdrop.hidden = true;
  chatEls.panel.setAttribute('aria-hidden', 'true');
  const openBtn = chatEls.openBtn();
  if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('chat-is-open');
  stopPolling();
}

function submitName() {
  const name = (chatEls.nameInput.value || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2) {
    chatEls.nameInput.setCustomValidity('At least 2 characters');
    chatEls.nameInput.reportValidity();
    return;
  }
  chatEls.nameInput.setCustomValidity('');
  setDisplayName(name);
  showChatBody();
  fetchMessages(true);
  startPolling();
  chatEls.input.focus();
}

function showChatBody() {
  chatEls.gate.hidden = true;
  chatEls.body.hidden = false;
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  } catch {
    return '';
  }
}

function renderMessages(rows) {
  if (!rows.length) {
    chatEls.messages.innerHTML = `<p class="chat-empty">No messages yet. Say hello.</p>`;
    return;
  }
  chatEls.messages.innerHTML = rows
    .map(
      (m) => `
    <article class="chat-msg">
      <header class="chat-msg__head">
        <span class="chat-msg__name">${escapeHtml(m.display_name)}</span>
        <time class="chat-msg__time" datetime="${m.created_at}">${fmtTime(m.created_at)}</time>
      </header>
      <p class="chat-msg__text">${escapeHtml(m.body)}</p>
    </article>`,
    )
    .join('');
  chatEls.messages.scrollTop = chatEls.messages.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showStatus(msg, isError = false) {
  chatEls.status.hidden = !msg;
  chatEls.status.textContent = msg || '';
  chatEls.status.classList.toggle('is-error', isError);
}

async function fetchMessages(scroll = false) {
  const room = currentMoodId();
  if (!room) return;
  try {
    const res = await fetch(`/api/chat/messages?room=${encodeURIComponent(room)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showStatus(data.error || 'Chat is warming up. Try again in a moment.', true);
      return;
    }
    const rows = data.messages || [];
    const newest = rows.length ? rows[rows.length - 1].id : null;
    if (newest !== lastSeen || scroll) {
      renderMessages(rows);
      if (scroll) chatEls.messages.scrollTop = chatEls.messages.scrollHeight;
      lastSeen = newest;
    }
    showStatus('');
  } catch {
    showStatus('Chat is warming up. Try again in a moment.', true);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => fetchMessages(), CHAT.pollMs);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function sendMessage(e) {
  e.preventDefault();
  const body = (chatEls.input.value || '').trim();
  if (!body) return;

  const room = currentMoodId();
  const displayName = getDisplayName();
  if (!room || !displayName) return;

  chatEls.input.disabled = true;
  showStatus('');

  try {
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room,
        displayName,
        body,
        clientId: getClientId(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showStatus(data.error || 'Could not send. Slow down or try again.', true);
      return;
    }
    chatEls.input.value = '';
    await fetchMessages(true);
  } catch {
    showStatus('Network hiccup. Try again.', true);
  } finally {
    chatEls.input.disabled = false;
    chatEls.input.focus();
  }
}

/* ── Boot ───────────────────────────────────────────────────── */

function initShell() {
  mountMoodPills();
  mountChatButton();
  buildChatPanel();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShell);
} else {
  initShell();
}
