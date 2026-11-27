/**
 * Inquiry forms → e-mail via Resend (Cloudflare Pages Function).
 *
 * POST /api/inquiry  multipart/form-data or JSON
 *   { name, email, phone?, topic?, message, details?, files[]?, website?, elapsed?, back? }
 *   → 200 { ok: true }            sent to the recipients + confirmation to the visitor
 *   → 400 { error }               invalid input (shown to the visitor)
 *   → 503 { error }               not configured / Resend down – the page
 *                                  falls back to a prepared mailto: e-mail
 *
 * Used by the contact page, the project configurator, the energy-certificate
 * calculator and the B2B page. `details` carries the configurator / calculator
 * summary (selected items and the estimated price), `files` the visitor's
 * documents – they are attached to the e-mail (Resend attachments, total
 * limit below), nothing is stored on the server.
 *
 * Recipients are edited in the CMS (Stránky → Kontakt → Formulár → Komu chodia
 * dopyty, contact.json → form.recipients); an empty list means all contacts
 * from Nastavenia → Kontakty. INQUIRY_TO overrides both. The visitor's address
 * is set as Reply-To, so "Odpovedať" in the mailbox answers the visitor.
 *
 * The visitor gets a confirmation e-mail. With attachments it is the dedicated
 * "prílohy sme prijali – čakajte na nacenenie" template listing the files,
 * otherwise the plain thank-you (texts in the CMS: Stránky → Kontakt →
 * Formulár). It is sent only after the inquiry itself went out, and a failed
 * confirmation never fails the request.
 *
 * Without JavaScript the form posts here as form data: the reply is a 303
 * back to the page the form is on (`back`, default /kontakt/) + #odoslane,
 * or ?chyba=1#dopyt on an error.
 *
 * Spam (bots get a fake success and nothing is sent, so they learn nothing):
 *   - hidden `website` honeypot field,
 *   - `elapsed` (time on the page, measured by the page script) missing or
 *     under 3 s – script submissions only; plain form posts cannot carry it,
 *   - more than two links in the message.
 *
 * Environment (Pages → Settings → Variables and Secrets):
 *   RESEND_API_KEY  – Resend API key, "Sending access" only (encrypted)
 *   INQUIRY_FROM    – optional, defaults to "<site name> <web@<request domain>>"
 *                     (the domain must be verified in Resend)
 *   INQUIRY_TO      – optional comma-separated override of the recipients
 */
import contact from "../../src/data/content/contact.json";
import settings from "../../src/data/content/settings.json";

interface Env {
  RESEND_API_KEY?: string;
  INQUIRY_FROM?: string;
  INQUIRY_TO?: string;
}

interface Context {
  request: Request;
  env: Env;
}

type Field = "name" | "email" | "phone" | "topic" | "message" | "details" | "website" | "elapsed" | "back";
type Inquiry = Record<Field, string> & { files: File[] };

