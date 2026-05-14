import type { IncomingMessage, ServerResponse } from "http";
import { sendToUtmify, toUtcString, toCents, mapPaymentMethod } from "../lib/utmify";

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    // IMPORTANT: read body BEFORE sending response.
    // Vercel pre-parses JSON into req.body; fall back to stream for other runtimes.
    const body = (req.body !== undefined ? req.body : await parseBody(req)) as Record<string, any>;

    // Respond 200 immediately so WayMB doesn't retry
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true }));

    const rawStatus = (body.status ?? body.Status ?? body.payment_status ?? "").toLowerCase();
    const isPaid = rawStatus === "paid" || rawStatus === "success" || rawStatus === "completed" || rawStatus === "approved";

    console.log(`[Webhook] received status="${rawStatus}" isPaid=${isPaid} transactionID=${body.transactionID ?? body.transaction_id ?? body.id ?? "?"}`);

    if (!isPaid) return;

    const transactionId = body.transactionID ?? body.transaction_id ?? body.id ?? `wh-${Date.now()}`;
    const amountEur = Number(body.amount ?? body.value ?? 0);
    const method = (body.method ?? body.payment_method ?? "mbway").toLowerCase();
    const payer = body.payer ?? body.customer ?? {};
    const now = toUtcString(new Date());
    const totalCents = toCents(amountEur);

    await sendToUtmify({
      orderId: String(transactionId),
      platform: "WayMB",
      paymentMethod: mapPaymentMethod(method),
      status: "paid",
      createdAt: now,
      approvedDate: now,
      refundedAt: null,
      customer: {
        name: payer.name ?? "",
        email: payer.email ?? "",
        phone: payer.phone ?? null,
        document: payer.document ?? null,
        country: "PT",
        ip: payer.ip ?? "0.0.0.0",
      },
      products: [
        {
          id: "kit-panini",
          name: "Kit Panini FIFA WC26",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: totalCents,
        },
      ],
      trackingParameters: {
        src: body.src ?? null,
        sck: body.sck ?? null,
        utm_source: body.utm_source ?? null,
        utm_campaign: body.utm_campaign ?? null,
        utm_medium: body.utm_medium ?? null,
        utm_content: body.utm_content ?? null,
        utm_term: body.utm_term ?? null,
      },
      commission: {
        totalPriceInCents: totalCents,
        gatewayFeeInCents: Math.round(totalCents * 0.35),
        userCommissionInCents: Math.round(totalCents * 0.65),
        currency: "BRL",
      },
    });
  } catch (err) {
    console.error("[Webhook] error:", err);
    // Response may already be sent; only write headers if not
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({ raw: data });
      }
    });
    req.on("error", reject);
  });
}
