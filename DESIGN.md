---
version: alpha
name: MoodPlaylists
description: Immersive full-screen mood playlist experience with glassmorphism cards and motion — inspired by delux saloon wallpaper aesthetic
colors:
  common:
    transparent: "rgba(0,0,0,0)"
    white: "#FFFFFF"
    black: "#000000"
    overlay-dark: "rgba(0,0,0,0.55)"
    overlay-light: "rgba(255,255,255,0.15)"
  global:
    text: "#FFFFFF"
    text-muted: "rgba(255,255,255,0.7)"
    glass-bg: "rgba(255,255,255,0.08)"
    glass-border: "rgba(255,255,255,0.18)"
    glass-shadow: "0 8px 32px rgba(0,0,0,0.4)"
  saloon:
    primary: "#8B1A1A"
    secondary: "#D4A574"
    accent: "#F5E6D3"
    accent-muted: "rgba(245,230,211,0.6)"
  auto:
    primary: "#E8830C"
    secondary: "#1A1A3E"
    accent: "#FFE082"
    accent-muted: "rgba(255,224,130,0.5)"
  baarish:
    primary: "#0D4F4F"
    secondary: "#FF8C42"
    accent: "#E8F4F8"
    accent-muted: "rgba(232,244,248,0.5)"
  roof:
    primary: "#1A237E"
    secondary: "#FFD54F"
    accent: "#FFF8E1"
    accent-muted: "rgba(255,248,225,0.6)"
  truck:
    primary: "#D84315"
    secondary: "#0D47A1"
    accent: "#FFF3E0"
    accent-muted: "rgba(255,243,224,0.6)"
typography:
  display:
    fontFamily: 'Playfair Display', Georgia, serif
    fontWeight: 700
    lineHeight: 1.1
  heading:
    fontFamily: 'Poppins', system-ui, sans-serif
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: 'Inter', system-ui, sans-serif
    fontSize: 1rem
    lineHeight: 1.6
  caption:
    fontFamily: 'Inter', system-ui, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    letterSpacing: "0.02em"
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  2xl: 64px
  4xl: 96px
animation:
  fade-in-duration: 0.8s
  fade-in-delay: 0.2s
  slide-up-distance: 30px
  slide-up-duration: 0.6s
  card-hover-translate: -6px
  card-hover-scale: 1.02
  backdrop-blur-radius: 20px
components:
  mood-header:
    title-font: "{typography.display}"
    title-size: 4rem
    subtitle-font: "{typography.body}"
    subtitle-size: 1.125rem
    subtitle-color: "{colors.text-muted}"
  playlist-card:
    background: "{colors.glass-bg}"
    backdrop-filter: blur({animation.backdrop-blur-radius}px)
    -webkit-backdrop-filter: blur({animation.backdrop-blur-radius}px)
    border: "1px solid {colors.glass-border}"
    border-radius: "{rounded.xl}"
    box-shadow: "{colors.glass-shadow}"
    padding: "{spacing.2xl}"
  back-button:
    color: "{colors.text}"
    text-decoration: none
    font-family: "{typography.body}"
    font-weight: 500
    font-size: 0.9rem
    padding: 12px 24px
    transition: all 0.3s ease
  nav-dot:
    width: 10px
    height: 10px
    border-radius: "{rounded.full}"
    background: "rgba(255,255,255,0.3)"
    transition: all 0.3s ease
  nav-dot-active:
    background: "{colors.secondary}"
    transform: scale(1.3)
  footer:
    font-size: "{typography.caption}"
    color: "{colors.text-muted}"
    padding: "{spacing.md}"
    text-align: center
  title-subtitle-group:
    text-align: center
    animation: fade-slide-in "{animation.fade-in-duration}" "{animation.fade-in-delay}" ease-out backwards
  main-content:
    position: relative
    z-index: 10
    min-height: 100vh
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    padding: "{spacing.xl}"
    animation: fade-in "{animation.fade-in-duration}" ease-out backwards

sections:
  hero:
    min-height: calc(100vh - {spacing.4xl})
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    padding: "{spacing.4xl} {spacing.lg}"
  video-wrapper:
    width: 100%
    max-width: 800px
    margin-top: "{spacing.lg}"
    border-radius: "{rounded.xl}"
    overflow: hidden
    animation: fade-slide-up "{animation.slide-up-duration}" "{animation.fade-in-delay + 0.3s}" ease-out backwards

motion-variants:
  entrance:
    opacity: 0
    transform: translateY("{animation.slide-up-distance}")
  entrance-visible:
    opacity: 1
    transform: translateY(0)
  card-rest:
    transform: translateY(0) scale(1)
  card-hover:
    transform: translateY("{animation.card-hover-translate}") scale({animation.card-hover-scale})
  nav-dot-rest:
    background: "rgba(255,255,255,0.3)"
    transform: scale(1)
  nav-dot-active:
    background: "{colors.secondary}"
    transform: scale(1.3)

css-keyframes:
  fade-in:
    "0%": opacity: "0"
    "100%": opacity: "1"
  fade-slide-in:
    "0%":
      opacity: "0"
      transform: "translateY({animation.slide-up-distance})"
    "100%":
      opacity: "1"
      transform: "translateY(0)"
  fade-slide-up:
    "0%":
      opacity: "0"
      transform: "translateY({animation.slide-up-distance})"
    "100%":
      opacity: "1"
      transform: "translateY(0)"
  card-appear:
    "0%":
      opacity: "0"
      transform: "scale(0.95)"
    "100%":
      opacity: "1"
      transform: "scale(1)"
  float:
    "0%, 100%": transform: "translateY(0)"
    "50%": transform: "translateY(-10px)"

css-classes:
  glass-card:
    background: "{colors.glass-bg}"
    backdrop-filter: blur({animation.backdrop-blur-radius}px)
    -webkit-backdrop-filter: blur({animation.backdrop-blur-radius}px)
    border: "1px solid {colors.glass-border}"
    border-radius: "{rounded.xl}"
    box-shadow: "{colors.glass-shadow}"
  glass-card-hover:
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
    "&:hover":
      transform: "translateY({animation.card-hover-translate})"
      box-shadow: "0 12px 40px rgba(0,0,0,0.5)"

assets:
  fonts:
    primary: "Inter"
    display: "Playfair Display"
    heading: "Poppins"
    caption: "Inter"
  google-fonts:
    - Inter:wght@300;400;500;600;700&display=swap
    - Playfair+Display:wght@700&display=swap
    - Poppins:wght@400;500;600;700&display=swap
  background-images:
    saloon: "/mood-sites/images/delux-saloon.jpg"
    auto: "/mood-sites/images/auto.jpg"
    baarish: "/mood-sites/images/baarish.jpg"
    roof: "/mood-sites/images/roof.jpg"
    truck: "/mood-sites/images/truck.jpg"

design-rationale: >
  This system delivers an immersive, cinematic mood-experience where each page
  feels like a self-contained aesthetic world. The wallpaper-quality background
  images bleed edge-to-edge at 100vw with `background-size: cover`. Content
  lives inside glassmorphism cards — frosted-glass panels that let the imagery
  show through while maintaining readability via subtle backdrop blur.

  Motion is restrained and purposeful: pages fade in on load, the video player
  slides up with a slight delay for rhythmic pacing, and interactive elements
  respond with smooth cubic-bezier easing on hover. The typography pairs a
  serif display face (Playfair Display) with a clean sans-serif body (Inter),
  echoing the vintage-meets-modern sensibility of the source artwork.

  Each mood carries its own palette derived from its wallpaper, but the shared
  glassmorphism vocabulary keeps the suite feeling like one coherent platform.
