# PeopleMine Design Language

## Overview

PeopleMine uses a clean, light, grayscale-first design system accented with a warm orange (`#A04F47`). The palette deliberately avoids violet/purple to differentiate from typical SaaS tooling, leaning into a neutral, professional feel with high contrast.

---

## Color Palette

### Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| Page background | `#f4f4f4` | App root background |
| Sidebar | `#F7F7F7` | Left navigation panel |
| Card | `bg-white/40 backdrop-blur-sm` | Widget/card surfaces |
| Card border | `border-gray-300` / `1px solid #E8E8E8` | Widget outlines |
| Input background | `#EFEFEF` / `#f3f3f5` | Search, input fields |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `text-gray-800` / `#030213` | Headings, main text |
| Secondary | `text-gray-500` / `#717182` | Labels, subtitles |
| Muted | `text-gray-400` / `#9ca3af` | Placeholder, date text |
| Nav active | `text-gray-800` | Active nav item |
| Nav default | `text-gray-500` | Default nav item |

### Accent (Orange)
| Token | Value | Usage |
|-------|-------|-------|
| Primary accent | `#A04F47` | Buttons, active indicators, AI branding |
| Hover | `#A04F47` | Button hover state |
| Orange brand (logo) | `#A04F47` | Logo gradient start |
| Orange badge bg | `rgba(160,79,71,0.12)` | AI avatar background |

### Borders & Dividers
| Token | Value | Usage |
|-------|-------|-------|
| Sidebar border | `1px solid #E8E8E8` | Sidebar right edge, dividers |
| Card border | `border-gray-300` | Widget outlines |
| Accent divider | `1px solid #D8D8D8` | Before settings section |
| Nav active bg | `#EBEBEB` | Active navigation item |
| Nav hover bg | `#F0F0F0` | Hover navigation item |

### Grayscale System
| Shade | Value | Usage |
|-------|-------|-------|
| Darkest | `#2D2D2D` / `#1a1a1a` | Avatar colors, urgent badges |
| Dark | `#3d3d3d` | User avatar bg |
| Mid-dark | `#4A4A4A` | "鍑? temperature |
| Mid | `#6E6E6E` | "娓? temperature |
| Light-mid | `#8F959E` | Logo gray elements |
| Light | `#9ca3af` | Contribution grid mid |
| Very light | `#e5e7eb` | Contribution grid empty |

---

## Typography

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Page greeting | `25px` | medium | Gray-800 |
| Page date | `13.5px` | normal | Gray-400 |
| Nav items | `13px` | normal | Truncated |
| Widget headers | `11px` | normal | Gray-700 |
| Widget body | `12px` | normal | Gray-700 |
| Big stat number | `52px` | 700 | Text-shadow for depth |
| Section title | `10px` | normal | Gray-400, all-caps feel |
| User name (sidebar) | `12px` | normal | Gray-700 |
| User email (sidebar) | `10px` | normal | Gray-400 |

---

## Sidebar

- Width range: `56px` (collapsed) 鈫?`299px` (max), default `209px`
- Narrow threshold: `< 100px` = icon-only mode
- Background: `#F7F7F7`
- Right border: `1px solid #E8E8E8`
- Transition: `width 0.22s cubic-bezier(0.4,0,0.2,1)` (disabled during drag)
- Active indicator: `2px` orange left bar (`#A04F47`)
- Collapse toggle: circular button at `-right-3 top-1/2`, `1px solid #E0E0E0`
- Resize handle: `6px` wide zone at right edge; shows orange line on hover/drag
- Search: `#EFEFEF` bg, `1px solid #E2E2E2` border, `fontSize 12`

### Nav Sections
1. 鎴?/ + 浜鸿剦 / 浜鸿剦璧勪骇
2. 浜鸿剦瀹囧畽 / 浼佷笟瀹囧畽 / 鐩爣鍒嗘瀽
3. 鍏崇郴娓╁害 / 绀句氦寤鸿 / 娓镐箰鍦?4. (accent divider) 璁剧疆
5. (border) User profile at bottom

---

## Cards / Widgets

All dashboard widgets use:
```
border border-gray-300 rounded-xl bg-white/40 backdrop-blur-sm
```

- Padding: `p-3` to `p-5` depending on widget type
- Border radius: `rounded-xl` (12px)
- Shadows: none by default; drag shadow `0 16px 48px rgba(0,0,0,0.14)`
- Drag handle: `GripHorizontal` icon, top-right, visible on hover

---

## Dashboard Grid (DraggableCanvas)

- 12-column grid
- Row height: `55px`
- Gap: `16px`
- Ghost placeholder: orange dashed border + very faint orange bg
- Drag animation: `translate` transform during drag, smooth `200ms cubic-bezier(.4,0,.2,1)` transition on drop
- Auto-align toggle: orange `#A04F47` when active, gray-300 when off

---

## Widget Catalog

### AIChatWidget (Xminer)
- Orange `X` logo mark (24脳24 rounded-md)
- Box-style chat bubbles: user = `#2e2e2e` dark, AI = white
- Slash command dropdown with orange accents
- Send button: `#A04F47`

### StatCard
- Big number: `52px` bold with text-shadow
- Accent variant uses `#A04F47` for number and icon
- Trend badge: gray-100 bg, tiny TrendingUp/Down icon

### NeedsMaintenanceWidget
- Ranked list (Top 10)
- Temperature bar: grayscale fill based on relationship warmth
- Urgency badges: dark gray text on near-transparent bg

### RandomGeneratorWidget
- `+/鈭抈 stepper controls
- Gray generate button

### ContributionWidget
- GitHub-style heatmap
- Grayscale cells: `#e5e7eb` 鈫?`#1a1a1a`

### TraitsSummaryWidget
- Recharts RadarChart (orange stroke, 15% fill opacity)
- Traits list on the right
- Xminer insight block at bottom (gray-50 bg, decorative quote mark)

### NetworkTrendWidget
- Recharts AreaChart (gray stroke and fill)
- Subtle gray palette

---

## Motion & Interaction

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Nav hover | instant | 鈥?|
| Sidebar collapse | 220ms | `cubic-bezier(0.4,0,0.2,1)` |
| Widget drag | none (real-time) | 鈥?|
| Widget drop | 200ms | `cubic-bezier(.4,0,.2,1)` |
| Ghost snap | 80ms | `ease` |
| Toggle switch | 200ms | 鈥?|
| Button/link | 160ms | `ease` |

---

## Scrollbar

Use `.scrollbar-ghost` class for horizontal overflow containers:
```css
scrollbar-width: thin;
scrollbar-color: rgba(0,0,0,0.10) transparent;
/* webkit: 3px height/width, barely visible */
```
