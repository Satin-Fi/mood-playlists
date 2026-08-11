# Mood Playlists Website

A simple, responsive website featuring multiple mood-based YouTube playlists, inspired by the delux saloon concept.

## Structure

- `index.html` - Main page with mood cards
- `delux-saloon.html` - Delux Saloon mood playlist page
- `auto.html` - Auto mood playlist page
- `baarish.html` - Baarish mood playlist page
- `roof.html` - Roof mood playlist page
- `truck.html` - Truck mood playlist page

## Quick Start

1. **Browse moods** on `index.html` — a glassmorphic grid of five immersive mood cards, each with its own wallpaper.
2. **Click any card** to open its dedicated full-screen page with edge-to-edge wallpaper, glass card for the YouTube playlist, and ambient motion (raindrops on Baarish, twinkling stars on Roof).
3. **Replace playlist IDs** (see below) to point each page at your own YouTube playlists.

## How to Use

1. **Replace YouTube Playlist IDs**: Each mood page has an iframe with a placeholder YouTube playlist ID. Replace:
   - Keep `PLTJ1PnzCWyFw` in delux-saloon.html (matches the original delux saloon reference)
   - `YOUR_AUTO_PLAYLIST_ID` with your Auto rickshaw playlist ID
   - `YOUR_BAARISH_PLAYLIST_ID` with your Baarish playlist ID
   - `YOUR_ROOF_PLAYLIST_ID` with your Roof playlist ID
   - `YOUR_TRUCK_PLAYLIST_ID` with your Truck playlist ID

2. **Wallpapers**: The `images/` folder contains hand-drawn-style cinematic wallpapers for each mood, generated to match the delux saloon aesthetic (vintage Indian street scenes, warm earthy palette, painterly texture). They are referenced via absolute paths inside the `bg-layer` divs. To swap them, replace the image files in `images/` and update the `background-image` URLs in each page's CSS.

3. **Typography**: The suite uses **Playfair Display** (display/headings), **Poppins** (card labels), and **Inter** (body/UI). All are loaded from Google Fonts via the `<link>` tags in each `<head>`.

4. **Colors**: Each mood page defines its own `:root` CSS variables (primary, secondary, accent, glass tones) pulled from its wallpaper palette. The shared glassmorphism recipe is identical across pages — only the color tokens differ.

## Design System

See `DESIGN.md` for the full token spec: colors, typography scale, spacing, motion timings, and component definitions used across all pages.

### Glassmorphism recipe (shared)
- Background: `rgba(255,255,255,0.06)`
- Border: `rgba(255,255,255,0.12)` (hover: `0.22–0.25`)
- Backdrop blur: `22–26px` depending on mood
- Rounded corners: `28px` on cards, `999px` on tags/buttons
- Shadow: `0 8px 32px rgba(0,0,0,0.35)` with inset highlight line
- Hover lift: `translateY(-4px to -8px)` with expanded shadow

### Motion
- Page entrance: `fade-in 0.9s ease-out`
- Elements sequence in with `fade-slide-up 0.7–0.8s` at staggered delays (0.2s–0.7s)
- Card hover: cubic-bezier `0.34, 1.56, 0.64, 1` spring easing (exaggerated overshoot for liveliness)
- Ambient micro-motion: Baarish rains fall continuously; Roof stars twinkle on staggered timers. Both respect `prefers-reduced-motion`.

### Responsive
- Index grid: `auto-fit minmax(280px, 1fr)` — collapses to single column on narrow viewports
- Mood pages: full-bleed backgrounds, centered hero constrained to `max-width: 780px`
- Font sizes use `clamp()` for fluid scaling across devices
- All interactive areas remain tappable at 44px+ touch targets

## Quick Start

1. **Browse moods** on `index.html` — a glassmorphic grid of five immersive mood cards, each with its own wallpaper.
2. **Click any card** to open its dedicated full-screen page with edge-to-edge wallpaper, glass card for the YouTube playlist, and ambient motion (raindrops on Baarish, twinkling stars on Roof).
3. **Replace playlist IDs** (see below) to point each page at your own YouTube playlists.

