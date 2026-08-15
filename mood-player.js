/* Mood Suite — shared YouTube player chrome */

const cfg = {
  pageTitle: 'Mood Playlists',
  tracksJson: 'mood-tracks.json',
  quoteLines: [],
  hornEnabled: false,
  hornSrc: 'images/horn.mp3',
  listenerMin: 180,
  listenerMax: 620,
  ...window.MOOD_CONFIG,
};

const $ = (id) => document.getElementById(id);

const el = {
  player: $('player'),
  cover: $('cover'),
  title: $('title'),
  artist: $('artist'),
  seek: $('seek'),
  seekFill: $('seekFill'),
  seekKnob: $('seekKnob'),
  tCur: $('tCur'),
  tDur: $('tDur'),
  play: $('play'),
  prev: $('prev'),
  next: $('next'),
  shuffle: $('shuffle'),
  listBtn: $('listBtn'),
  list: $('list'),
  listItems: $('listItems'),
  clock: $('clock'),
  listeners: $('listeners'),
  bumperText: $('bumperText'),
  bumperNext: $('bumperNext'),
  horn: $('horn'),
  logo: document.querySelector('.logo'),
};

const state = {
  tracks: [],
  order: [], // indices into tracks, in play order
  pos: 0, // index into order
  shuffle: true,
  ready: false,
  playing: false,
  started: false,
  scrubbing: false,
};

let yt = null;

/* Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const fmt = (s) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/** FisherÃ¢â‚¬â€œYates, in place. Every index equally likely in every position. */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Fresh random order every load; shuffle off falls back to playlist order. */
function buildOrder() {
  const seq = Array.from({ length: state.tracks.length }, (_, i) => i);
  return state.shuffle ? shuffle(seq) : seq;
}

const currentTrack = () => state.tracks[state.order[state.pos]];

/* Ã¢â€â‚¬Ã¢â€â‚¬ Rendering Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

let swapTimer = null;

function renderTrack() {
  const t = currentTrack();
  if (!t) return;

  // Fade the old title out, swap, fade back in Ã¢â‚¬â€ but not on first paint,
  // where there's nothing to fade from and it just reads as a flicker.
  if (el.title.dataset.rendered) {
    el.player.classList.add('is-swapping');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => el.player.classList.remove('is-swapping'), 40);
  }
  el.title.dataset.rendered = '1';

  el.title.textContent = t.title;
  el.artist.textContent = t.artist || t.rawTitle || '';
  el.cover.src = t.cover || '';
  el.cover.alt = `${t.title} artwork`;
  el.cover.classList.toggle('is-letterboxed', (t.cover || '').includes('ytimg.com'));
  // Only take over the tab title once someone is actually listening. Doing it
  // on load meant a crawler indexed whichever song the shuffle happened to
  // pick, so the page's title changed on every crawl.
  if (state.started) document.title = `${t.title} - ${cfg.pageTitle}`;

  [...el.listItems.children].forEach((li, i) =>
    li.classList.toggle('is-current', i === state.pos),
  );
  const active = el.listItems.children[state.pos];
  if (active && el.list.classList.contains('is-open')) {
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function renderList() {
  el.listItems.innerHTML = '';
  state.order.forEach((trackIdx, i) => {
    const t = state.tracks[trackIdx];
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';

    const title = document.createElement('span');
    title.className = 't-title';
    title.textContent = t.title;

    const artist = document.createElement('span');
    artist.className = 't-artist';
    artist.textContent = t.artist || '';

    btn.append(title, artist);
    btn.addEventListener('click', () => go(i));
    li.append(btn);
    el.listItems.append(li);
  });
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Background rotation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   Both layers are in the DOM from the start, so the second image
   is already decoded by the time we crossfade to it.
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const bgLayers = [...document.querySelectorAll('.bg__layer')];
let bgIndex = 0;

/* The second image isn't visible until the first track change, so keep it out
   of the initial load and fetch it once the page is idle. Saves ~190KB on
   first paint. Armed well before any rotation can happen. */
