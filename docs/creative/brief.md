# Art-direction brief – AMpro.sk „Výkres“

Branch `feat/creative` · 2026-11-27 · chosen by the client from three concepts (A Výkres, B Os k A0, C Cenník je titulka).

## Idea

**Web AMpro je výkres, ktorý sa sám okótuje.** Every section is a sheet of a construction drawing and is measured with the numbers the client actually gets: m², €, energy class, days, OSO č. 418.

## Truth

- He produces drawings – projekty, kladačské výkresy, nárezové plány, výrobné výkresy do CNC (research §1).
- The numbers are his promise: A0, ±15 %, 24 h, OSO č. 418, 150 m² (research §1, "Numbers that matter").
- His business card is already a drawing: two dashed axes on a golden split crossing in one node.

## Art source + rule taken

- **Josef Müller-Brockmann** – *the grid is the content's logic, made visible*: the page grid is drawn as hairlines; the card's vertical axis sits on the golden split (61.8 %) of the hero.
- **Ladislav Sutnar** – *clarity is the signature*: prices, stages and classes are set as a precise parts list (súpis), tabular numerals, the most-used content is the most beautiful.
- Not taken: Swiss red/black poster look, Sutnar's colour blocks.

## Rules inverted (category conventions from research §3)

1. **Hero render of a white house → a line drawing (rez) of a house**, drawn in ink with a green-hatched thermal envelope. Why: renders are what every competitor sells; a drawing is what he actually makes, and the envelope *is* the energy story.
2. **Energy as an adjective → energy as a dimension**: "A0", "±15 %", "24 h" stand on dimension lines like measured values. Why: numbers are verifiable, adjectives are not.
3. **"X rokov skúseností" → the title block (rohová pečiatka)**: the footer is the drawing's title block with Projektant, OSO č. 418, IČO, sheet number and date. Why: on a drawing, authority is a stamp with a number.

Never inverted: contrast, real text, keyboard, focus, zoom, native scroll, reduced motion, form labels.

## Signature moment

**Kótovanie** – when a section enters, its dimension line is drawn from both ends towards the value (ticks first, then the line, then the number appears). On the home page the hero drawing draws itself once (≤ 1.2 s): ground line → walls → roof → green insulation hatch → dimension lines with *A0* and *OSO č. 418*.
Degrades to: the finished drawing and finished dimension lines (reduced motion, no JS – it is all SVG + CSS, no JS needed at all).

## Voice

Calm, exact, first person plural for the firm, no adjectives without a number.
- „Projekt domu, ktorý spĺňa A0 už na papieri.“
- „Cenu poznáte skôr, než sa ozvete. ±15 %.“
- „Jeden model. Projekcia aj energetika.“
Avoid: moderný, nadčasový, kvalitný, na kľúč, inovatívny, „špičkový“.

## Typography

- **Poppins** only (brand, OFL, self-hosted 300/400/600/700, Latin + Slovak – `ľ ĺ ŕ ô ä ť ď ň č š ž ý á í é ú` checked in the v1 build at display size).
- Roles: display 600 (headings), text 400, *drawing labels* 500-equivalent via 600 at small size with `letter-spacing: 0.08em`, uppercase only for short labels (≤ 3 words, no carons collide at line-height ≥ 1.2).
- Numbers: `font-variant-numeric: tabular-nums lining-nums` everywhere numbers align (prices, classes, title block).
- Scale: h1 `clamp(2.25rem, 1.2rem + 4.2vw, 4.5rem)` / 1.05, h2 `clamp(1.75rem, 1.2rem + 2.2vw, 3rem)` / 1.1, body 1rem–1.0625rem / 1.7, labels 0.75rem. Measure 60–70 ch.

## Colour (OKLCH, both themes)

