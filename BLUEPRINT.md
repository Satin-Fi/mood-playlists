# Delux Saloon — Reference Blueprint & Implementation Doc

**Date:** 2026-08-13 | **Project:** Mood Playlists — Delux Saloon page
**Sources researched:** deluxesalon.in, deluxesaloon.space, hornokplease.xyz, saloon.wtf, YouTube playlist PLTJ1PnzCWyFw

---

## 1. Reference Site Analysis

### Delux Saloon (`deluxesalon.in` / `deluxesaloon.space`)

**What it is:** A viral nostalgic internet radio site that streams classic 90s–2000s Bollywood music in the style of a small-town Indian barbershop radio. Built by Yash Bhardwaj.

**Visual design:**
- **Wallpaper:** Cinematic hand-painted illustration of a red street-side barbershop in a small Indian town. Warm terracotta/red tones. Open-front shop with wooden shelves of amber glass bottles, a large vintage mirror, a classic red barber chair inside. Barber shaving an older Indian man; two men in white kurtas waiting on a wooden bench outside. Left side: small street fruit/vegetable cart piled with oranges, lemons, green fruit, vendor beside it. Vintage black bicycle leaning against shop wall. Large lush banana plants behind cart and shop, palm trees in background. Golden-hour warm nostalgic lighting.
- **Typography:** Playfair Display serif for title ("Delux Saloon"), Inter sans-serif for body/UI. Hindi text used: "डीलक्स सैलून".
- **UI style:** Glassmorphism — dark, semi-transparent frosted-glass cards with backdrop blur, subtle white borders, shadow. Pill-shaped elements.
- **Layout:** Center-aligned hero. Title + subtitle at top, divider, radio player, back-link ("All Moods"), footer.

**Radio player UI (the "Now Playing" bar):**
- Label: "DELUXE SALOON RADIO" (small, uppercase, letter-spaced, secondary/amber color)
- Album art: square, rounded corners, dark background, shows `?` placeholder when nothing playing. Live thumbnail from YouTube when playing.
- Track title: serif, white, truncates with ellipsis. Starts as "Pick a track to start" or "Deluxe Saloon radio — tap play".
- Progress bar: thin, gradient fill (cream→amber), shows "0:00 / 0:00"
- Controls: Previous (skip back, outlined button), Play/Pause (large center button, cream-colored when play, icon swaps between triangle and two bars), Next (skip forward, outlined button)
- Volume: speaker icon + slider on the right (blue fill when at volume)

**Features:**
- Play / pause toggle
- Previous / next track
- Seekable progress bar
- Volume control
- Live track title + thumbnail from YouTube API
- Playlist: YouTube playlist PLTJ1PnzCWyFw "banger songs that play at indian barber shops" — 66 videos, 37,906 views, created by Yash Bhardwaj, updated 5 days ago
- First track: "Mujhse Mohabbat Ka Izhaar (HD) | Hum Hain Rahi Pyar Ke (1993)" by Shemaroo Filmi Gaane
- Everything plays through YouTube embeds → no royalty liability (Content ID handles it)
- Footer: "© 2026 Mood Playlists · Mood Suite"
- Back link: "← All Moods"

### Horn OK Please (`hornokplease.xyz`)

**What it is:** Companion viral nostalgia radio site themed around Indian truck driver music. Same creator ecosystem.

**Visual design:**
- Minimalist, glassmorphism
- Truck/horn culture theme
- Has a horn button (interactive horn sound/button)
- Shows "काम बोलता है" (Hindi for "work speaks") 
- Title: "Truck Wala — Indian truck driver songs | Horn OK Please"
- Time display: "0:00 / 4:47"
- Truck driver playlist of 90s Bollywood songs (Kumar Sanu heavy)

**Features:**
- Horn button (signature interactive element)
- Truck driver playlist
- Minimalist — "you just get a horn button"
- Same YouTube-based playback

---

## 2. Design System Specification

### Color Palette
```
--primary:       #8B1A1A   (deep vermilion red — the saloon)
--secondary:     #D4A574   (warm gold/amber — vintage mirror, skin tone, brass)
--accent:        #F5E6D3   (cream/off-white — paper, vintage label)
--accent-muted:  rgba(245,230,211,0.15)
--glass-bg:      rgba(255,255,255,0.06)
--glass-border:  rgba(255,255,255,0.12)
--glass-hover-border: rgba(255,255,255,0.25)
--text:          #FFFFFF
--text-muted:    rgba(255,255,255,0.65)
--text-subtle:   rgba(255,255,255,0.35)
--backdrop-blur: 24px
--radius-lg:     28px
--radius-md:     16px
--shadow-glass:  0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)
--shadow-hover:  0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)
```

