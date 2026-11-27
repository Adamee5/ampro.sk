# Experience – AMpro.sk „Výkres“

## Structure: Chapters (sheets of one drawing set)

Every page is a *drawing sheet* with a number in the title block: Úvod `AM-01`, Sprievodca `AM-02`, Cena projektu `AM-03`, Energetický certifikát `AM-04`, Pre firmy `AM-05`, Referencie `AM-06`, Kontakt `AM-07`. Sections inside a page are numbered items `01`, `02`, … (chapters with their own h2). Why: the visitor reads it like a drawing set – orient, measure, act.

## Page map (home; other pages keep their v1 structure and inherit the language)

| # | Section | Purpose | Content (CMS) | Motion |
| --- | --- | --- | --- | --- |
| – | Hero: text left of the golden axis, drawing right | orient + signature | `home.hero`, `credentials` | hero drawing (signature 1) |
| 01 | Dve cesty | act | `home.doors` | reveal |
| 02 | Projekcia × energetika (axes) | prove | `home.axes` | kóta (signature 2) |
| 03 | Postup v 5 krokoch | reassure | `home.process` | kóta per step (time on the line) |
| 04 | Prečo AMpro | prove | `home.trust` | still |
| 05 | Časté otázky | reassure | `home.faq` | still |
| 06 | Výzva | act → `/konfigurator/` | `home.cta` | reveal |
| – | Title block (footer) | reassure | `settings` | still |

## Choreography

- First screen: who (AMpro.SK), what (h1), the drawing drawing itself, the two CTAs; the next sheet's rule is cropped at the bottom → invites scroll.
- Entrance: hero drawing ≤ 1.2 s, text readable from frame 0 (no text animation).
- Scroll: dimension lines only (scrub on `view()` entry 10 % → 45 %). Rest still / template reveal.
- No page transitions (cross-document view transitions optional later).

## Motion tokens

| Token | Value | Use | Reduced motion |
| --- | --- | --- | --- |
| `--ease-draft` | `cubic-bezier(0.65, 0, 0.35, 1)` | strokes | finished line |
| `--ease-settle` | `cubic-bezier(0.16, 1, 0.3, 1)` | labels | shown |
| `--duration-stroke` | `800ms` | hero strokes | 0 |
| `--duration-label` | `300ms` | hero labels | 0 |
Max travel 0 px (lines grow, nothing slides). No rotation, no scale.

## Navigation

Template header (logo → home, nav, theme toggle, CTA), restyled as the drawing's top frame (hairline bottom, sheet number of the current page right of the logo on ≥ 64rem). Mobile: template Popover menu.

## Signature 1: Hero drawing (rez domu)

**Concept link** – idea „výkres“, rule 1 inverted (render → drawing), truth "he makes drawings; energy is the envelope".
**Where** – home, hero, right of the golden-split axis (≥ 64rem); under the text on mobile (max 22rem tall).
**What the visitor sees** – 0–300 ms ground line + hatch; 200–700 ms walls; 450–950 ms roof; 650–1100 ms green insulation envelope; 900–1200 ms blue dimension lines with labels *A0*, *do 150 m²*, *OSO č. 418*.
**Trigger** – page load (CSS keyframes, `animation-delay` per layer).
**Input parity** – not interactive; mouse/touch/keyboard n/a. Screen reader: `aria-hidden`; the same facts are in the hero text and the trust cards.
**Reduced motion** – the finished drawing, all labels visible.
**Fallbacks** – no JS: identical (no JS used) · forced colours: strokes use `currentColor`/`CanvasText` · print: finished drawing · slow device: CSS only, compositor-free stroke animation of ~12 paths.
**Level** – L2 (SVG `stroke-dashoffset` with `pathLength="1"`). L1 cannot draw lines.
**Budget** – 0 JS, SVG < 4 kB inline, no LCP impact (LCP is the h1).
**Content dependency** – labels from `settings.credentials.oso` and fixed "A0"; long OSO text fits (≤ 14 chars).
**Failure modes** – SVG scaling at 320 px: drawing has `viewBox` and max-width, never overflows.
**Acceptance** – [ ] reduced motion shows finished drawing · [ ] 320 px no h-scroll · [ ] Lighthouse mobile 100 · [ ] LCP is text.

## Signature 2: Kóta (dimension line)

**Concept link** – rule 2 inverted (energy/promise as a measured value).
**Where** – under section headings and on value rows: home axes (`Jeden model`), process steps (time), configurator summary (price), certificate summary.
**What the visitor sees** – as the element enters (view entry 10 % → 45 %): two ticks appear, the line grows from both ends to the middle, the value label (real text) sits on the line.
**Trigger** – scroll (`animation-timeline: view()`, longhands).
**Input parity** – decoration only; the value is plain text in the DOM, read normally by screen readers.
**Reduced motion** – finished line.
**Fallbacks** – no scroll-timeline support: finished line (animation only inside `@supports (animation-timeline: view())`) · forced colours: `CanvasText`.
**Level** – L1 (CSS `scale` on a pseudo-element line + ticks). 0 JS.
**Budget** – 0 JS, a few hundred bytes CSS.
**Content dependency** – label text from CMS; long labels wrap under the line (no overflow).
**Acceptance** – [ ] value text selectable and read by SR · [ ] works without scroll timelines · [ ] reduced motion still.

## Copy deck (changes vs. v1, Slovak)

- Hero eyebrow: „Výkres AM-01 · Žilina a celé Slovensko“
- Hero h1 stays: „Projekt domu, ktorý spĺňa A0 už na papieri.“
- Axes intersection: „Jeden model. Projekcia aj energetika.“
- Title block labels: Investor / Projektant / Oprávnenie / Výkres / Mierka / Dátum.
