# ampro.sk

Ahoj Lukáš a Adam, ideme Orbit web! 🚀

Web **AMpro SK, s. r. o.** – projekcia rodinných domov a energetika budov (Ing. Adam Mahdiar, OSO č. 418).
Postavené zo šablóny [agent-web-template](https://github.com/depthark/agent-web-template): Astro + Bun + Tailwind v4 + Decap CMS, hosting Cloudflare Pages, e-maily cez Resend.

Pre agentov: začnite v [`AGENTS.md`](AGENTS.md), skilloch v [`.agents/skills/`](.agents/skills) a agentoch v [`.agents/agents/`](.agents/agents). Vetva `feat/creative` používa **creative workflow** šablóny ([`docs/creative-workflow.md`](docs/creative-workflow.md)), rozhodnutia sú v [`docs/creative/`](docs/creative). Rozhodnutia a otvorené body: [`docs/stav-projektu.md`](docs/stav-projektu.md). Prieskum trhu: [`docs/prieskum-trhu-projektanti.md`](docs/prieskum-trhu-projektanti.md).

## Lokálne spustenie

```bash
bun install
bun run dev          # http://localhost:4321
bun run cms:local    # druhý terminál → http://localhost:4321/admin/
bun run build        # CSS → astro check + tsc → astro build
bun run verify       # build + creative-check (pravidlá, rozpočty, markup) – spúšťa CI
bun run audit        # kontroly v prehliadači + Lighthouse na každej stránke → .audit/report.md
```

## Stránky

| Cesta | Čo je na nej |
| --- | --- |
| `/` | Úvod – dve cesty („Ešte neviem, čo chcem“ / „Viem, čo hľadám“), projekcia + energetika, postup, FAQ |
| `/sprievodca/` | 5 otázok → odporúčaný postup a predvyplnený konfigurátor |
| `/konfigurator/` | Konfigurátor ceny projektu (±15 %), dopyt s prílohami |
| `/energeticky-certifikat/` | Kalkulačka ceny ECB, nahratie podkladov |
| `/pre-firmy/` | B2B – kladačské výkresy, CNC, nárezové plány, BIM |
| `/referencie/` | Galérie projektov z CMS |
| `/kontakt/` | Kontakt a dopytový formulár |

Ceny sa upravujú v CMS → **Cenník** (`src/data/content/pricing.json`).