const MIN_FILL_MS = 3000;
const MAX_LINKS = 2;
/** Resend accepts 40 MB per e-mail after base64 (+33 %), so keep the raw total lower. */
const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const ALLOWED_FILE = /\.(pdf|jpe?g|png|webp|heic|dwg|dxf|ifc|zip|rar|7z|docx?|xlsx?|txt)$/i;
const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;
const LIMITS = { name: 120, email: 200, phone: 40, topic: 120, message: 4000, details: 4000 } as const;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`;

async function readBody(request: Request): Promise<Inquiry> {
  const type = request.headers.get("Content-Type") ?? "";
  let raw: Record<string, unknown>;
  let files: File[] = [];
  if (type.includes("application/json")) {
    raw = await request.json();
  } else {
    const form = await request.formData();
    raw = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));
    files = form.getAll("files").filter((value): value is File => typeof value === "object" && value !== null && value.size > 0);
  }
  const field = (key: Field) => String(raw[key] ?? "").trim();
  return {
    name: field("name"),
    email: field("email"),
    phone: field("phone"),
    topic: field("topic"),
    message: field("message"),
    details: field("details"),
    website: field("website"),
    elapsed: field("elapsed"),
    back: field("back"),
    files,
  };
}

function validate(data: Inquiry): string | null {
  if (!data.name || !data.email || !data.message) return "Vyplňte meno, e-mail a správu.";
  if (!EMAIL.test(data.email)) return "Skontrolujte, prosím, e-mailovú adresu.";
  for (const [key, max] of Object.entries(LIMITS)) {
    if (data[key as keyof typeof LIMITS].length > max) return "Správa je príliš dlhá.";
  }
  if (data.files.length > MAX_FILES) return `Priložte najviac ${MAX_FILES} súborov.`;
  if (data.files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES)
    return "Prílohy sú spolu väčšie ako 25 MB. Pošlite, prosím, menšie súbory alebo odkaz na úložisko.";
  const wrong = data.files.find((file) => !ALLOWED_FILE.test(file.name));
  if (wrong) return `Súbor „${wrong.name}“ nevieme prijať. Použite PDF, obrázky, DWG/DXF/IFC, ZIP alebo dokumenty Office.`;
  return null;
}

/** Honeypot, time on page and link count – true means "a bot, drop it silently". */
function looksLikeSpam(data: Inquiry, viaScript: boolean): boolean {
  const elapsed = Number(data.elapsed);
  const links = data.message.match(/https?:\/\/|www\./gi)?.length ?? 0;
  const tooFast = viaScript && !(elapsed >= MIN_FILL_MS);
  return Boolean(data.website) || tooFast || links > MAX_LINKS;
}

function recipients(env: Env): string[] {
  const fromCms = contact.form.recipients ?? [];
  const list = env.INQUIRY_TO
    ? env.INQUIRY_TO.split(",")
    : fromCms.length
      ? fromCms
      : settings.company.contacts.map((person) => person.email);
  return list.map((address) => address.trim()).filter((address) => EMAIL.test(address));
}

/** ArrayBuffer → base64 in chunks (no Buffer in Workers, avoids call-stack limits). */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const attachmentsOf = async (files: File[]) =>
  Promise.all(files.map(async (file) => ({ filename: file.name, content: toBase64(await file.arrayBuffer()) })));

function compose(data: Inquiry, siteUrl: string) {
  const subject = `Dopyt z webu${data.topic ? ` – ${data.topic}` : ""} (${data.name})`;
  const rows: [string, string][] = [
    ["Meno", data.name],
    ["E-mail", data.email],
    ...(data.phone ? ([["Telefón", data.phone]] as [string, string][]) : []),
    ...(data.topic ? ([["Téma", data.topic]] as [string, string][]) : []),
    ...(data.files.length
      ? ([["Prílohy", data.files.map((file) => `${file.name} (${formatSize(file.size)})`).join(", ")]] as [string, string][])
      : []),
  ];
  const text = [
    data.message,
    ...(data.details ? ["", "— Výber z webu —", data.details] : []),
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");
  const html = `<p style="white-space:pre-line">${escapeHtml(data.message)}</p>