Light = **paper** (the printed drawing): background `oklch(0.975 0.006 85)` (warm white), ink `oklch(0.235 0 0)` (#1e1e1e), grid hairline `oklch(0.235 0 0 / 0.07)`, projekcia blue `oklch(0.5 0.12 250)` (≥ 5.5:1 on paper), energetika green `oklch(0.49 0.09 165)` (≥ 5:1).
Dark = **the business card**: background `#171717`, surface `#1e1e1e`, ink `oklch(0.97 0 0)`, blue `#89bef2`, green `#70c6a3`, grid hairline `oklch(1 0 0 / 0.07)`.
Accents stay accents (text, lines, hatch). No fills of blue/green over large areas. ≤ 2 colours + neutrals.

## Grid & space

- 12 columns, max 80rem, gutters 1.5rem; the column lines are drawn as hairlines behind content on ≥ 64rem (`repeating-linear-gradient`, `aria-hidden` decoration), 4 on mobile.
- Module 8 px (drawing paper 8 mm grid echoed by a faint 2rem dot grid in the hero only).
- Golden split: hero text column ends at 61.8 %, the blue dashed axis is drawn there; the drawing sits right of it.
- Sections are *sheets*: each starts with a sheet number (`01`, `02` …) and a title, separated by a full-width drawing rule with ticks.

## Imagery

- No stock render in the hero. The hero is the SVG drawing (house section with hatched envelope).
- Photos (stock now, his own later) only inside framed "viewports" with a drawing label (`pohľad`, `realizácia`), never full-bleed behind text.
- Never: laptop on desk, handshake, hard hat smiling, glossy render at sunset.

## Motion principles

Motion means **drawing**: lines are pulled by a steady hand, they never bounce.
- Easings: `--ease-draft: cubic-bezier(0.65, 0, 0.35, 1)` (a pen stroke), `--ease-settle: cubic-bezier(0.16, 1, 0.3, 1)` (labels appear).
- Durations: stroke 700–900 ms, label 300 ms, total hero ≤ 1.2 s.
- Scroll: only the dimension lines are scroll-linked (`animation-timeline: view()`, entry range), everything else is still or the template reveal.
- Reduced motion: all drawings and dimension lines are shown finished. Nothing moves.

## Signature spec handoff

- Hero drawing: L2 (inline SVG, `stroke-dashoffset` keyframes, `pathLength="1"`), 0 JS, < 4 kB.
- Kóta component: L1–L2 (SVG/CSS, scroll-driven longhands), 0 JS.
- WebGL: none. A shader would be decoration; the drawing is the idea (creative-dev: climb only as high as the effect needs).

## Risks

- Performance: none expected (no JS added; SVG inline < 4 kB per page).
- Accessibility: drawings are decoration (`aria-hidden`), the facts they show (A0, OSO č. 418, ±15 %) are also in real text nearby.
- Content: values on dimension lines come from CMS JSON (credentials, pricing) – editable.
- Taste: "blueprint" can turn into cosplay (blue paper, white lines). Avoided: paper is warm white, ink is black, blueprint blue only as the projekcia accent.

## Originality tests

| Test | A Výkres | B Os k A0 | C Cenník |
| --- | --- | --- | --- |
| Swap (competitor's logo) | ✓ – OSO č. 418, A0 envelope, his axes and prices are on the drawing | ✓ | ✗ – any firm with prices fits |
| One screenshot | ✓ – the card's axes + title block | ✓ | ✗ |
| Gallery (Awwwards/Godly "blueprint") | ✓ after mutation: not blue paper; warm paper + measured *business* numbers, not decoration | ✓ | ✓ |
| One sentence | ✓ „Web, ktorý sa sám okótuje.“ | ✓ | ✓ |
| Removal (no dimension lines) | ✓ – loses the "measured promise" meaning | ✓ | ✓ |
| Stillness | ✓ – the finished drawing is the concept | ✓ | ✓ |

Alternatives kept for a switch: B (Os k A0 – scroll-driven energy label + thermal shader), C (configurator draws the house).
