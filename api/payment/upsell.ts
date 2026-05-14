import type { IncomingMessage, ServerResponse } from "http";
import { sendToUtmify, toUtcString, toCents, mapPaymentMethod } from "../lib/utmify";

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
    const { amount, method, shippingOption, phone, payer, utmParams } = body as {
      amount: number;
      method: "mbway" | "multibanco";
      shippingOption: string;
      phone: string;
      payer: { name: string; email: string; document: string; phone: string };
      utmParams?: {
        src?: string | null;
        sck?: string | null;
        utm_source?: string | null;
        utm_campaign?: string | null;
        utm_medium?: string | null;
        utm_content?: string | null;
        utm_term?: string | null;
      };
    };

    if (!amount || !method || !payer) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing required fields" }));
      return;
    }

    const payerPhone = method === "mbway" ? phone : payer.phone;

    const payload = {
      client_id: clientId,
      client_secret: clientSecret,
      account_email: accountEmail,
      amount,
      method,
      currency: "EUR",
      payer: { ...payer, phone: payerPhone },
      paymentDescription: `Frete — ${shippingOption}`,
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
      res.end(JSON.stringify({ error: "Erro na plataforma de pagamento. Tenta novamente.", details }));
      return;
    }

    const data = isJson ? JSON.parse(rawBody) : { raw: rawBody };

    // Send to UTMify as "upsell1"
    const now = toUtcString(new Date());
    const totalCents = toCents(amount);

    sendToUtmify({
      orderId: data.transactionID ?? `upsell-${Date.now()}`,
      platform: "upsell1",
      paymentMethod: mapPaymentMethod(method),
      status: "waiting_payment",
      createdAt: now,
      approvedDate: null,
      refundedAt: null,
      customer: {
        name: payer.name,
        email: payer.email,
        phone: payerPhone ?? null,
        document: payer.document ?? null,
        country: "PT",
        ip,
      },
      products: [
        {
          id: "upsell-frete",
          name: `Frete — ${shippingOption}`,
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: totalCents,
        },
      ],
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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

function parseBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}