${data.details ? `<div style="margin:16px 0;padding:12px 16px;border-left:3px solid #70c6a3;background:#f2f8f5;white-space:pre-line"><strong>Výber z webu</strong>\n${escapeHtml(data.details)}</div>` : ""}
<table cellpadding="4" style="border-collapse:collapse;margin-top:16px">${rows
    .map(([label, value]) => `<tr><th align="left">${label}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("")}</table>
<p style="color:#777;font-size:12px">Odoslané z formulára na ${escapeHtml(new URL(siteUrl).hostname)} – odpoveďou napíšete priamo zákazníkovi.</p>`;
  return { subject, text, html };
}

/** Confirmation for the visitor – the "prílohy sme prijali" template when files came along. */
function composeConfirmation(data: Inquiry, siteUrl: string) {
  const people = settings.company.contacts;
  const signature = [
    settings.name,
    ...people.map((person) => `${person.name} – ${person.phone} – ${person.email}`),
    siteUrl,
  ];
  const withFiles = data.files.length > 0;
  const intro = withFiles ? contact.form.attachmentsConfirmationText : contact.form.confirmationText;
  const fileList = data.files.map((file) => `${file.name} (${formatSize(file.size)})`);
  const text = [
    intro,
    ...(withFiles ? fileList.map((line) => `• ${line}`) : []),
    "",
    "—",
    data.message,
    ...(data.details ? ["", data.details] : []),
    "",
    ...signature,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#1e1e1e;max-width:560px">
<p style="font-size:20px;font-weight:bold;margin:0 0 16px"><span>AM</span><span style="font-weight:normal">pro.SK</span></p>
<p style="white-space:pre-line;line-height:1.6">${escapeHtml(intro)}</p>
${withFiles ? `<ul style="line-height:1.6">${fileList.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : ""}
<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #89bef2;background:#f3f7fc;white-space:pre-line">${escapeHtml(data.message)}${data.details ? `\n\n${escapeHtml(data.details)}` : ""}</blockquote>
<p style="color:#555;font-size:14px;line-height:1.6">${signature.map(escapeHtml).join("<br>")}</p>
</div>`;
  return {
    subject: withFiles ? contact.form.attachmentsConfirmationSubject : contact.form.confirmationSubject,
    text,
    html,
  };
}

/** Sender on the site's own domain (verified in Resend): web@ampro.sk. */
const defaultFrom = (siteUrl: string) =>
  `${settings.name} <web@${new URL(siteUrl).hostname.replace(/^www\./, "")}>`;

const sendEmail = (env: Env, siteUrl: string, email: Record<string, unknown>) =>
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.INQUIRY_FROM || defaultFrom(siteUrl), ...email }),
  });

/** Only same-site paths like /konfigurator/ are allowed as the redirect target. */
const safeBack = (back: string) => (/^\/[a-z0-9\-/]*$/i.test(back) && !back.startsWith("//") ? back : "/kontakt/");

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
  const viaScript = request.headers.get("X-Requested-With") === "fetch";
  const siteUrl = new URL(request.url).origin;

  let data: Inquiry;
  try {
    data = await readBody(request);
  } catch {
    return viaScript ? json({ error: "Neplatná požiadavka." }, 400) : Response.redirect(new URL("/kontakt/?chyba=1#dopyt", request.url).toString(), 303);
  }

  const back = (hash: string, query = "") =>
    Response.redirect(new URL(`${safeBack(data.back)}${query}${hash}`, request.url).toString(), 303);
  const reply = (body: { ok?: true; error?: string }, status = 200) =>
    viaScript ? json(body, status) : body.ok ? back("#odoslane") : back("#dopyt", "?chyba=1");

  // Bots: pretend success, send nothing.
  if (looksLikeSpam(data, viaScript)) return reply({ ok: true });

  const invalid = validate(data);
  if (invalid) return reply({ error: invalid }, 400);

  const to = recipients(env);
  if (!env.RESEND_API_KEY || to.length === 0) {
    return reply({ error: "Odosielanie z webu nie je nastavené." }, 503);
  }

  const attachments = data.files.length ? await attachmentsOf(data.files) : undefined;
  const response = await sendEmail(env, siteUrl, {
    to,
    reply_to: data.email,
    ...compose(data, siteUrl),
    ...(attachments ? { attachments } : {}),
  });
  if (!response.ok) {
    console.error("Resend error", response.status, await response.text());
    return reply({ error: "Dopyt sa nepodarilo odoslať." }, 503);
  }

  // Replies to the confirmation go to the recipients, not to the robot sender.
  const confirmation = await sendEmail(env, siteUrl, { to: [data.email], reply_to: to, ...composeConfirmation(data, siteUrl) });
  if (!confirmation.ok) console.error("Confirmation error", confirmation.status, await confirmation.text());

  return reply({ ok: true });
};
