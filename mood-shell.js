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

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

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
let lastReactionsSig = '';
let chatMessagesCache = [];
let activeReactionBar = null;
let longPressTimer = null;
const REACTION_BAR_EDGE_PAD = 10;
const REACTION_BAR_GAP = 6;

const mentionState = {
  open: false,
  start: 0,
  filter: '',
  selectedIndex: 0,
  users: [],
};

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
        <div class="chat-compose__wrap">
          <ul class="chat-mentions" id="chatMentions" hidden role="listbox" aria-label="Tag a user"></ul>
          <input id="chatInput" class="chat-compose__input" type="text" maxlength="280" autocomplete="off" placeholder="Say something nice…" />
        </div>
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
    mentions: panel.querySelector('#chatMentions'),
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
  chatEls.input.addEventListener('input', onChatInput);
  chatEls.input.addEventListener('keydown', onChatInputKeydown);
  chatEls.mentions.addEventListener('click', onMentionDropdownClick);
  chatEls.messages.addEventListener('click', onMessagesClick);
  chatEls.messages.addEventListener('pointerdown', onMessagePointerDown);
  chatEls.messages.addEventListener('pointerup', onMessagePointerUp);
  chatEls.messages.addEventListener('pointercancel', onMessagePointerUp);
  chatEls.messages.addEventListener('pointerleave', onMessagePointerUp);
  chatEls.messages.addEventListener('scroll', repositionVisibleReactionBars, { passive: true });
  window.addEventListener('resize', repositionVisibleReactionBars, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatEls.panel.classList.contains('is-open')) closeChat();
  });
  document.addEventListener('click', (e) => {
    if (!chatEls?.messages.contains(e.target)) closeReactionBars();
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
  closeReactionBars();
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

/* ── Chat color palette (muted solids for dark panel) ───────── */

const CHAT_PALETTE = [
  { bg: '#6e4f5a', accent: '#a67d88', text: '#f8f4f5' },
  { bg: '#4d6474', accent: '#7d9aab', text: '#f2f6f8' },
  { bg: '#556b5c', accent: '#8aa895', text: '#f4f7f5' },
  { bg: '#7a5f4f', accent: '#a88972', text: '#faf6f2' },
  { bg: '#5c5670', accent: '#8f89a8', text: '#f3f2f6' },
  { bg: '#4a6170', accent: '#7399ab', text: '#f0f5f7' },
  { bg: '#8a5548', accent: '#b07a68', text: '#fdf8f6' },
  { bg: '#5f6b52', accent: '#8d9a7d', text: '#f5f6f2' },
  { bg: '#6a5768', accent: '#9a8596', text: '#f6f3f5' },
  { bg: '#7a5842', accent: '#a67d62', text: '#faf5f0' },
  { bg: '#465a4e', accent: '#6f8a78', text: '#f2f6f4' },
  { bg: '#565468', accent: '#8583a0', text: '#f1f0f4' },
];

function hashDisplayName(name) {
  let hash = 0;
  const s = String(name).toLowerCase().trim();
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function colorForUser(name) {
  return CHAT_PALETTE[hashDisplayName(name) % CHAT_PALETTE.length];
}

function reactionsSignature(rows) {
  return rows
    .map((m) => {
      const parts = (m.reactions || [])
        .map((r) => `${r.emoji}:${r.count}`)
        .sort()
        .join(',');
      return `${m.id}|${parts}`;
    })
    .join(';');
}

function myReactionForMessage(message) {
  const clientId = getClientId();
  for (const group of message.reactions || []) {
    if (group.users?.some((u) => u.clientId === clientId)) return group.emoji;
  }
  return null;
}

function renderReactionBar(messageId) {
  const mine = chatMessagesCache.find((m) => m.id === messageId);
  const activeEmoji = mine ? myReactionForMessage(mine) : null;
  return `
    <div class="chat-reactions-bar" data-message-id="${escapeHtml(messageId)}" role="toolbar" aria-label="React to message">
      ${REACTION_EMOJIS.map(
        (emoji) =>
          `<button type="button" class="chat-reactions-bar__btn${activeEmoji === emoji ? ' is-active' : ''}" data-action="react" data-message-id="${escapeHtml(messageId)}" data-emoji="${emoji}" aria-label="React ${emoji}">${emoji}</button>`,
      ).join('')}
    </div>`;
}

function renderReactionPills(reactions, messageId) {
  if (!reactions?.length) return '';
  const clientId = getClientId();
  return `
    <div class="chat-reactions" data-message-id="${escapeHtml(messageId)}">
      ${reactions
        .map((r) => {
          const mine = r.users?.some((u) => u.clientId === clientId);
          const names = (r.users || []).map((u) => u.displayName).join(', ');
          return `<button type="button" class="chat-reaction-pill${mine ? ' is-mine' : ''}" data-action="reaction-pill" data-message-id="${escapeHtml(messageId)}" data-emoji="${r.emoji}" title="${escapeHtml(names)}">
            <span class="chat-reaction-pill__emoji" aria-hidden="true">${r.emoji}</span>
            <span class="chat-reaction-pill__count">${r.count}</span>
          </button>`;
        })
        .join('')}
    </div>`;
}

function isNearBottom(el) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}

function renderMessages(rows, opts = {}) {
  const me = getDisplayName().toLowerCase();
  const knownNames = getRoomUsers();
  const stickScroll = opts.forceScroll || isNearBottom(chatEls.messages);
  if (!rows.length) {
    chatEls.messages.innerHTML = `
      <div class="chat-empty">
        <span class="chat-empty__icon" aria-hidden="true">💬</span>
        <p class="chat-empty__text">No messages yet. Say hello!</p>
      </div>`;
    return;
  }
  chatEls.messages.innerHTML = rows
    .map((m) => {
      const isMine = me && m.display_name.toLowerCase() === me;
      const time = fmtTime(m.created_at);
      const bodyHtml = formatMessageWithMentions(m.body, knownNames);
      const reactionsHtml = renderReactionPills(m.reactions, m.id);
      const reactionBar = renderReactionBar(m.id);
      if (isMine) {
        return `
    <article class="chat-msg chat-msg--mine" data-message-id="${escapeHtml(m.id)}">
      <div class="chat-msg__stack">
        ${reactionBar}
        <div class="chat-msg__bubble">
          <p class="chat-msg__text">${bodyHtml}</p>
          <time class="chat-msg__time" datetime="${m.created_at}">${time}</time>
        </div>
        ${reactionsHtml}
      </div>
    </article>`;
      }
      const c = colorForUser(m.display_name);
      return `
    <article class="chat-msg chat-msg--other" data-message-id="${escapeHtml(m.id)}" style="--chat-bg:${c.bg};--chat-accent:${c.accent};--chat-text:${c.text};--chat-border:${c.accent}">
      <span class="chat-msg__name">${escapeHtml(m.display_name)}</span>
      <div class="chat-msg__stack">
        ${reactionBar}
        <div class="chat-msg__bubble">
          <p class="chat-msg__text">${bodyHtml}</p>
          <time class="chat-msg__time" datetime="${m.created_at}">${time}</time>
        </div>
        ${reactionsHtml}
      </div>
    </article>`;
    })
    .join('');
  if (stickScroll) chatEls.messages.scrollTop = chatEls.messages.scrollHeight;
  bindReactionBarStacks();
  repositionVisibleReactionBars();
}

function getReactionBarClampBounds() {
  const panel = chatEls?.panel;
  if (!panel) return null;
  const panelRect = panel.getBoundingClientRect();
  const head = panel.querySelector('.chat-panel__head');
  const headBottom = head ? head.getBoundingClientRect().bottom : panelRect.top;
  return {
    minX: panelRect.left + REACTION_BAR_EDGE_PAD,
    maxX: panelRect.right - REACTION_BAR_EDGE_PAD,
    minY: headBottom + REACTION_BAR_EDGE_PAD,
    maxY: panelRect.bottom - REACTION_BAR_EDGE_PAD,
  };
}

function positionReactionBar(bar, stack) {
  const bubble = stack?.querySelector('.chat-msg__bubble');
  const bounds = getReactionBarClampBounds();
  if (!bar || !bubble || !bounds) return;

  bar.classList.add('is-floating');
  bar.style.position = 'fixed';
  bar.style.left = '0';
  bar.style.top = '0';
  bar.style.right = 'auto';
  bar.style.bottom = 'auto';
  bar.style.transform = 'scale(1)';

  const barW = bar.offsetWidth;
  const barH = bar.offsetHeight;
  const bubbleRect = bubble.getBoundingClientRect();

  let left = bubbleRect.left + bubbleRect.width / 2 - barW / 2;
  left = Math.max(bounds.minX, Math.min(left, bounds.maxX - barW));

  let top = bubbleRect.top - barH - REACTION_BAR_GAP;
  if (top < bounds.minY) {
    top = bubbleRect.bottom + REACTION_BAR_GAP;
    bar.dataset.flipBelow = '1';
  } else {
    delete bar.dataset.flipBelow;
  }
  top = Math.max(bounds.minY, Math.min(top, bounds.maxY - barH));

  bar.style.left = `${left}px`;
  bar.style.top = `${top}px`;
}

function resetReactionBar(bar) {
  if (!bar) return;
  bar.classList.remove('is-floating');
  bar.style.position = '';
  bar.style.left = '';
  bar.style.top = '';
  bar.style.right = '';
  bar.style.bottom = '';
  bar.style.transform = '';
  delete bar.dataset.flipBelow;
}

function repositionVisibleReactionBars() {
  if (!chatEls?.messages) return;
  chatEls.messages.querySelectorAll('.chat-msg__stack.is-reacting, .chat-msg__stack:hover').forEach((stack) => {
    const bar = stack.querySelector('.chat-reactions-bar');
    if (bar) positionReactionBar(bar, stack);
  });
}

function bindReactionBarStacks() {
  if (!chatEls?.messages) return;
  chatEls.messages.querySelectorAll('.chat-msg__stack').forEach((stack) => {
    stack.addEventListener('mouseenter', () => {
      const bar = stack.querySelector('.chat-reactions-bar');
      if (bar) positionReactionBar(bar, stack);
    });
    stack.addEventListener('mouseleave', () => {
      if (!stack.classList.contains('is-reacting')) {
        const bar = stack.querySelector('.chat-reactions-bar');
        if (bar) resetReactionBar(bar);
      }
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getRoomUsers() {
  const names = new Set();
  for (const m of chatMessagesCache) {
    const name = (m.display_name || '').trim();
    if (name.length >= 2) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function formatMessageWithMentions(text, knownNames) {
  if (!text) return '';
  if (!knownNames.length) return escapeHtml(text);

  const names = [...knownNames].sort((a, b) => b.length - a.length);
  const parts = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] === '@') {
      let matched = null;
      for (const name of names) {
        const slice = text.slice(i + 1, i + 1 + name.length);
        if (slice.toLowerCase() === name.toLowerCase()) {
          const after = text[i + 1 + name.length];
          if (!after || /[\s.,!?;:)\]]/.test(after)) {
            matched = name;
            break;
          }
        }
      }
      if (matched) {
        parts.push({ type: 'mention', name: matched });
        i += 1 + matched.length;
        continue;
      }
    }
    let j = i;
    while (j < text.length && text[j] !== '@') j += 1;
    parts.push({ type: 'text', value: text.slice(i, j) });
    i = j;
  }

  return parts
    .map((p) => {
      if (p.type === 'mention') {
        return `<button type="button" class="chat-mention" data-mention="${escapeHtml(p.name)}">${escapeHtml('@' + p.name)}</button>`;
      }
      return escapeHtml(p.value);
    })
    .join('');
}

function getMentionContext(input) {
  const val = input.value;
  const pos = input.selectionStart ?? val.length;
  const before = val.slice(0, pos);
  const atIdx = before.lastIndexOf('@');
  if (atIdx === -1) return null;

  const afterAt = before.slice(atIdx + 1);
  if (/\s/.test(afterAt)) return null;
  if (afterAt.length > 32) return null;

  return { start: atIdx, filter: afterAt };
}

function getMentionCandidates(filter) {
  const me = getDisplayName().toLowerCase();
  const q = filter.toLowerCase();
  return getRoomUsers()
    .filter((name) => {
      if (name.toLowerCase() === me) return false;
      if (!q) return true;
      return name.toLowerCase().startsWith(q);
    })
    .slice(0, 8)
    .map((name) => ({ name, isSelf: false }));
}

function hideMentionDropdown() {
  mentionState.open = false;
  mentionState.users = [];
  mentionState.selectedIndex = 0;
  if (chatEls?.mentions) {
    chatEls.mentions.hidden = true;
    chatEls.mentions.innerHTML = '';
  }
}

function updateMentionDropdown() {
  if (!chatEls?.mentions) return;

  const users = mentionState.users;
  if (!users.length) {
    hideMentionDropdown();
    return;
  }

  chatEls.mentions.hidden = false;
  chatEls.mentions.innerHTML = users
    .map((user, idx) => {
      const active = idx === mentionState.selectedIndex ? ' is-active' : '';
      const selfCls = user.isSelf ? ' is-self' : '';
      return `<li role="option" aria-selected="${idx === mentionState.selectedIndex}">
        <button type="button" class="chat-mentions__item${active}${selfCls}" data-idx="${idx}">${escapeHtml(user.name)}</button>
      </li>`;
    })
    .join('');
}

function showMentionDropdown(ctx) {
  const users = getMentionCandidates(ctx.filter);
  if (!users.length) {
    hideMentionDropdown();
    return;
  }

  mentionState.open = true;
  mentionState.start = ctx.start;
  mentionState.filter = ctx.filter;
  mentionState.users = users;
  mentionState.selectedIndex = 0;
  updateMentionDropdown();
}

function insertMention(name) {
  const input = chatEls.input;
  const ctx = getMentionContext(input) || { start: mentionState.start };
  const val = input.value;
  const end = input.selectionStart ?? val.length;
  const before = val.slice(0, ctx.start);
  const after = val.slice(end);
  const mention = `@${name} `;
  input.value = before + mention + after;
  const newPos = before.length + mention.length;
  input.setSelectionRange(newPos, newPos);
  hideMentionDropdown();
  input.focus();
}

function onChatInput() {
  const ctx = getMentionContext(chatEls.input);
  if (!ctx) {
    hideMentionDropdown();
    return;
  }
  showMentionDropdown(ctx);
}

function onChatInputKeydown(e) {
  if (!mentionState.open) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    mentionState.selectedIndex = Math.min(
      mentionState.selectedIndex + 1,
      mentionState.users.length - 1,
    );
    updateMentionDropdown();
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    mentionState.selectedIndex = Math.max(mentionState.selectedIndex - 1, 0);
    updateMentionDropdown();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const user = mentionState.users[mentionState.selectedIndex];
    if (user) insertMention(user.name);
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    hideMentionDropdown();
  }
}

function onMentionDropdownClick(e) {
  const btn = e.target.closest('.chat-mentions__item');
  if (!btn || btn.classList.contains('is-self')) return;
  const idx = Number(btn.dataset.idx);
  const user = mentionState.users[idx];
  if (user) insertMention(user.name);
}

function onMentionClick(e) {
  const btn = e.target.closest('.chat-mention');
  if (!btn || !chatEls?.input) return;
  const name = btn.dataset.mention;
  if (!name) return;
  chatEls.input.value = `@${name} `;
  chatEls.input.focus();
  const len = chatEls.input.value.length;
  chatEls.input.setSelectionRange(len, len);
  hideMentionDropdown();
}

function closeReactionBars() {
  chatEls?.messages.querySelectorAll('.chat-reactions-bar.is-floating').forEach(resetReactionBar);
  activeReactionBar = null;
  chatEls?.messages.querySelectorAll('.chat-msg__stack.is-reacting').forEach((el) => {
    el.classList.remove('is-reacting');
  });
}

function openReactionBar(stack, messageId) {
  closeReactionBars();
  activeReactionBar = messageId;
  stack.classList.add('is-reacting');
  const bar = stack.querySelector('.chat-reactions-bar');
  if (bar) positionReactionBar(bar, stack);
}

function onMessagePointerDown(e) {
  const stack = e.target.closest('.chat-msg__stack');
  if (!stack || e.target.closest('.chat-reactions-bar__btn, .chat-reaction-pill')) return;
  const msg = stack.closest('.chat-msg');
  const messageId = msg?.dataset.messageId;
  if (!messageId) return;

  if (longPressTimer) clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => {
    openReactionBar(stack, messageId);
    longPressTimer = null;
  }, 420);
}

function onMessagePointerUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function onMessagesClick(e) {
  const mentionBtn = e.target.closest('.chat-mention');
  if (mentionBtn) {
    onMentionClick(e);
    return;
  }

  const reactBtn = e.target.closest('[data-action="react"]');
  if (reactBtn) {
    e.preventDefault();
    const messageId = reactBtn.dataset.messageId;
    const emoji = reactBtn.dataset.emoji;
    if (messageId && emoji) toggleReaction(messageId, emoji);
    return;
  }

  const pillBtn = e.target.closest('[data-action="reaction-pill"]');
  if (pillBtn) {
    e.preventDefault();
    const messageId = pillBtn.dataset.messageId;
    const emoji = pillBtn.dataset.emoji;
    if (messageId && emoji) toggleReaction(messageId, emoji);
    return;
  }

  if (!e.target.closest('.chat-msg__stack')) {
    closeReactionBars();
  }
}

function applyOptimisticReaction(messageId, emoji) {
  const clientId = getClientId();
  const displayName = getDisplayName();
  const msg = chatMessagesCache.find((m) => m.id === messageId);
  if (!msg) return;

  const reactions = (msg.reactions || []).map((r) => ({
    emoji: r.emoji,
    count: r.count,
    users: (r.users || []).map((u) => ({ ...u })),
  }));

  let removed = false;
  for (let i = reactions.length - 1; i >= 0; i -= 1) {
    const group = reactions[i];
    const userIdx = group.users.findIndex((u) => u.clientId === clientId);
    if (userIdx === -1) continue;
    if (group.emoji === emoji) {
      group.users.splice(userIdx, 1);
      group.count -= 1;
      if (group.count <= 0) reactions.splice(i, 1);
      removed = true;
    } else {
      group.users.splice(userIdx, 1);
      group.count -= 1;
      if (group.count <= 0) reactions.splice(i, 1);
    }
    break;
  }

  if (!removed) {
    let group = reactions.find((r) => r.emoji === emoji);
    if (!group) {
      group = { emoji, count: 0, users: [] };
      reactions.push(group);
    }
    group.users.push({ clientId, displayName });
    group.count += 1;
  }

  msg.reactions = reactions;
  renderMessages(chatMessagesCache);
  const stack = chatEls.messages.querySelector(`[data-message-id="${CSS.escape(messageId)}"] .chat-msg__stack`);
  if (stack) {
    stack.classList.add('is-reacting');
    const bar = stack.querySelector('.chat-reactions-bar');
    if (bar) positionReactionBar(bar, stack);
  }
}

async function toggleReaction(messageId, emoji) {
  const room = currentMoodId();
  const displayName = getDisplayName();
  if (!room || !displayName || !messageId || !emoji) return;

  const prevCache = chatMessagesCache.map((m) => ({
    ...m,
    reactions: (m.reactions || []).map((r) => ({
      emoji: r.emoji,
      count: r.count,
      users: (r.users || []).map((u) => ({ ...u })),
    })),
  }));

  applyOptimisticReaction(messageId, emoji);
  showStatus('');

  try {
    const res = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'react',
        room,
        messageId,
        clientId: getClientId(),
        displayName,
        emoji,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      chatMessagesCache = prevCache;
      renderMessages(chatMessagesCache);
      showStatus(chatErrorMessage(res, data, 'Could not react. Try again.'), true);
      return;
    }
    const msg = chatMessagesCache.find((m) => m.id === messageId);
    if (msg && data.reactions) {
      msg.reactions = data.reactions;
      lastReactionsSig = reactionsSignature(chatMessagesCache);
      renderMessages(chatMessagesCache);
    }
  } catch {
    chatMessagesCache = prevCache;
    renderMessages(chatMessagesCache);
    showStatus('Network hiccup. Try again.', true);
  }
}

function showStatus(msg, isError = false) {
  chatEls.status.hidden = !msg;
  chatEls.status.textContent = msg || '';
  chatEls.status.classList.toggle('is-error', isError);
}

function chatErrorMessage(res, data, fallback) {
  if (data?.error) return data.error;
  if (res.status === 503) return 'Chat backend is not ready yet. Check server configuration.';
  if (res.status === 429) return 'Too many messages. Slow down and try again.';
  return fallback;
}

async function fetchMessages(scroll = false) {
  const room = currentMoodId();
  if (!room) return;
  try {
    const res = await fetch(`/api/chat/messages?room=${encodeURIComponent(room)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showStatus(chatErrorMessage(res, data, 'Chat is warming up. Try again in a moment.'), true);
      return;
    }
    const rows = data.messages || [];
    chatMessagesCache = rows;
    const newest = rows.length ? rows[rows.length - 1].id : null;
    const reactionsSig = reactionsSignature(rows);
    if (newest !== lastSeen || reactionsSig !== lastReactionsSig || scroll) {
      renderMessages(rows, { forceScroll: scroll });
      lastSeen = newest;
      lastReactionsSig = reactionsSig;
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
      showStatus(chatErrorMessage(res, data, 'Could not send. Slow down or try again.'), true);
      return;
    }
    chatEls.input.value = '';
    hideMentionDropdown();
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