### Typography
- Title: Playfair Display, weight 700, clamp(3rem, 8vw, 5.5rem), text-shadow for depth
- Subtitle: Inter, weight 400, clamp(1rem, 2.5vw, 1.25rem), muted white, line-height 1.6
- Mood tag: Inter, 0.75rem, uppercase, letter-spacing 0.14em, accent color, pill bg
- Radio label: Inter, 0.65rem, uppercase, letter-spacing 0.16em, secondary (gold) color, opacity 0.8
- Radio title: Playfair Display, 0.95rem–1.15rem, white, white-space: nowrap, overflow: hidden, text-overflow: ellipsis
- Radio time: Inter, 0.7rem, tabular-nums, letter-spacing 0.02em, muted, min-width 78px, right-aligned

### Radio Player Component
- **Container:** `.radio-player` — full-width max 720px, pill-shaped (border-radius: 999px), glassmorphism, padding 14px 20px, flex row, gap 16px, fade-slide-up animation (0.8s, delay 0.55s)
- **Album art:** `.radio-art` — 56×56px, rounded 12px, dark bg, overflow hidden, shadow. Image cover-fit. Hover: scale 1.04.
- **Info section:** `.radio-info` — flex 1, column, gap 4px. Contains label + title + progress wrap.
- **Progress:** `.radio-progress` — flex 1, 4px height, rounded, light bg, cursor pointer. Fill: `.radio-progress-fill` — gradient (accent→secondary), width 0%, transition 0.3s linear. Time: `.radio-time` — right-aligned, tabular-nums.
- **Controls:** `.radio-controls` — flex row, gap 6px, flex-shrink 0. Buttons: `.radio-btn` — 36×36px circle, outlined glass, hover: scale 1.08 + accent color. Play button: `.radio-play` — 44×44px, accent bg, primary text, shadow. SVG icons 16×16px.
- **Volume:** `.radio-volume` — flex row, gap 6px, left border separator. Speaker svg 14×14px + slider. Volume fill: `.radio-volume-fill` — accent color, width 70%.
- **Hover:** card lifts 4px, shadow deepens, border lightens
- **Mobile:** wraps to column, volume hidden, smaller art/title

### Background
- `.bg-layer` — fixed, z-index -2, `background-size: cover`, `background-position: center`, image: `images/delux-saloon.jpg`
- `.bg-overlay` — fixed, z-index -1, two-layer gradient: vertical dark red (25%→70%) + diagonal dark vignette

### Animations
- `fade-in`: opacity 0→1, 0.9s
- `fade-slide-up`: opacity 0 + translateY(30px) → opacity 1 + translateY(0), staggered delays per element
- `float-gentle`: translateY 0 → -8px → 0 (for decorative elements)

### Motion / Interaction
- Glass cards lift on hover (translateY -4px)
- Play button glow on hover
- Album art subtle scale on player hover
- Progress fill animates smoothly
- Staggered fade-slide-up on page load

---

## 3. Feature Specification

### Core Features (Delux Saloon)
1. **YouTube playlist playback** — IFrame API, playlist PLTJ1PnzCWyFw
2. **Play/Pause** — toggle button, icon swaps, aria-label updates
3. **Previous/Next** — skip in playlist
4. **Seekable progress bar** — click to seek, keyboard arrows ±5%
5. **Volume slider** — click to set, keyboard arrows ±5%, 0–100
6. **Live track info** — title from `getVideoData().title`, thumbnail as album art
7. **Time display** — current / total, updates every 700ms during playback
8. **Space bar toggle** — keyboard shortcut for play/pause (reference site feature)
9. **Hidden YouTube player** — 1×1 pixel iframe, API-only, no visible YouTube UI
10. **PlayerVars:** autoplay 0, controls 0, modestbranding 1, iv_load_policy 3, disablekb 1, fs 0, enablejsapi 1, showinfo 0, rel 0, playsinline 1, origin set

### Reference Site Features to Consider
- Time-of-day playlist rotation (deluxesaloon.space has 4 rotations: Highway Raat 22:00–05:00, Saloon Classics 09:00–18:00, 90s Dard 18:00–22:00, Shaadi & Sunday 05:00–09:00)
- Day/night wallpaper cycling
- Track credits pages (individual song pages with story)
- Catalogue browser (133 songs listed)
- Links out to Spotify + YouTube Music per track

---

## 4. How It Works (Technical)

### Architecture
- Single static HTML page per mood
- YouTube IFrame API loaded asynchronously via `<script src="https://www.youtube.com/iframe_api">`
- `window.onYouTubeIframeAPIReady` callback instantiates `YT.Player` in a 1×1 hidden div
- PlayerVars specify playlist + UI options
- Events: `onReady` (wire up controls, set initial state), `onStateChange` (PLAYING/PAUSED/ENDED → update UI)
- No backend — fully static, deployable on Vercel

