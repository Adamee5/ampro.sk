# Stav projektu AMpro.sk

Aktualizované: 27. 11. 2026

## Dohodnuté rozhodnutia

- Jazyk: len slovenčina (web aj popisky CMS; tlačidlá samotného Decap CMS ostávajú české – Decap nemá slovenčinu).
- Posolstvo: projekt RD, ktorý spĺňa A0 už na papieri; projektant a energetik OSO č. 418 v jednej osobe. Úvod vedie firma AMpro SK.
- Farby: modrá `#89bef2` = projekcia, zelená `#70c6a3` = energetika (vo svetlej téme stmavené kvôli kontrastu), tmavá `#1e1e1e` / `#171717`. Písmo Poppins. Svetlá + tmavá téma podľa systému.
- Úvod delí návštevníkov podľa situácie: „Ešte neviem, čo chcem“ → sprievodca, „Viem, čo hľadám“ → konfigurátor. B2B (kladačské výkresy, CNC, nárezové plány, BIM) má vlastnú stránku, cena na dopyt.
- Konfigurátor projektu vo v1: stupne štúdia / stavebný zámer / projekt stavby / vykonávací projekt, RD do/nad 150 m², príplatky (podlažie, garáž, zimná záhrada), profesie TZB, prípojky, položky podľa parcely, energetika a služby. Cena hneď, ±15 %, bez kontaktu.
- Kalkulačka ECB: účel, typ + plocha, podklady/obhliadka, lokalita. Podklady sa nahrajú do formulára, prídu ako prílohy cez Resend; zákazník dostane e-mail „prílohy sme prijali – čakajte na nacenenie“.
- Sľub: odpoveď do 24 hodín. Sekcia Google recenzií je pripravená (skrytá, kým je prázdna).
- Hosting Cloudflare Pages, DNS ampro.sk presunúť z Websupportu na Cloudflare (registrácia ostáva na Websupporte). Žiadna schránka na doméne – dopyty idú na Gmail.
- CMS upravuje len Adam.

## Otvorené body

- [ ] **Ceny** v `pricing.json` sú môj návrh podľa prieskumu trhu (Žilinský kraj) – Adam ich musí skontrolovať a upraviť v CMS → Cenník.
- [ ] **DPH**: podľa FinStatu firma nemá IČ DPH. Overiť a prípadne doplniť do poznámky pod cenou („nie sme platcami DPH“ / „ceny bez DPH“).
- [ ] **OSO č. 418** – overiť zápis vo verejnom registri SKSI pred spustením (Adam nezvolil preferenciu).
- [ ] **Rekonštrukcia** – cenotvorba v konfigurátore (zatiaľ „na obhliadku“).
- [ ] **Fotky**: hero je ilustračná fotka z Unsplash (photo-1564703048291, Unsplash License). Nahradiť vlastnými fotkami/dronom. Referencie sú prázdne – doplniť cez CMS.
- [ ] **VR** – neskôr („čerešnička na torte“).
- [ ] **OG obrázky** používajú font Inter (sharp potrebuje TTF) – doplniť Poppins TTF do `src/assets/fonts/` a prepnúť v `src/lib/og-image.ts`.
- [ ] **Nasadenie** (skilly `cloudflare-deploy`, `decap-cms`, `resend-email`): Pages projekt `ampro-sk`, NS na Cloudflare, GitHub OAuth app, Resend doména + `RESEND_API_KEY`, test formulára s prílohou na produkcii.
- [ ] **Audity** pred spustením: `performance-audit`, `accessibility-audit`, `seo-audit` na produkčnej URL.
- [ ] Odkaz „Pred kúpou overíme pozemok“ v sprievodcovi – rozhodnúť, či to je samostatná platená služba (konzultácia na pozemku).
