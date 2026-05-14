import type { IncomingMessage, ServerResponse } from "http";
import { sendToUtmify, toUtcString } from "../lib/utmify";

const WAYMB_BASE = "https://api.waymb.com";

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
        src?: string;
        sck?: string;
        utm_source?: string;
        utm_campaign?: string;
        utm_medium?: string;
        utm_content?: string;
        utm_term?: string;
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

    // Send waiting_payment event to UTMify (non-blocking)
    const now = toUtcString(new Date());
    const totalCents = Math.round(amount * 100);
    const products = [
      {
        id: kitId ?? "kit",
        name: kitName ?? "Kit Panini FIFA WC26",
        planId: null,
        planName: null,
        quantity: quantity ?? 1,
        priceInCents: totalCents,
      },
      ...((bumps ?? []).map(b => ({
        id: b.id,
        name: b.name,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: Math.round(b.price * 100),
      }))),
    ];

    sendToUtmify({
      orderId: data.transactionID ?? `order-${Date.now()}`,
      platform: "WayMB",
      paymentMethod: method === "mbway" ? "pix" : "boleto",
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
        gatewayFeeInCents: 0,
        userCommissionInCents: totalCents,
        currency: "EUR",
      },
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

function parseBody(req: IncomingMessage): Promise<unknown> {
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