### Player Lifecycle
1. Page loads → YouTube API script injected
2. API ready → `onYouTubeIframeAPIReady` fires → creates hidden player with playlist
3. Player ready → `onReady` → attach event listeners, set initial title "Deluxe Saloon radio — tap play"
4. User clicks play → `togglePlay()` → if no video loaded yet, `cuePlaylist({list: PLAYLIST_ID})` then `playVideo()`
5. State change to PLAYING → `onStateChange` → show pause icon, start tick timer, refresh track info (title + thumbnail), update total time
6. State change to PAUSED → show play icon, stop tick, update current time
7. Track ends → `onStateChange` ENDED → `nextTrack()`
8. User clicks prev/next → `prevVideo()`/`nextVideo()` on player
9. User seeks → `seekTo(frac * duration)`
10. User changes volume → `setVolume(pct)`

### Entry Video
- First video in playlist: `N0jnLZxYwYc` — "Mujhse Mohabbat Ka Izhaar (HD) | Hum Hain Rahi Pyar Ke (1993)"
- Passed as `videoId` to `YT.Player` constructor — required for API to initialize the playlist properly

---

## 5. Bug Fixes Applied

### Duplicate Player (FIXED)
- **Problem:** Two `.radio-player` divs rendered (line 571 + line 615), two YouTube IFrame API script blocks (line 662 + line 826)
- **Root cause:** Incremental patches added a second player without removing the first
- **Fix:** Rewrote file cleanly — single player, single script, IDs consistent (uppercase: RadioArt, RadioTitle, RadioProgress, RadioPlay, RadioPrev, RadioNext, RadioPlayIcon, RadioProgressFill, RadioTime, RadioVolumeSlider, RadioVolumeFill)

### Playlist Not Playing (INVESTIGATED)
- **Playlist verified:** PLTJ1PnzCWyFw is valid — 66 videos, 37,906 views, created by Yash Bhardwaj, first track N0jnLZxYwYc matches
- **Wiring verified:** cuePlaylist called with correct playlist ID, entry video set, events wired (onReady, onStateChange)
- **Potential issues:**
  1. YouTube IFrame API may not load if page is opened from `file://` protocol (CORS/local file restrictions) — must be served over HTTP (Vercel handles this)
  2. Browser may block the API script if ad blockers are active
  3. The 1×1 hidden player may be too small for some browsers — some require minimum dimensions. Consider using a 16×16 or 32×32 hidden div instead of 1×1.
  4. `cuePlaylist` vs `loadPlaylist` — cuePlaylist queues but doesn't load immediately; should work with playVideo() after

---

## 6. Implementation Priority

### Phase 1: Fix & Verify (current)
- [x] Remove duplicate player
- [x] Verify single clean player
- [x] Verify playlist is valid
- [ ] Test playback on Vercel (serve over HTTP, not file://)
- [ ] Consider increasing hidden player size from 1×1 to 16×16 for browser compatibility

### Phase 2: Polish UI
- [ ] Add space bar keyboard shortcut for play/pause
- [ ] Improve placeholder album art (better SVG)
- [ ] Add subtle entrance animations matched to reference
- [ ] Consider time-of-day wallpaper or playlist rotation (advanced)

### Phase 3: Other Mood Pages
- [ ] Auto (auto-rickshaw/tuk-tuk theme)
- [ ] Baarish (rain theme)
- [ ] Roof (rooftop evening theme)
- [ ] Truck (truck driver theme — inspired by hornokplease.xyz)
- Each with own wallpaper + playlist + color palette

### Phase 4: Deploy
- [ ] Push to GitHub (Satin-Fi/mood-playlists)
- [ ] Deploy on Vercel
- [ ] Verify playback works live

---

## 7. Wallpaper Style Guide (for all moods)

All wallpapers should be:
- **Cinematic hand-painted illustration style** — not AI-generated slop, not stock photos
- **Wide desktop wallpaper orientation** — fills the screen
- **No text, logos, or UI elements on the image** — purely atmospheric
- **Empty alt text / metadata-free** — license/header art must be blank
- **Warm, nostalgic, Indian small-town aesthetic** — golden hour, terracotta, warm tones

### Delux Saloon wallpaper
- Red barbershop, Indian street, banana plants, fruit cart, bicycle, men in kurtas
- Warm red/terracotta/golden tones

### Auto (auto-rickshaw / tuk-tuk) wallpaper
- Indian street scene with auto-rickshaw (tuk-tuk), driver, passengers
- Busy urban Indian street, colorful, vibrant
- Warm daylight tones

### Baarish (rain) wallpaper
- Indian street in the rain, monsoon mood
- Wet streets, umbrellas, rain drops, moody cool tones with warm windows
- Dark teal/slate with warm lit windows

### Roof wallpaper
- Rooftop evening scene, Indian city skyline at dusk
- Warm sunset/skyline, silhouettes, string lights
- Warm orange/purple dusk tones

### Truck wallpaper
- Indian highway, truck driver, truck with "Horn OK Please" sign
- Road stretching into distance, truck parked or driving
- Inspired by hornokplease.xyz — truck driver playlist theme
- Warm earthy road tones

---

*End of blueprint. Treat as authoritative spec for all Delux Saloon page work.*
