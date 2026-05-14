import type { IncomingMessage, ServerResponse } from "http";
import { sendToUtmify, toUtcString } from "../lib/utmify";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Always respond 200 immediately so WayMB doesn't retry
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ received: true }));

  try {
    const body = await parseBody(req) as Record<string, any>;

    const status = (body.status ?? body.Status ?? body.payment_status ?? "").toLowerCase();
    const isPaid = status === "paid" || status === "success" || status === "completed" || status === "approved";

    if (!isPaid) return;

    const transactionId = body.transactionID ?? body.transaction_id ?? body.id ?? "";
    const amount = Number(body.amount ?? body.value ?? 0);
    const method = (body.method ?? body.payment_method ?? "mbway").toLowerCase();
    const payer = body.payer ?? body.customer ?? {};
    const now = toUtcString(new Date());
    const totalCents = Math.round(amount * 100);

    sendToUtmify({
      orderId: String(transactionId),
      platform: "WayMB",
      paymentMethod: method === "multibanco" ? "boleto" : "pix",
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
        gatewayFeeInCents: 0,
        userCommissionInCents: totalCents,
        currency: "EUR",
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
