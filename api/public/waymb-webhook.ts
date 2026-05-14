import type { IncomingMessage, ServerResponse } from "http";
import { sendToUtmify, toUtcString, toCents, mapPaymentMethod } from "../lib/utmify";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Always respond 200 immediately so WayMB never retries due to timeout
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ received: true }));

  try {
    const body = await parseBody(req) as Record<string, any>;

    const rawStatus = (body.status ?? body.Status ?? body.payment_status ?? "").toLowerCase();
    const isPaid = rawStatus === "paid" || rawStatus === "success" || rawStatus === "completed" || rawStatus === "approved";

    if (!isPaid) return;

    const transactionId = body.transactionID ?? body.transaction_id ?? body.id ?? "";
    const amountEur = Number(body.amount ?? body.value ?? 0);
    const method = (body.method ?? body.payment_method ?? "mbway").toLowerCase();
    const payer = body.payer ?? body.customer ?? {};
    const now = toUtcString(new Date());
    const totalCents = toCents(amountEur);

    sendToUtmify({
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
        src: null,
        sck: null,
        utm_source: null,
        utm_campaign: null,
        utm_medium: null,
        utm_content: null,
        utm_term: null,
      },
      commission: {
        totalPriceInCents: totalCents,
        gatewayFeeInCents: Math.round(totalCents * 0.35),
        userCommissionInCents: Math.round(totalCents * 0.65),
        currency: "BRL",
      },
    });
  } catch {
    // silent — response already sent
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