## How to Use

1. **Replace YouTube Playlist IDs**: Each mood page has an iframe with a placeholder YouTube playlist ID. Replace:
   - Keep `PLTJ1PnzCWyFw` in delux-saloon.html (matches the original delux saloon reference)
   - `YOUR_AUTO_PLAYLIST_ID` with your Auto rickshaw playlist ID
   - `YOUR_BAARISH_PLAYLIST_ID` with your Baarish playlist ID
   - `YOUR_ROOF_PLAYLIST_ID` with your Roof playlist ID
   - `YOUR_TRUCK_PLAYLIST_ID` with your Truck playlist ID

2. **Wallpapers**: The `images/` folder contains hand-drawn-style cinematic wallpapers for each mood, generated to match the delux saloon aesthetic (vintage Indian street scenes, warm earthy palette, painterly texture). They are referenced via absolute paths inside the `bg-layer` divs. To swap them, replace the image files in `images/` and update the `background-image` URLs in each page's CSS.

3. **Typography**: The suite uses **Playfair Display** (display/headings), **Poppins** (card labels), and **Inter** (body/UI). All are loaded from Google Fonts via the `<link>` tags in each `<head>`.

4. **Colors**: Each mood page defines its own `:root` CSS variables (primary, secondary, accent, glass tones) pulled from its wallpaper palette. The shared glassmorphism recipe is identical across pages — only the color tokens differ.

## Design System

See `DESIGN.md` for the full token spec: colors, typography scale, spacing, motion timings, and component definitions used across all pages.

### Glassmorphism recipe (shared)
- Background: `rgba(255,255,255,0.06)`
- Border: `rgba(255,255,255,0.12)` (hover: `0.22–0.25`)
- Backdrop blur: `22–26px` depending on mood
- Rounded corners: `28px` on cards, `999px` on tags/buttons
- Shadow: `0 8px 32px rgba(0,0,0,0.35)` with inset highlight line
- Hover lift: `translateY(-4px to -8px)` with expanded shadow

### Motion
- Page entrance: `fade-in 0.9s ease-out`
- Elements sequence in with `fade-slide-up 0.7–0.8s` at staggered delays (0.2s–0.7s)
- Card hover: cubic-bezier `0.34, 1.56, 0.64, 1` spring easing (exaggerated overshoot for liveliness)
- Ambient micro-motion: Baarish rains fall continuously; Roof stars twinkle on staggered timers. Both respect `prefers-reduced-motion`.

### Responsive
- Index grid: `auto-fit minmax(280px, 1fr)` — collapses to single column on narrow viewports
- Mood pages: full-bleed backgrounds, centered hero constrained to `max-width: 780px`
- Font sizes use `clamp()` for fluid scaling across devices
- All interactive areas remain tappable at 44px+ touch targets

## Deployment to Vercel (recommended)

This project is a static site — no build step, no framework, no server. Deploy in under 2 minutes:

### Option A: Vercel dashboard (fastest)
1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Click **Add New → Project** → **Import Git Repository**
4. Select this repo
5. Keep all defaults (Framework Preset: **Other / Static HTML**, Root Directory: leave as-is or set to `mood-sites/`)
6. Click **Deploy**

### Option B: Vercel CLI
```bash
npm i -g vercel
cd mood-sites
vercel login
vercel --prod
```

### Environment variables (not required)
This is a static site with zero backend dependencies. No `.env` variables are needed for the pages to render. The only external requests are:
- Google Fonts (fonts.googleapis.com) — loaded via `<link>` tags
- YouTube embeds (www.youtube.com) — loaded via `<iframe>` per mood page

### GitHub Actions CI/CD
A workflow at `.github/workflows/deploy.yml` can auto-deploy on every push to `main`. To enable:
1. Get a Vercel token: `vercel login` then go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Add repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
3. The workflow deploys the `mood-sites/` directory as a static preview/prod site

### Custom domain
- Vercel → Project Settings → Domains → add your domain (e.g. `moods.yoursite.com`)
- DNS verification is handled automatically by Vercel (add the CNAME/ALIAS they provide)