function deferSecondBackground() {
  const arm = () => bgLayers.slice(1).forEach((l) => l.classList.add('is-armed'));
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  if (document.readyState === 'complete') idle(arm);
  else window.addEventListener('load', () => idle(arm), { once: true });
}

function rotateBackground(to) {
  if (bgLayers.length < 2) return;
  const n = bgLayers.length;
  bgIndex = (((to ?? bgIndex + 1) % n) + n) % n;
  // Arm only the layer we're about to show Ã¢â‚¬â€ arming them all here would
  // undo the deferral on the very first call.
  bgLayers[bgIndex].classList.add('is-armed');
  bgLayers.forEach((layer, i) => layer.classList.toggle('is-active', i === bgIndex));
}

/* `is-playing` drives the spinning disc and the play/pause icon swap in CSS. */
function renderPlaying(on) {
  state.playing = on;
  el.player.classList.toggle('is-playing', on);
  el.play.setAttribute('aria-label', on ? 'Pause' : 'Play');
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Playback Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

function go(newPos) {
  const n = state.order.length;
  state.pos = ((newPos % n) + n) % n;
  renderTrack();
  rotateBackground();
  if (!yt) return;
  state.started = true;
  yt.loadVideoById(currentTrack().id);
}

function toggle() {
  if (!yt || !state.ready) return;
  if (state.playing) {
    yt.pauseVideo();
  } else {
    state.started = true;
    yt.playVideo();
  }
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Progress loop Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

/* The YouTube API only reports a new currentTime a few times a second, so
   reading it straight into the DOM gives a bar that lurches. Instead we poll
   it slowly, then extrapolate from the wall clock every animation frame Ã¢â‚¬â€ the
   bar travels continuously and re-syncs whenever the real value moves. */
const poll = { at: 0, time: 0, duration: 0 };
let lastSecond = -1;
let lastDuration = -1;

function samplePlayer() {
  if (!yt || typeof yt.getCurrentTime !== 'function') return;
  poll.time = yt.getCurrentTime() || 0;
  poll.duration = yt.getDuration() || 0;
  poll.at = performance.now();
}

function paintProgress() {
  requestAnimationFrame(paintProgress);
  if (!yt || state.scrubbing || !poll.duration) return;

  const drift = state.playing ? (performance.now() - poll.at) / 1000 : 0;
  const cur = Math.min(poll.duration, poll.time + drift);
  const frac = Math.min(1, Math.max(0, cur / poll.duration));

  el.seekFill.style.transform = `scaleX(${frac})`;
  el.seekKnob.style.transform = `translate(-50%, -50%) translateX(${
    frac * el.seek.clientWidth
  }px)`;

  // Text only when it would actually change Ã¢â‚¬â€ cheaper, and no flicker.
  const second = Math.floor(cur);
  if (second !== lastSecond) {
    lastSecond = second;
    el.tCur.textContent = fmt(cur);
    el.seek.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
  }
  if (poll.duration !== lastDuration) {
    lastDuration = poll.duration;
    el.tDur.textContent = fmt(poll.duration);
  }
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Seeking Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

function fractionFromEvent(e) {
  const r = el.seek.getBoundingClientRect();
  return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
}

function previewSeek(frac) {
  el.seekFill.style.transform = `scaleX(${frac})`;
  el.seekKnob.style.transform = `translate(-50%, -50%) translateX(${
    frac * el.seek.clientWidth
  }px)`;
  if (yt && typeof yt.getDuration === 'function') {
    el.tCur.textContent = fmt((yt.getDuration() || 0) * frac);
  }
}

el.seek.addEventListener('pointerdown', (e) => {
  if (!yt) return;
  state.scrubbing = true;
  el.seek.setPointerCapture(e.pointerId);
  previewSeek(fractionFromEvent(e));
});

el.seek.addEventListener('pointermove', (e) => {
  if (state.scrubbing) previewSeek(fractionFromEvent(e));
});

el.seek.addEventListener('pointerup', (e) => {
  if (!state.scrubbing) return;
  state.scrubbing = false;
  el.seek.releasePointerCapture(e.pointerId);
  const dur = yt?.getDuration?.() || 0;
  if (dur) yt.seekTo(dur * fractionFromEvent(e), true);
  samplePlayer(); // resync the extrapolator straight away
});

el.seek.addEventListener('keydown', (e) => {
  const step = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
  if (!step || !yt) return;
  e.preventDefault();
  yt.seekTo(Math.max(0, (yt.getCurrentTime() || 0) + step), true);
});

/* Ã¢â€â‚¬Ã¢â€â‚¬ Controls Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

el.play.addEventListener('click', toggle);
el.prev.addEventListener('click', () => {
  // Standard player behaviour: restart the track unless you're near the top.
  if (yt && (yt.getCurrentTime() || 0) > 3) yt.seekTo(0, true);
  else go(state.pos - 1);
});
el.next.addEventListener('click', () => go(state.pos + 1));

el.shuffle.addEventListener('click', () => {
  const trackIdx = state.order[state.pos];
  state.shuffle = !state.shuffle;
  el.shuffle.classList.toggle('is-on', state.shuffle);
  el.shuffle.setAttribute('aria-pressed', String(state.shuffle));

  state.order = buildOrder();
  state.pos = Math.max(0, state.order.indexOf(trackIdx));
  renderList();
  renderTrack();
});

el.listBtn.addEventListener('click', () => {
  const open = !el.list.classList.contains('is-open');
  el.list.classList.toggle('is-open', open);
  el.listBtn.classList.toggle('is-on', open);
  el.listBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    el.listItems.children[state.pos]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, [contenteditable]')) return;
  if (e.key === ' ' || e.key === 'k') {
    e.preventDefault();
    toggle();
  } else if (e.key === 'n' || e.key === 'ArrowRight') {
    if (e.target !== el.seek) go(state.pos + 1);
  } else if (e.key === 'p' || e.key === 'ArrowLeft') {
    if (e.target !== el.seek) go(state.pos - 1);
  } else if (e.key === 'h' && cfg.hornEnabled) {
    honk();
  }
});

/* Ã¢â€â‚¬Ã¢â€â‚¬ The horns Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   Three voices you'd actually hear on GT Road, all synthesised Ã¢â‚¬â€
   no audio files. A horn is basically a stack of detuned reed
   tones through a lowpass, so that's what each of these is.
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

let audioCtx = null;

/* iOS gives a page one audio session. Left on the default, starting WebAudio
   can interrupt whatever the YouTube iframe is doing, so the horn and the
   music fight over the speaker. Declaring the page as media playback asks the
   OS to let both sound at once. Safari 16.4+; a no-op everywhere else. */
try {
  if (navigator.audioSession) navigator.audioSession.type = 'playback';
} catch {
  /* not supported */
}

function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    // Must stay synchronous Ã¢â‚¬â€ resuming inside the gesture is what unlocks it.
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/* Unlock and decode on the first touch anywhere, whatever it was for. By the
   time either the horn or the play button is pressed, both audio paths are
   already live Ã¢â‚¬â€ otherwise the first honk races a fetch and a decode while
   iOS is still deciding who owns the speaker. */
function primeAudio() {
  const ctx = ensureAudio();
  if (ctx) loadHorn(ctx);
}

['pointerdown', 'keydown'].forEach((evt) =>
  document.addEventListener(evt, primeAudio, { once: true, capture: true }),
);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  // iOS suspends the audio context when the page is backgrounded.
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  // Background tabs freeze rAF and throttle timers, so the progress sample
  // goes stale. Re-read it now or the bar extrapolates from a minutes-old
  // reading and slams to the end for a moment before catching up.
  samplePlayer();
});

const HORN_SRC = cfg.hornSrc;

let hornBytes = null; // the undecoded file
let hornBuffer = null; // decoded, ready to play
let hornSource = null; // whatever is sounding right now

// Fetch up front so the first press is instant. Decoding waits for a user
// gesture, since that's when the AudioContext is allowed to exist.
if (cfg.hornEnabled) {
  fetch(HORN_SRC)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .then((b) => (hornBytes = b))
    .catch(() => {});
}

async function loadHorn(ctx) {
  if (hornBuffer) return hornBuffer;
  if (!hornBytes) {
    try {
      hornBytes = await (await fetch(HORN_SRC)).arrayBuffer();
    } catch {
      return null;
    }
  }
  try {
    // decodeAudioData detaches the buffer it's given, so hand it a copy Ã¢â‚¬â€
    // otherwise a failed decode would leave nothing to retry with.
    hornBuffer = await ctx.decodeAudioData(hornBytes.slice(0));
  } catch {
    return null;
  }
  return hornBuffer;
}

/* Pull the music down while someone leans on the horn, then let it back up. */
let duckTimer = null;
let duckedFrom = null;

function duckMusic(ms) {
  if (!yt || typeof yt.getVolume !== 'function') return;
  if (duckedFrom === null) duckedFrom = yt.getVolume();
  yt.setVolume(Math.round(duckedFrom * 0.4));

  clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    if (duckedFrom !== null) yt.setVolume(duckedFrom);
    duckedFrom = null;
  }, ms + 120);
}

