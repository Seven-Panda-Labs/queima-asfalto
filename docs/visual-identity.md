# Visual identity

Low-poly style: a running shoe wrapped in flames, "Queima Asfalto" in electric blue. Inspiration: [visual identity board](./visual-identity-board.png). Copy tone: [voice.md](./voice.md).

Tokens live in `src/styles/globals.css`. Use the Tailwind tokens (`bg-surface`, `text-muted`, `text-danger`, …), never hard-coded hex. The theme follows the system by default (Settings, Appearance).

## Typography

- **Display:** Bebas Neue, page titles.
- **Sans:** Poppins, everything else.
- **Arabic (RTL):** both fall back to `system-ui`, since the webfonts have no Arabic glyphs.

## Semantic palette

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `primary` | `#2563EB` | `#2563EB` | Buttons, titles, Confirmed status |
| `primary-hover` | `#1D4ED8` | `#1D4ED8` | Primary button hover |
| `accent` | `#F97316` | `#F97316` | Highlights, charts |
| `success` | `#10B981` | `#20CA91` | Completed goals, charts |
| `danger` | `#EF4444` | `#F15B5B` | Errors, alerts |
| `foreground` | `#1F2937` | `#EAEAEA` | Primary text |
| `muted` | `#6B7280` | `#A1A1A1` | Secondary text |
| `background` | `#F9FAFB` | `#121212` | App background |
| `surface` | `#FFFFFF` | `#1E1E1E` | Cards, tables, header |
| `border` | `#E5E7EB` | `#333333` | Dividers |
| `warning-bg` | `#FFFBEB` | `#3B2A14` | Notice background |
| `warning-border` | `#FDE68A` | `#92400E` | Notice border |
| `warning-fg` | `#78350F` | `#FDE68A` | Notice text |

Blue and orange are the brand anchors and do not change between themes; green and red are lighter in dark mode for legibility. `theme-color` is `#2563EB` in light and `#121212` in dark.

## Event status

`--color-status-<status>-{bg,fg,dot}`: `bg`/`fg` for pills, `dot` for calendar and map markers (`statusDotColor`).

| Status | Light bg / fg / dot | Dark bg / fg / dot |
|--------|---------------------|--------------------|
| Planned | `#E2E8F0` / `#475569` / `#475569` | `#2A2A2A` / `#D1D5DB` / `#A1A1A1` |
| Confirmed | `#2563EB` / `#FFFFFF` / `#2563EB` | `#2563EB` / `#FFFFFF` / `#2563EB` |
| Completed | `#D1FAE5` / `#065F46` / `#065F46` | `#143D2F` / `#20CA91` / `#20CA91` |
| Missed | `#FED7AA` / `#92400E` / `#92400E` | `#4A2C12` / `#FDBA74` / `#F97316` |
| Cancelled | `#FEE2E2` / `#991B1B` / `#991B1B` | `#4A1F1F` / `#F15B5B` / `#F15B5B` |

## Chart colours (disciplines)

Defined in `src/utils/chartData.ts`. One hue family per distance class; within a family, darker is longer.

| Family | Disciplines | Colours |
|--------|-------------|---------|
| Track and under 5K | 1500 m, 3000 m, 5K | `#0091ff`, `#007afd`, `#2563EB` |
| Short road | 10K, 15K, 10 miles | `#10B981`, `#1e9f5a`, `#298631` |
| Long road | Half, 30K | `#F97316`, `#d15d00` |
| Marathon and ultra | Marathon, 50K, 50 miles | `#8B5CF6`, `#9a46db`, `#a42fba` |
| Long ultra | 100K, 100 miles | `#d63d99`, `#c61f75` |

This is not a 13-colour categorical palette: neighbours within a family are deliberately close, so exact identity comes from the legend and tooltip. Point charts also vary the marker shape per family (`PACE_CHART_POINT_STYLES`), because `#2563EB` and `#8B5CF6` collapse under protanopia.
