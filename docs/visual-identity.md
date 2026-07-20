# Identidade visual — Queima Asfalto

**Português** · [English](#english)

---

<a id="portugues"></a>

## Português

Guia de identidade visual e assets para a aplicação Queima Asfalto, desenvolvidos com estilo de modelação low poly. Exemplos de inspiração para o desenvolvimento: [Visual Identity Board](./visual-identity-board.png).

A paleta e os tokens de UI vivem em `src/styles/globals.css`. A app suporta **modo claro** e **modo escuro**; por defeito segue o tema do sistema (Definições → Aparência).

### Logotipo e ícones

- **Logotipo principal:** sapatilha de corrida dinâmica envolta em chamas low poly, com tipografia "Queima Asfalto" em azul elétrico.
- **PWA app icon:** versão circular simplificada com a sapatilha em chamas.
- **Browser tab & favicon:** favicon 16×16 focado na chama.
- **Modo escuro:** o logotipo circular e os emojis/medalhas mantêm as cores vibrantes originais; funcionam bem sobre fundos escuros.

### Tipografia

- **Display:** Bebas Neue — títulos de página (ex.: "EVENTOS").
- **Sans:** Poppins — corpo, formulários e navegação.

### Temas (paleta semântica)

| Token | Claro | Escuro | Uso |
|-------|-------|--------|-----|
| `primary` | `#2563EB` | `#2563EB` | Botões, títulos, estado Confirmado |
| `primary-hover` | `#1D4ED8` | `#1D4ED8` | Hover de botões primários |
| `accent` | `#F97316` | `#F97316` | Destaques, saudações, gráficos |
| `success` | `#10B981` | `#20CA91` | Metas concluídas, gráficos (mais claro no escuro) |
| `danger` | `#EF4444` | `#F15B5B` | Erros e alertas (mais claro no escuro) |
| `foreground` | `#1F2937` | `#EAEAEA` | Texto principal |
| `muted` | `#6B7280` | `#A1A1A1` | Texto secundário, legendas |
| `background` | `#F9FAFB` | `#121212` | Fundo da aplicação |
| `surface` | `#FFFFFF` | `#1E1E1E` | Cartões, tabelas, header |
| `border` | `#E5E7EB` | `#333333` | Divisores e contornos |

**`theme-color` (PWA / browser):** `#2563EB` no claro, `#121212` no escuro.

### Status pills (eventos)

Cores definidas por variáveis `--color-status-*` em `globals.css`:

| Estado | Claro (fundo / texto) | Escuro (fundo / texto) |
|--------|------------------------|-------------------------|
| Planeado | `#E2E8F0` / `#475569` | `#2A2A2A` / `#D1D5DB` |
| Confirmado | `#2563EB` / `#FFFFFF` | `#2563EB` / `#FFFFFF` |
| Concluído | `#D1FAE5` / `#065F46` | `#143D2F` / `#20CA91` |
| Faltou | `#FED7AA` / `#92400E` | `#4A2C12` / `#FDBA74` |
| Cancelado | `#FEE2E2` / `#991B1B` | `#4A1F1F` / `#F15B5B` |

No escuro, os pills usam fundos mais escuros e texto mais claro para manter contraste legível.

### Avisos (notificações / permissões)

| Token | Claro | Escuro |
|-------|-------|--------|
| `warning-bg` | `#FFFBEB` | `#3B2A14` |
| `warning-border` | `#FDE68A` | `#92400E` |
| `warning-fg` | `#78350F` | `#FDE68A` |

### Modo escuro — princípios

- Fundos profundos (`#121212`) com superfícies elevadas (`#1E1E1E`) para cartões e tabelas.
- Texto invertido para branco/cinza claro; títulos em Bebas Neue mantêm impacto visual.
- Azul elétrico e laranja de acento **não mudam** entre temas — são a âncora da marca.
- Verde e vermelho semânticos são ligeiramente mais claros no escuro para legibilidade.
- Preferir tokens Tailwind (`bg-surface`, `text-muted`, `text-danger`, etc.) em vez de cores hex fixas no código.

### UI assets e ilustrações

- **Vignette motivacional:** corredor low poly numa montanha ao pôr do sol ("VAMOS!").
- **Medalhas de metas:** 5×5Km, 3×10Km, Half Marathon.
- **Gráfico de evolução:** linhas para "Evolução do Ritmo" (cores de série em `src/utils/chartData.ts`).
- **Ícones offline:** torre de sinal + cofre de dados.
- **Padrões decorativos:** sapatilhas, relógios, mapas, chamas.
- **Humor sarcástico:** corredor encostado à parede ("200º lugar").
- **Tom de voz (copy):** ver [`voice.md`](./voice.md) — motivacional, exigente, sarcástico com moderação.
- **Progresso:** arco a 75% concluído.

---

<a id="english"></a>

## English

[Português](#portugues)

Visual identity guide and assets for the Queima Asfalto app, developed in a low-poly modelling style. Inspiration examples for development: [Visual Identity Board](./visual-identity-board.png).

The palette and UI tokens live in `src/styles/globals.css`. The app supports **light** and **dark** mode; by default it follows the system theme (Settings → Appearance).

### Logo and icons

- **Main logo:** dynamic running shoe wrapped in low-poly flames, with "Queima Asfalto" typography in electric blue.
- **PWA app icon:** simplified circular version with the flaming shoe.
- **Browser tab & favicon:** 16×16 favicon focused on the flame.
- **Dark mode:** the circular logo and emoji/medals keep their original vibrant colours; they work well on dark backgrounds.

### Typography

- **Display:** Bebas Neue — page titles (e.g. "EVENTOS").
- **Sans:** Poppins — body text, forms, and navigation.

### Themes (semantic palette)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `primary` | `#2563EB` | `#2563EB` | Buttons, titles, Confirmed status |
| `primary-hover` | `#1D4ED8` | `#1D4ED8` | Primary button hover |
| `accent` | `#F97316` | `#F97316` | Highlights, greetings, charts |
| `success` | `#10B981` | `#20CA91` | Completed goals, charts (lighter in dark) |
| `danger` | `#EF4444` | `#F15B5B` | Errors and alerts (lighter in dark) |
| `foreground` | `#1F2937` | `#EAEAEA` | Primary text |
| `muted` | `#6B7280` | `#A1A1A1` | Secondary text, captions |
| `background` | `#F9FAFB` | `#121212` | App background |
| `surface` | `#FFFFFF` | `#1E1E1E` | Cards, tables, header |
| `border` | `#E5E7EB` | `#333333` | Dividers and outlines |

**`theme-color` (PWA / browser):** `#2563EB` in light mode, `#121212` in dark mode.

### Status pills (events)

Colours defined by `--color-status-*` variables in `globals.css`:

| Status | Light (bg / text) | Dark (bg / text) |
|--------|-------------------|------------------|
| Planned | `#E2E8F0` / `#475569` | `#2A2A2A` / `#D1D5DB` |
| Confirmed | `#2563EB` / `#FFFFFF` | `#2563EB` / `#FFFFFF` |
| Completed | `#D1FAE5` / `#065F46` | `#143D2F` / `#20CA91` |
| Missed | `#FED7AA` / `#92400E` | `#4A2C12` / `#FDBA74` |
| Cancelled | `#FEE2E2` / `#991B1B` | `#4A1F1F` / `#F15B5B` |

In dark mode, pills use darker backgrounds and lighter text for readable contrast.

### Warnings (notifications / permissions)

| Token | Light | Dark |
|-------|-------|------|
| `warning-bg` | `#FFFBEB` | `#3B2A14` |
| `warning-border` | `#FDE68A` | `#92400E` |
| `warning-fg` | `#78350F` | `#FDE68A` |

### Dark mode — principles

- Deep backgrounds (`#121212`) with elevated surfaces (`#1E1E1E`) for cards and tables.
- Inverted text to white/light grey; Bebas Neue titles keep visual impact.
- Electric blue and orange accent **do not change** between themes — they anchor the brand.
- Semantic green and red are slightly lighter in dark mode for legibility.
- Prefer Tailwind tokens (`bg-surface`, `text-muted`, `text-danger`, etc.) over hard-coded hex in code.

### UI assets and illustrations

- **Motivational vignette:** low-poly runner on a mountain at sunset ("VAMOS!").
- **Goal medals:** 5×5Km, 3×10Km, Half Marathon.
- **Pace evolution chart:** lines for "Evolução do Ritmo" (series colours in `src/utils/chartData.ts`).
- **Offline icons:** signal tower + data vault.
- **Decorative patterns:** shoes, watches, maps, flames.
- **Sarcastic humour:** runner leaning against a wall ("200th place").
- **Voice (copy):** see [`voice.md`](./voice.md) — motivational, demanding, sarcastic in moderation.
- **Progress:** arc at 75% complete.
