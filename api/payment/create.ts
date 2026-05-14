import type { IncomingMessage, ServerResponse } from "http";
import { sendToUtmify, toUtcString, toCents, mapPaymentMethod } from "../lib/utmify";
import { createOrder, generateTrackingCode } from "../lib/orders";

const WAYMB_BASE = "https://api.waymb.com";

function getIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "0.0.0.0";
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const clientId = process.env.WAYMB_CLIENT_ID;
  const clientSecret = process.env.WAYMB_CLIENT_SECRET;
  const accountEmail = process.env.WAYMB_ACCOUNT_EMAIL;

  if (!clientId || !clientSecret || !accountEmail) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "WayMB credentials not configured" }));
    return;
  }

  const ip = getIp(req);

  try {
    const body = await parseBody(req);
    const {
      amount,
      method,
      payer,
      paymentDescription,
      kitId,
      kitName,
      quantity,
      bumps,
      utmParams,
    } = body as {
      amount: number;
      method: "mbway" | "multibanco";
      payer: { email: string; name: string; document: string; phone: string };
      paymentDescription?: string;
      kitId?: string;
      kitName?: string;
      quantity?: number;
      bumps?: Array<{ id: string; name: string; price: number }>;
      utmParams?: {
        src?: string | null;
        sck?: string | null;
        utm_source?: string | null;
        utm_campaign?: string | null;
        utm_medium?: string | null;
        utm_content?: string | null;
        utm_term?: string | null;
        fbclid?: string | null;
        gclid?: string | null;
        ttclid?: string | null;
      };
    };

    if (!amount || !method || !payer) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required fields: amount, method, payer" }));
      return;
    }

    const payload = {
      client_id: clientId,
      client_secret: clientSecret,
      account_email: accountEmail,
      amount,
      method,
      currency: "EUR",
      payer,
      paymentDescription: paymentDescription ?? "Kit Panini FIFA World Cup 2026",
    };

    const response = await fetch(`${WAYMB_BASE}/transactions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const rawBody = await response.text();

    if (!response.ok) {
      const details = isJson ? JSON.parse(rawBody) : rawBody;
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Erro na plataforma de pagamento. Tenta novamente em instantes.", details }));
      return;
    }

    const data = isJson ? JSON.parse(rawBody) : { raw: rawBody };

    // Build UTMify payload (non-blocking)
    const now = toUtcString(new Date());
    const qty = quantity ?? 1;
    const kitCents = toCents((amount - (bumps ?? []).reduce((s, b) => s + b.price, 0)));
    const totalCents = toCents(amount);

    const products = [
      {
        id: kitId ?? "kit",
        name: kitName ?? "Kit Panini FIFA WC26",
        planId: null,
        planName: null,
        quantity: qty,
        priceInCents: kitCents,
      },
      ...((bumps ?? []).map(b => ({
        id: b.id,
        name: b.name,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: toCents(b.price),
      }))),
    ];

    const transactionId = data.transactionID ?? `order-${Date.now()}`;
    const trackingCode = generateTrackingCode();
    const productName = kitName ?? "Kit Panini FIFA WC26";

    // Await UTMify before responding — Vercel kills the function after res.end(), so this must complete first
    await sendToUtmify({
      orderId: transactionId,
      platform: "Front",
      paymentMethod: mapPaymentMethod(method),
      status: "waiting_payment",
      createdAt: now,
      approvedDate: null,
      refundedAt: null,
      customer: {
        name: payer.name,
        email: payer.email,
        phone: payer.phone ?? null,
        document: payer.document ?? null,
        country: "PT",
        ip,
      },
      products,
      trackingParameters: {
        src: utmParams?.src ?? null,
        sck: utmParams?.sck ?? null,
        utm_source: utmParams?.utm_source ?? null,
        utm_campaign: utmParams?.utm_campaign ?? null,
        utm_medium: utmParams?.utm_medium ?? null,
        utm_content: utmParams?.utm_content ?? null,
        utm_term: utmParams?.utm_term ?? null,
      },
      commission: {
        totalPriceInCents: totalCents,
        gatewayFeeInCents: Math.round(totalCents * 0.35),
        userCommissionInCents: Math.round(totalCents * 0.65),
      },
    });

    // Save to DB before responding — Vercel kills the function after res.end()
    try {
      await createOrder({
        id: transactionId,
        tracking_code: trackingCode,
        customer_name: payer.name,
        customer_email: payer.email ?? null,
        customer_phone: payer.phone ?? null,
        customer_document: payer.document ?? null,
        customer_address: null,
        product_name: productName,
        amount_eur: amount,
        payment_method: method,
        utm_source: utmParams?.utm_source ?? null,
        utm_campaign: utmParams?.utm_campaign ?? null,
        utm_medium: utmParams?.utm_medium ?? null,
        utm_content: utmParams?.utm_content ?? null,
        utm_term: utmParams?.utm_term ?? null,
        src: utmParams?.src ?? null,
        sck: utmParams?.sck ?? null,
      });
      console.log(`[DB] Order ${transactionId} saved, tracking=${trackingCode}`);
    } catch (err) {
      console.error("[DB] createOrder error:", err);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

function parseBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  // Vercel pre-parses JSON bodies into req.body — use it when available
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}
