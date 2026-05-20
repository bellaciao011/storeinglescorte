import type { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";
import { sendToUtmify, toUtcString, toCents } from "./lib/utmify";
import { createOrder, generateTrackingCode } from "./lib/orders";

const KIT_MAP: Record<string, { name: string; price: number; fallbackUrl: string }> = {
  basico:      { name: "Kit Básico",                    price: 329,  fallbackUrl: "https://checkout.cooud.com/01KS137170J22EER29WXMDJ5T7" },
  iniciante:   { name: "Kit Iniciante",                 price: 749,  fallbackUrl: "https://checkout.cooud.com/01KS14367WFPP7TQ98HS2ACAC5" },
  campeao:     { name: "Kit Campeón",                   price: 1199, fallbackUrl: "https://checkout.cooud.com/01KS14A4TGAGPQSBXAMRAKFXHY" },
  colecionador:{ name: "Kit Coleccionista",             price: 1899, fallbackUrl: "https://checkout.cooud.com/01KS14E2ENQY9PHF9E446W3FA9" },
  dourada:     { name: "Álbum Golden Edition",          price: 4199, fallbackUrl: "https://checkout.cooud.com/01KS14HQMQDCP6KX7NRXYRTMPG" },
  estadio:     { name: "Kit Estadio — Edición Limitada",price: 5699, fallbackUrl: "https://checkout.cooud.com/01KS14MTF1T7YY2S7QNXE7HMDS" },
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.writeHead(405); res.end(); return;
  }

  const url = new URL(req.url ?? "/", "https://panini-mx.site");
  const p = url.searchParams;

  const kitId       = p.get("kit") ?? "campeao";
  const kit         = KIT_MAP[kitId] ?? KIT_MAP.campeao;
  const utmSource   = p.get("utm_source");
  const utmMedium   = p.get("utm_medium");
  const utmCampaign = p.get("utm_campaign");
  const utmContent  = p.get("utm_content");
  const utmTerm     = p.get("utm_term");
  const src         = p.get("src");
  const sck         = p.get("sck");
  const ttclid      = p.get("ttclid");
  const fbclid      = p.get("fbclid");
  const gclid       = p.get("gclid");

  const cooudKey = process.env.COOUD_SECRET_KEY;
  const orderId  = randomUUID();
  const tracking = generateTrackingCode();
  const now      = toUtcString(new Date());
  const totalCents = toCents(kit.price);

  const requestOrigin = (req.headers["origin"] as string | undefined)
    ?? (req.headers["referer"] ? new URL(req.headers["referer"] as string).origin : null)
    ?? "https://panini-mx.site";

  let redirectUrl = kit.fallbackUrl;

  if (cooudKey) {
    try {
      const successUrl = `${requestOrigin}/checkout?return=1&orderId=${orderId}`;
      const cancelUrl  = `${requestOrigin}/?kit=${kitId}`;

      const sessionRes = await fetch("https://api.cooud.com/v2/checkout-sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cooudKey}`,
          "Cooud-Compat-Date": "2026-09-01",
          "Idempotency-Key": orderId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line_items: [{ name: kit.name, amount: totalCents, currency: "mxn", quantity: 1 }],
          success_url: successUrl,
          cancel_url:  cancelUrl,
          metadata: {
            order_id:      orderId,
            tracking_code: tracking,
            kit_id:        kitId,
            utm_source:    utmSource ?? "",
            utm_medium:    utmMedium ?? "",
            utm_campaign:  utmCampaign ?? "",
            ttclid:        ttclid ?? "",
            src:           src ?? "",
            sck:           sck ?? "",
          },
        }),
      });

      if (sessionRes.ok) {
        const session = await sessionRes.json() as { url: string; id: string };
        redirectUrl = session.url;
      } else {
        const errBody = await sessionRes.text();
        console.error("[go] Cooud session error:", errBody);
      }
    } catch (err) {
      console.error("[go] Cooud fetch error:", err);
    }
  }

  // Fire-and-forget: record order + UTMify waiting_payment
  Promise.all([
    createOrder({
      id: orderId,
      tracking_code: tracking,
      customer_name: "Lead",
      customer_email: null,
      customer_phone: null,
      customer_document: null,
      shipping_address: null,
      shipping_city: null,
      shipping_postal_code: null,
      shipping_district: null,
      product_name: kit.name,
      amount_eur: kit.price,
      utm_source:   utmSource   ?? null,
      utm_campaign: utmCampaign ?? null,
      utm_medium:   utmMedium   ?? null,
      utm_content:  utmContent  ?? null,
      utm_term:     utmTerm     ?? null,
      src:          src         ?? null,
      sck:          sck         ?? null,
      ttclid:       ttclid      ?? null,
      fbclid:       fbclid      ?? null,
      gclid:        gclid       ?? null,
    }).catch((e) => console.error("[go] createOrder error:", e)),

    sendToUtmify({
      orderId,
      platform: "Front",
      paymentMethod: "credit_card",
      status: "waiting_payment",
      createdAt: now,
      approvedDate: null,
      refundedAt: null,
      customer: { name: "Lead", email: "", phone: null, document: null, country: "MX", ip: "0.0.0.0" },
      products: [{ id: kitId, name: kit.name, planId: null, planName: null, quantity: 1, priceInCents: totalCents }],
      trackingParameters: {
        src:          src          ?? null,
        sck:          sck          ?? null,
        utm_source:   utmSource    ?? null,
        utm_campaign: utmCampaign  ?? null,
        utm_medium:   utmMedium    ?? null,
        utm_content:  utmContent   ?? null,
        utm_term:     utmTerm      ?? null,
        fbclid:       fbclid       ?? null,
        gclid:        gclid        ?? null,
        ttclid:       ttclid       ?? null,
      },
      commission: {
        totalPriceInCents:       totalCents,
        gatewayFeeInCents:       Math.round(totalCents * 0.036),
        userCommissionInCents:   Math.round(totalCents * 0.964),
      },
    }).catch((e) => console.error("[go] UTMify error:", e)),
  ]);

  res.writeHead(302, { Location: redirectUrl });
  res.end();
}