async function honk() {
  const ctx = ensureAudio();
  if (!ctx) return;

  const buffer = await loadHorn(ctx);
  if (!buffer) return;

  // Retrigger rather than layer Ã¢â‚¬â€ mashing the button should feel like
  // pumping the horn, not like a pile-up.
  try {
    hornSource?.stop();
  } catch {
    /* already finished */
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = 0.9;
  source.connect(gain).connect(ctx.destination);
  source.onended = () => {
    if (hornSource === source) hornSource = null;
  };
  source.start();
  hornSource = source;

  const ms = buffer.duration * 1000;
  duckMusic(ms);

  // The button flashes and the wordmark rattles, like the cab does.
  [
    [el.horn, 'is-blaring', 450],
    [el.logo, 'is-shaking', 720],
  ].forEach(([node, cls, ms]) => {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth; // restart the CSS animation
    node.classList.add(cls);
    setTimeout(() => node.classList.remove(cls), ms);
  });
}

if (cfg.hornEnabled && el.horn) el.horn.addEventListener('click', honk);

/* Ã¢â€â‚¬Ã¢â€â‚¬ Bumper lines Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   What's actually painted across the back of a truck: warnings,
   blessings, goodbyes, and the odd bit of showing off.
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const BUMPER_LINES = cfg.quoteLines || [];

let bumperOrder = [];
let bumperPos = 0;
let bumperTimer = null;

function shuffleLines() {
  bumperOrder = shuffle(BUMPER_LINES.map((_, i) => i));
}

function nextBumper() {
  bumperPos += 1;
  // Reshuffle at the end of a pass so you don't see a fixed loop.
  if (bumperPos >= bumperOrder.length) {
    const last = bumperOrder[bumperOrder.length - 1];
    shuffleLines();
    // Avoid repeating the line that's already on screen across the seam.
    if (bumperOrder[0] === last && bumperOrder.length > 1) {
      [bumperOrder[0], bumperOrder[1]] = [bumperOrder[1], bumperOrder[0]];
    }
    bumperPos = 0;
  }

  el.bumperText.classList.add('is-swapping');
  setTimeout(() => {
    el.bumperText.textContent = BUMPER_LINES[bumperOrder[bumperPos]];
    el.bumperText.classList.remove('is-swapping');
  }, 250);

  clearInterval(bumperTimer);
  bumperTimer = setInterval(nextBumper, 12000);
}

if (BUMPER_LINES.length && el.bumperText) {
  shuffleLines();
  bumperPos = bumperOrder.indexOf(0);
  if (bumperPos < 0) bumperPos = 0;
  el.bumperText.textContent = BUMPER_LINES[bumperOrder[bumperPos]];
  bumperTimer = setInterval(nextBumper, 12000);
  if (el.bumperNext) el.bumperNext.addEventListener('click', nextBumper);
} else if (el.bumperText?.closest('.bumper')) {
  el.bumperText.closest('.bumper').hidden = true;
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Ambient chrome: clock + fellow travellers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

function tickClock() {
  el.clock.textContent = new Date()
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
}
tickClock();
setInterval(tickClock, 15000);

/* Listener count. A random walk between 500 and 800 that leans back toward
   the middle, so it drifts the way a real audience would instead of jittering.
   It is decorative, not measured Ã¢â‚¬â€ the Redis-backed version that counted real
   sessions is in git history if you ever want it back. */
(function driftListeners() {
  const MIN = cfg.listenerMin; const MAX = cfg.listenerMax;
  let count = 560 + Math.floor(Math.random() * 70);

  el.listeners.textContent = String(count);

  const step = () => {
    const midpoint = (MIN + MAX) / 2;
    const up = Math.random() < (count < midpoint ? 0.58 : 0.42);
    count = Math.max(MIN, Math.min(MAX, count + (up ? 1 : -1) * (1 + Math.floor(Math.random() * 4))));
    el.listeners.textContent = String(count);
    setTimeout(step, 2500 + Math.random() * 3500);
  };

  setTimeout(step, 2000);
})();

/* Ã¢â€â‚¬Ã¢â€â‚¬ YouTube iframe boot Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

/* Nothing is ever shown Ã¢â‚¬â€ the iframe is a 1Ãƒâ€”1 box parked off-screen Ã¢â‚¬â€ so ask
   YouTube for the smallest rendition it has and stop paying for pixels nobody
   sees. The embed has no audio-only mode; this plus the 1Ãƒâ€”1 size is as close
   as it gets. YouTube may override the hint, hence the try. */
function preferAudio() {
  try {
    yt?.setPlaybackQuality?.('tiny');
  } catch {
    /* the API ignores the hint on some videos */
  }
}

function bootYouTubePlayer() {
  yt = new YT.Player('yt-player', {
    height: '1',
    width: '1',
    videoId: currentTrack().id,
    playerVars: {
      autoplay: 0,
      playsinline: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      fs: 0,
      iv_load_policy: 3,
      enablejsapi: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        state.ready = true;
        el.play.disabled = false;
        preferAudio();
      },
      onStateChange: (e) => {
        const S = YT.PlayerState;
        if (e.data === S.PLAYING) {
          renderPlaying(true);
          preferAudio();
        }
        else if (e.data === S.PAUSED || e.data === S.BUFFERING) renderPlaying(e.data === S.BUFFERING && state.playing);
        else if (e.data === S.ENDED) go(state.pos + 1);
      },
      onError: () => {
        // Region-blocked or pulled down Ã¢â‚¬â€ roll on to the next one.
        if (state.started) go(state.pos + 1);
      },
    },
  });

  setInterval(samplePlayer, 250);
  requestAnimationFrame(paintProgress);
}

function loadYouTubeIframeAPI() {
  if (window.YT?.Player) {
    bootYouTubePlayer();
    return;
  }
  window.onYouTubeIframeAPIReady = bootYouTubePlayer;
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.append(s);
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Start Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

(async function init() {
  state.tracks = Array.isArray(window.MOOD_TRACKS) ? window.MOOD_TRACKS.slice() : [];

  if (!state.tracks.length) {
    try {
      const res = await fetch(cfg.tracksJson);
      state.tracks = await res.json();
    } catch {
      el.title.textContent = 'Could not load the playlist';
      el.artist.textContent = 'Check mood tracks file';
      return;
    }
  }

  if (!state.tracks.length) {
    el.title.textContent = 'No tracks yet';
    return;
  }

  state.order = buildOrder();
  renderList();
  renderTrack();
  // Always open on layer 1. A random opener would pull both images on half of
  // all loads, which costs more than the variety is worth Ã¢â‚¬â€ the rotation on
  // track change gives you that anyway.
  rotateBackground(0);
  deferSecondBackground();

  loadYouTubeIframeAPI();
})();
