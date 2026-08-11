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

## Deployment

You can host this on any static site hosting service like:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Or any traditional web host

## Legal Note

This site uses YouTube embeds, which means YouTube handles all licensing and royalty payments for the content. As long as you're using official YouTube embeds/links (not downloading and re-uploading content), you don't need to worry about paying royalties directly.