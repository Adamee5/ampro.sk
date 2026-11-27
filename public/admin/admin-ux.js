/**
 * Editor comfort for the admin (Decap CMS):
 *
 * 1. Confirmation before every removal. Decap removes list items (FAQ
 *    questions, price versions…) and attached files instantly; we intercept
 *    those clicks and ask first. The gallery widget uses the same dialog
 *    (window.AdminConfirm). Deleting a whole entry already asks in Decap.
 *
 * 2. Guided tours (driver.js). One short tour per screen instead of one long
 *    one, so each explains exactly what is in front of the editor:
 *      intro    – the dashboard: sections, Schvalování, help button
 *      editor   – any edit screen: fields, Uložit, status, Publikovat
 *      gallery  – a project gallery (Projekty → photos)
 *      workflow – the Schvalování board
 *      publish  – the publishing process step by step (also from the help menu)
 *    Each runs automatically the first time its screen is opened; finishing
 *    or closing stores that in localStorage. The "Nápověda" button replays
 *    them at any time.
 */
(() => {
  // --------------------------------------------------------------- confirm
  const confirmCss = `
    .ax-confirm{border:0;padding:0;border-radius:10px;width:min(26rem,calc(100vw - 2rem));font:15px/1.5 system-ui,sans-serif;color:#1f2328;box-shadow:0 24px 64px rgb(0 0 0/.35)}
    .ax-confirm::backdrop{background:rgb(0 0 0/.5)}
    .ax-confirm form{display:flex;flex-direction:column;gap:16px;padding:24px}
    .ax-confirm h2{margin:0;font-size:18px}
    .ax-confirm p{margin:0;color:#3d444d}
    .ax-confirm .row{display:flex;justify-content:flex-end;gap:8px}
    .ax-confirm button{font:inherit;min-height:44px;padding:0 18px;border-radius:8px;border:1px solid #d0d7de;background:#fff;cursor:pointer}
    .ax-confirm button[value=ok]{background:#cf222e;border-color:#cf222e;color:#fff;font-weight:600}
    .ax-confirm button:focus-visible{outline:2px solid #6B3E95;outline-offset:2px}`;

  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /** Modal yes/no. Resolves true only on the explicit confirm button. */
  window.AdminConfirm = ({ title = "Opravdu odebrat?", text = "", ok = "Odebrat", cancel = "Ponechat" } = {}) =>
    new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "ax-confirm";
      dialog.innerHTML = `<style>${confirmCss}</style>
        <form method="dialog">
          <h2>${escapeHtml(title)}</h2>
          ${text ? `<p>${escapeHtml(text)}</p>` : ""}
          <div class="row">
            <button value="cancel" autofocus>${escapeHtml(cancel)}</button>
            <button value="ok">${escapeHtml(ok)}</button>
          </div>
        </form>`;
      document.body.append(dialog);
      dialog.addEventListener("close", () => {
        resolve(dialog.returnValue === "ok");
        dialog.remove();
      });
      dialog.showModal();
    });

  // Decap's list-item remove button: the last icon button in a list item's
  // top bar. Attached-file "Odebrat …" buttons in image/file widgets.
  const isListRemove = (btn) =>
    btn.matches('[class*="TopBarButton"]') &&
    btn.parentElement?.matches('[class*="ListItemTopBar"]') &&
    btn === btn.parentElement.querySelector('[class*="TopBarButton"]:last-of-type');
  const isFileRemove = (btn) => /^Odebrat/i.test(btn.textContent.trim()) && !btn.closest(".rg, .ciw, .ax-confirm");

  let bypass = false;
  document.addEventListener(
    "click",
    async (event) => {
      if (bypass) return;
      const btn = event.target.closest?.("button");
      if (!btn) return;
      const list = isListRemove(btn);
      if (!list && !isFileRemove(btn)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      const label = list
        ? btn.parentElement.textContent.trim().slice(0, 80)
        : "";
      const ok = await window.AdminConfirm({
        title: list ? "Odobrať túto položku?" : "Odobrať súbor?",
        text: list
          ? `${label ? `„${label}“ ` : ""}zmizne z formulára. Na webe sa zmena prejaví až po uložení a publikovaní.`
          : "Súbor sa odpojí od tohto poľa. V úložisku webu zostane.",
      });
      if (!ok) return;
      bypass = true;
      btn.click();
      bypass = false;
    },
    true,
  );

  // ------------------------------------------------------------------ tours
  const DRIVER_JS = "https://cdn.jsdelivr.net/npm/driver.js@1.10.1/dist/driver.js.iife.js";
  const DRIVER_CSS = "https://cdn.jsdelivr.net/npm/driver.js@1.10.1/dist/driver.css";
  const SEEN = (name) => `cms-tour-${name}-v1`;

  let driverReady;
  const loadDriver = () =>
    (driverReady ??= new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = DRIVER_CSS;
      document.head.append(link);
      const script = document.createElement("script");
      script.src = DRIVER_JS;
      script.onload = () => resolve(window.driver.js.driver);
      script.onerror = reject;
      document.head.append(script);
    }));

  const $ = (sel) => document.querySelector(sel);
  const step = (element, title, description, side = "bottom") => ({
    element: typeof element === "string" ? ($(element) ? element : undefined) : element,
    popover: { title, description, side, align: "start" },
  });

  const PUBLISH_STEPS = [
    step(null, "Ako sa zmeny dostanú na web",
      "Nič, čo v administrácii upravíte, sa neukáže na webe hneď. Každá zmena prejde tromi krokmi:<br><br><b>1. Uložit</b> (Uložiť) – vznikne <i>koncept</i>. Návštevníci ho nevidia.<br><b>2. Stav</b> – koncept môžete označiť <i>Ke kontrole</i> alebo <i>Připraveno</i>.<br><b>3. Publikovat → Publikovat nyní</b> – zmena sa zapíše do webu a web sa znova zostaví."),
    step(null, "Koľko to trvá a ako spoznám, že je hotovo",
      "Po publikovaní sa vpravo dole objaví panel <b>„Publikované – web sa aktualizuje…“</b>. Zostavenie trvá zvyčajne <b>2–3 minúty</b>. Keď panel zozelenie a napíše <b>„Hotovo – zmeny sú na webe“</b>, kliknite na <i>Zobraziť na webe</i>.<br><br>Medzitým môžete normálne pracovať ďalej."),
    step(null, "Rozpracované zmeny nájdete v záložke Schvalování",
      "Uložené, ale nepublikované koncepty sú v záložke <b>Schvalování</b> hore. Odtiaľ ich otvoríte, posuniete medzi stĺpcami alebo publikujete. Kým koncept nepublikujete, web zostáva bez zmeny – nemusíte sa báť nič pokaziť."),
  ];

  const TOURS = {
    intro: () => [
      step(null, "Vitajte v administrácii webu",
        "Tu upravujete obsah webu – referencie, texty stránok, cenník, časté otázky aj kontakty. Prevediem vás za minútu. Prehliadku môžete kedykoľvek zavrieť a spustiť znova tlačidlom <b>Pomoc</b> vľavo dole."),
      step('[class*="SidebarContainer"]', "Sekcie administrácie",
        "<b>Referencie</b> – ukážky vašej práce: názov, popis a galéria fotiek<br><b>Stránky</b> – texty úvodnej stránky, sprievodcu, B2B, referencií a kontaktu<br><b>Cenník</b> – ceny pre konfigurátor projektu a kalkulačku certifikátu<br><b>Nastavenia</b> – kontakty, sídlo, OSO a údaje pre Google<br><br>Kliknite na sekciu a otvorí sa jej obsah.", "right"),
      step('a[href="#/workflow"]', "Schvalování",
        "Tu sú uložené zmeny, ktoré ešte nie sú na webe (koncepty). Odtiaľ ich môžete publikovať."),
      step('[class*="AppHeaderSiteLink"]', "Odkaz na web", "Otvorí živý web v novej karte, aby ste si zmeny hneď skontrolovali."),
      ...PUBLISH_STEPS,
      step("#ax-help", "Pomoc je vždy poruke",
        "Týmto tlačidlom si kedykoľvek spustíte prehliadku obrazovky, na ktorej práve ste, alebo znova vysvetlenie publikovania.", "top"),
    ],
    editor: () => [
      step('[class*="ToolbarSectionBackLink"]', "Úprava obsahu",
        "Ste v editore. Šípkou vľavo sa vrátite na zoznam. Vedľa uvidíte, či máte <b>neuložené zmeny</b>."),
      step('[class*="SaveButton"]', "1. Uložiť",
        "Po úpravách vždy kliknite na <b>Uložit</b>. Vznikne koncept – na webe sa zatiaľ nič nezmení."),
      step('[class*="ToolbarDropdown"]', "2. Stav a 3. Publikovať",
        "Po uložení sa tu objaví <b>Stav</b> (Koncept / Ke kontrole / Připraveno) a tlačidlo <b>Publikovat</b>. Voľbou <b>Publikovat nyní</b> pošlete zmenu na web – do 3 minút je vonku a vpravo dole uvidíte priebeh."),
      step('[class*="ControlPaneContainer"], [class*="EditorControlPane"], form', "Formulár",
        "Tu upravujete texty a ceny. Sivé nápovedy pod poľami hovoria, kde sa obsah na webe zobrazí. Zoznamy (karty, otázky, položky cenníka) rozbalíte kliknutím, pridáte tlačidlom <b>Přidat</b> a odoberiete krížikom – vždy sa opýtam, či to myslíte vážne. Sekcia <b>Vyhľadávače (SEO)</b> určuje, ako stránku uvidí Google.", "top"),
    ],
    gallery: () => [
      step(".rg-help", "Galéria projektu",
        "Tu sú všetky fotky tohto projektu. Čo vidíte tu, je na webe – v rovnakom poradí a s rovnakým výrezom."),
      step(".rg-primary", "Nahrať fotky",
        "Kliknite a vyberte fotky (aj viac naraz). Prehliadač ich sám zmenší a skomprimuje do moderného formátu AVIF – chvíľku to trvá – a uloží ich do priečinka projektu. Ideálne sú fotky 2400 px na šírku.", "left"),
      step(".rg-card", "Karta fotky",
        "<b>Kliknutím na fotku</b> určíte, čo má byť vidieť v náhľade (výrez 4:3) – vo zväčšení je fotka vždy celá. <b>Popis fotky</b> – stručne, čo je na fotke (čítajú ho nevidiaci a Google). <b>Hviezdička</b> urobí z fotky hlavnú – na webe je veľká. Šípky menia poradie, <b>Dočasne skryť</b> fotku schová a kôš ju odoberie.", "right"),
      step('[class*="SaveButton"]', "Nezabudnite uložiť a publikovať",
        "Po úpravách galérie kliknite na <b>Uložit</b> a potom <b>Publikovat → Publikovat nyní</b>. Web sa aktualizuje do 3 minút."),
    ],
    workflow: () => [
      step(null, "Schvalování",
        "Každá uložená zmena je tu ako karta. Stĺpce zodpovedajú stavu: <b>Koncept</b>, <b>Ke kontrole</b>, <b>Připraveno</b>. Kartu môžete presunúť do iného stĺpca alebo ju otvoriť."),
      step(null, "Publikovanie odtiaľto",
        "V stĺpci <b>Připraveno</b> má každá karta tlačidlo <b>Publikovat</b>. Tým zmenu pošlete na web. Kartu, ktorú nechcete, zmažete – web zostane bez zmeny."),
    ],
    publish: () => PUBLISH_STEPS,
  };

  const screen = () => {
    const hash = location.hash;
    if (hash.startsWith("#/workflow")) return "workflow";
    if (/#\/collections\/[^/]+\/(entries\/|new)/.test(hash)) return document.querySelector(".rg") ? "gallery" : "editor";
    return "intro";
  };

  let active = null;
  async function runTour(name) {
    const make = TOURS[name];
    if (!make) return;
    const driver = await loadDriver();
    active?.destroy();
    const steps = make();
    active = driver({
      showProgress: true,
      progressText: "{{current}} z {{total}}",
      nextBtnText: "Ďalej →",
      prevBtnText: "← Späť",
      doneBtnText: "Rozumiem",
      allowClose: true,
      overlayColor: "rgb(0 0 0 / 0.6)",
      stagePadding: 6,
      popoverClass: "ax-tour",
      steps,
      onDestroyed: () => {
        try { localStorage.setItem(SEEN(name), "1"); } catch {}
        active = null;
        // After the intro, show the tour of the screen the editor is on.
        if (name === "intro") autoTour();
      },
    });
    active.drive();
  }

  const seen = (name) => {
    try { return localStorage.getItem(SEEN(name)) === "1"; } catch { return true; }
  };

  // Auto-run the tour for the current screen once its UI has rendered.
  let pendingAuto = null;
  function autoTour() {
    clearTimeout(pendingAuto);
    pendingAuto = setTimeout(() => {
      // The intro always comes first; the screen's own tour follows next time.
      const target = seen("intro") ? screen() : "intro";
      if (!seen(target) && !active && !document.querySelector("dialog[open]")) runTour(target);
    }, 1500);
  }

  // ------------------------------------------------------------ help button
  const helpCss = `
    #ax-help{position:fixed;left:16px;bottom:16px;z-index:9000;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:0;border-radius:999px;background:#6B3E95;color:#fff;font:600 14px/1 system-ui,sans-serif;box-shadow:0 8px 24px rgb(0 0 0/.25);cursor:pointer}
    #ax-help:hover{background:#5B2C83}
    #ax-help:focus-visible{outline:2px solid #1f2328;outline-offset:3px}
    #ax-help-menu{position:fixed;left:16px;bottom:68px;z-index:9000;display:flex;flex-direction:column;min-width:16rem;padding:6px;border-radius:10px;background:#fff;box-shadow:0 16px 40px rgb(0 0 0/.25);font:14px/1.4 system-ui,sans-serif}
    #ax-help-menu[hidden]{display:none}
    #ax-help-menu button{min-height:44px;padding:0 12px;border:0;border-radius:6px;background:none;text-align:left;font:inherit;color:#1f2328;cursor:pointer}
    #ax-help-menu button:hover,#ax-help-menu button:focus-visible{background:#F3EDF9;outline:none}
    .driver-popover.ax-tour{max-width:24rem;font-family:system-ui,sans-serif}
    .driver-popover.ax-tour .driver-popover-title{font-size:17px}
    .driver-popover.ax-tour .driver-popover-description{font-size:14px;line-height:1.55}
    .driver-popover.ax-tour .driver-popover-next-btn{background:#6B3E95;color:#fff;text-shadow:none;border-color:#6B3E95}`;

  function mountHelp() {
    if (document.getElementById("ax-help")) return;
    const style = document.createElement("style");
    style.textContent = helpCss;
    document.head.append(style);

    const btn = document.createElement("button");
    btn.id = "ax-help";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "ax-help-menu");
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/></svg>Pomoc`;

    const menu = document.createElement("div");
    menu.id = "ax-help-menu";
    menu.hidden = true;
    menu.setAttribute("role", "menu");
    const items = [
      ["here", "Prehliadka tejto obrazovky"],
      ["publish", "Ako publikovať zmeny"],
      ["intro", "Úvod do administrácie"],
    ];
    menu.innerHTML = items.map(([k, l]) => `<button type="button" role="menuitem" data-tour="${k}">${l}</button>`).join("");

    const toggle = (open) => {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) menu.querySelector("button").focus();
    };
    btn.addEventListener("click", () => toggle(menu.hidden));
    menu.addEventListener("click", (e) => {
      const key = e.target.closest("button")?.dataset.tour;
      if (!key) return;
      toggle(false);
      runTour(key === "here" ? screen() : key);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { toggle(false); btn.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) toggle(false);
    });

    document.body.append(menu, btn);
  }

  // Decap renders asynchronously; wait for the app shell, then follow routes.
  const boot = () => {
    if (!document.querySelector('[class*="AppHeader"]')) return setTimeout(boot, 500);
    mountHelp();
    autoTour();
  };
  window.addEventListener("hashchange", autoTour);
  boot();
})();
