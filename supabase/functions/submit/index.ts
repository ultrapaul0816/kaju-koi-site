// Kaju Koi: receives pre-order requests and business enquiries,
// stores them in Postgres (service role, RLS-locked tables) and emails the owner.
import { createClient } from "npm:@supabase/supabase-js@2";

// Public MRP (incl. of all taxes), same across India. Server is the source of truth for totals.
const PRODUCTS: Record<string, { name: string; price: number }> = {
  "original-6": { name: "Kaju Koi Original, box of 6", price: 399 },
  "original-12": { name: "Kaju Koi Original, box of 12", price: 749 },
  "original-24": { name: "Kaju Koi Original, box of 24", price: 1399 },
  "single": { name: "Kaju Koi single, individually wrapped", price: 79 },
  "kokum-12": { name: "Kokum Koi (summer edition), box of 12", price: 799 },
  "bebinca-12": { name: "Bebinca Koi (Christmas edition), box of 12", price: 849 },
  "mixed-12": { name: "Mixed box, 6 Original + 6 seasonal", price: 799 },
};
const OCCASIONS = ["Wedding", "Corporate Diwali", "Hotel / villa", "Conference / event", "Other"];
const PERSONALISATION = ["Logo sleeve", "Message card", "Names on card"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const phoneOk = (p: string) => p.replace(/[^\d]/g, "").length >= 10 && p.replace(/[^\d]/g, "").length <= 13;
const dateOk = (d: string) => d === "" || /^\d{4}-\d{2}-\d{2}$/.test(d);
const inr = (n: number) => "Rs " + n.toLocaleString("en-IN");
const ref = (p: string) => {
  const d = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(2, 10).replace(/-/g, "");
  const r = crypto.getRandomValues(new Uint8Array(3));
  return `KK-${p}-${d}-${Array.from(r, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};
const isTest = (name: string) => /^\s*TEST\b/.test(name);

function table(rows: [string, string][]) {
  return `<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="color:#555;vertical-align:top;border-bottom:1px solid #eee">${esc(k)}</td><td style="border-bottom:1px solid #eee">${esc(v || "-").replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 20000) return json({ ok: false, error: "Request too large" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }
  // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
  if (str(body.website)) return json({ ok: true, reference: "KK-RECEIVED" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const ua = str(req.headers.get("user-agent") ?? "", 300);
  const type = str(body.type, 20);
  const errors: string[] = [];

  let row: Record<string, unknown>;
  let tableName: string;
  let subject: string;
  let html: string;

  if (type === "order") {
    const itemsIn = Array.isArray(body.items) ? body.items.slice(0, 10) : [];
    const items = itemsIn
      .map((i: any) => ({ code: str(i?.code, 30), qty: Math.floor(Number(i?.qty)) }))
      .filter((i) => PRODUCTS[i.code] && i.qty > 0 && i.qty <= 200)
      .map((i) => ({ ...i, name: PRODUCTS[i.code].name, unit_price: PRODUCTS[i.code].price, line_total: PRODUCTS[i.code].price * i.qty }));
    if (!items.length) errors.push("Choose at least one box.");
    const total = items.reduce((s, i) => s + i.line_total, 0);
    const name = str(body.name, 120), phone = str(body.phone, 30), email = str(body.email, 200);
    const address = str(body.address, 600), city = str(body.city, 80), pincode = str(body.pincode, 10);
    const preferred = str(body.preferred_date, 10), giftMsg = str(body.gift_message, 300), notes = str(body.notes, 1000);
    if (!name) errors.push("Name is required.");
    if (!phoneOk(phone)) errors.push("Enter a valid phone number.");
    if (!emailOk(email)) errors.push("Enter a valid email.");
    if (!address) errors.push("Address is required.");
    if (!city) errors.push("City is required.");
    if (!/^\d{6}$/.test(pincode)) errors.push("Enter a 6-digit pincode.");
    if (!dateOk(preferred)) errors.push("Invalid date.");
    if (errors.length) return json({ ok: false, errors }, 422);
    const test = isTest(name);
    tableName = "orders";
    row = {
      reference: ref("O"), items, total_inr: total, customer_name: name, phone, email, address, city, pincode,
      preferred_date: preferred || null, gift_card: !!body.gift_card || !!giftMsg, gift_message: giftMsg || null,
      notes: notes || null, is_test: test, user_agent: ua,
    };
    subject = `${test ? "[TEST] " : ""}Kaju Koi pre-order request ${row.reference} · ${inr(total)} · ${city}`;
    html = `<h2 style="font-family:Georgia,serif;color:#172A5C">${test ? "[TEST] " : ""}New pre-order request</h2>
<p style="font-family:Arial,sans-serif">Unpaid request from the website. Please confirm with the customer before baking or dispatch.</p>
${table([
  ["Reference", String(row.reference)],
  ["Items", items.map((i) => `${i.qty} x ${i.name} @ ${inr(i.unit_price)} = ${inr(i.line_total)}`).join("\n")],
  ["Total (MRP incl. taxes)", inr(total)],
  ["Name", name], ["Phone", phone], ["Email", email],
  ["Address", address], ["City / pincode", `${city} ${pincode}`],
  ["Preferred date", preferred], ["Gift message card", giftMsg || (body.gift_card ? "Yes (no message)" : "No")],
  ["Notes", notes],
])}`;
  } else if (type === "enquiry") {
    const occasion = str(body.occasion, 40), name = str(body.name, 120), phone = str(body.phone, 30), email = str(body.email, 200);
    const eventDate = str(body.event_date, 10), city = str(body.city, 80), budget = str(body.budget_per_gift, 60);
    const company = str(body.company, 160), notes = str(body.notes, 2000);
    const giftCount = body.gift_count === "" || body.gift_count == null ? null : Math.floor(Number(body.gift_count));
    const pers = (Array.isArray(body.personalisation) ? body.personalisation : []).map((p) => str(p, 40)).filter((p) => PERSONALISATION.includes(p));
    if (!OCCASIONS.includes(occasion)) errors.push("Choose an occasion.");
    if (!name) errors.push("Name is required.");
    if (!phoneOk(phone)) errors.push("Enter a valid phone number.");
    if (!emailOk(email)) errors.push("Enter a valid email.");
    if (!dateOk(eventDate)) errors.push("Invalid date.");
    if (giftCount !== null && (!Number.isFinite(giftCount) || giftCount < 1 || giftCount > 100000)) errors.push("Enter a valid number of gifts.");
    if (errors.length) return json({ ok: false, errors }, 422);
    const test = isTest(name);
    tableName = "enquiries";
    row = {
      reference: ref("E"), occasion, event_date: eventDate || null, gift_count: giftCount, budget_per_gift: budget || null,
      city: city || null, personalisation: pers, name, company: company || null, phone, email, notes: notes || null,
      is_test: test, user_agent: ua,
    };
    subject = `${test ? "[TEST] " : ""}Kaju Koi enquiry ${row.reference} · ${occasion}${giftCount ? ` · ${giftCount} gifts` : ""}`;
    html = `<h2 style="font-family:Georgia,serif;color:#172A5C">${test ? "[TEST] " : ""}New parties &amp; business enquiry</h2>
<p style="font-family:Arial,sans-serif">Quoted on request. Reply to the customer with a quote.</p>
${table([
  ["Reference", String(row.reference)], ["Occasion", occasion], ["Event date", eventDate],
  ["Number of gifts", giftCount ? String(giftCount) : ""], ["Budget per gift", budget], ["City", city],
  ["Personalisation", pers.join(", ")], ["Name", name], ["Company", company], ["Phone", phone], ["Email", email], ["Notes", notes],
])}`;
  } else {
    return json({ ok: false, error: "Unknown form" }, 400);
  }

  // Light abuse guard: max 5 submissions per email per 10 minutes.
  const since = new Date(Date.now() - 10 * 60e3).toISOString();
  const { count } = await supabase.from(tableName).select("id", { count: "exact", head: true })
    .eq("email", row.email as string).gte("created_at", since);
  if ((count ?? 0) >= 5) return json({ ok: false, errors: ["Too many requests. Please try again later."] }, 429);

  const { error: insErr } = await supabase.from(tableName).insert(row);
  if (insErr) {
    console.error("insert failed", insErr);
    return json({ ok: false, errors: ["We could not save your request. Please try again."] }, 500);
  }

  // Owner notification only (no customer auto-replies).
  // DISABLED until NOTIFY_TO, NOTIFY_FROM and RESEND_API_KEY are configured (Supabase function secrets
  // or rows in private.config). All are intentionally empty, so this step is a no-op.
  let notified = false, emailError = "";
  try {
    const { data: cfgRows } = await supabase.rpc("kk_get_config");
    const cfg: Record<string, string> = Object.fromEntries((cfgRows ?? []).map((r: any) => [r.key, r.value]));
    const to = (Deno.env.get("NOTIFY_TO") || cfg.notify_to || "").trim();
    const from = (Deno.env.get("NOTIFY_FROM") || cfg.notify_from || "").trim();
    const key = (Deno.env.get("RESEND_API_KEY") || cfg.resend_api_key || "").trim();
    if (to && from && key) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html, reply_to: row.email }),
      });
      if (res.ok) notified = true;
      else emailError = `${res.status} ${(await res.text()).slice(0, 300)}`;
    }
  } catch (e) {
    emailError = String(e).slice(0, 300);
  }
  await supabase.from(tableName).update({ email_notified: notified, email_error: emailError || null }).eq("reference", row.reference as string);

  return json({ ok: true, reference: row.reference, total_inr: row.total_inr ?? null });
});
