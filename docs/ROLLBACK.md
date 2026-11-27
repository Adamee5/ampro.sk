# DNS a nasadenie ampro.sk

Aktualizované: 27. 11. 2026

## Pôvodný stav (Websupport, pred presunom)

Nameservery: ns1/ns2/ns3.websupport.sk

| Typ | Názov | Hodnota |
| --- | --- | --- |
| A | ampro.sk | 185.199.108–111.153 (staré GitHub Pages) |
| AAAA | ampro.sk | 2606:50c0:8000–8003::153 (staré GitHub Pages) |
| CNAME | www | depthark.github.io (staré GitHub Pages) |
| A / AAAA | * | 37.9.175.195 / 2a00:4b40:aaaa:2009::7 |
| A / AAAA | mail, webmail, imap, smtp, pop3 | 45.13.137.5 / 2a00:4b40:aaaa:2101:45:13:137:116 |
| A | admin | 37.9.175.12 |
| CNAME | autoconfig, autodiscover | web.prod.bts.websupport.sk |
| MX | ampro.sk | 10 mx10.websupport.sk, 100 mx20.websupport.sk |
| TXT | ampro.sk | v=spf1 a mx include:_spf.m1.websupport.sk ?all |
| TXT | ampro.sk | spf2.0/pra a mx include:_sid.m1.websupport.sk ?all |
| SRV | _autodiscover._tcp | 0 0 443 web.prod.bts.websupport.sk |

Rollback: na Websupporte vrátiť nameservery ns1/ns2/ns3.websupport.sk (zóna tam ostáva nezmenená).

## Nový stav (Cloudflare, zóna ampro.sk – Free, čaká na prepnutie NS)

Cloudflare nameservery: **arvind.ns.cloudflare.com**, **hattie.ns.cloudflare.com**

- Všetky poštové a Websupport záznamy z tabuľky vyššie sú prenesené 1:1 ako **DNS only** (okrem AAAA pre imap/smtp/pop3 – stačí IPv4; doplniť podľa potreby).
- Staré GitHub Pages záznamy (apex A/AAAA) sú zmazané.
- `www` CNAME → `ampro-sk.pages.dev` (Proxied).
- `ampro.sk` A → `192.0.2.1` (Proxied, zástupný – pre presmerovanie na www).
- Resend (EU): `resend._domainkey` TXT (DKIM), `send` CNAME → send.forge.rmta.net, `rsend` CNAME → rsend-euw1.forge.rmta.net, `_dmarc` TXT `v=DMARC1; p=none;` – všetko DNS only.

## Cloudflare Pages

- Projekt `ampro-sk`, repo Adamee5/ampro.sk, vetva `main`, build `bun run build`, výstup `dist`, `BUN_VERSION=1.4.5`, `NODE_VERSION=26`.
- Beží na https://ampro-sk.pages.dev

## GitHub OAuth (CMS)

- OAuth App **AMpro.sk CMS** (github.com/settings/applications/4059961), homepage https://www.ampro.sk, callback https://www.ampro.sk/api/callback, tokeny bez expirácie (Decap nevie obnovovať).

## Zostáva (po poradí)

1. **Websupport (robí používateľ):** zmeniť nameservery domény ampro.sk na `arvind.ns.cloudflare.com` a `hattie.ns.cloudflare.com`; ak je zapnutý DNSSEC, vypnúť ho.
2. Cloudflare → ampro.sk → Overview: „Check nameservers“ – počkať na **Active**.
3. Pages `ampro-sk` → Custom domains: pridať `www.ampro.sk` (a `ampro.sk`).
4. Rules → Redirect Rules: `ampro.sk` → `https://www.ampro.sk` + cesta, 301.
5. SSL/TLS: Full (strict), Always Use HTTPS, min TLS 1.2.
6. Resend → Domains → ampro.sk → „I've added the records“ / Verify.
7. **Tajné kľúče (robí používateľ)** – Pages `ampro-sk` → Settings → Variables and Secrets, typ **Secret**, Production aj Preview:
   - `RESEND_API_KEY` – Resend → API keys → Create (Sending access, doména ampro.sk)
   - `GITHUB_CLIENT_ID` a `GITHUB_CLIENT_SECRET` – z OAuth App AMpro.sk CMS (Generate a new client secret)
   Potom Deployments → Retry deployment.
8. Test: formulár s prílohou (2 e-maily dorazia), prihlásenie do /admin/, e-mail na Websupporte funguje oboma smermi.
