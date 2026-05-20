import type { IncomingMessage, ServerResponse } from "http";
import { createHmac, timingSafeEqual } from "crypto";
import { sendToUtmify, toUtcString, toCents } from "../lib/utmify";
import { markOrderPaid, markEmailSent, markOrderRefused } from "../lib/orders";
import { sendConfirmationEmail } from "../lib/email";

function verifyCooudSignature(
  payload: string,
  header: string | undefined,
  secret: string,
  toleranceSec = 300
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    })
  );
  const t = Number(parts.t);
  const provided = parts.v1;
  if (!Number.isFinite(t) || t <= 0 || !provided) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - t) > toleranceSec) return false;
  if (!/^[0-9a-f]{64}$/i.test(provided)) return false;
  const expected = createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const rawBody = await readRawBody(req);
  const payload = rawBody.toString("utf8");

  const webhookSecret = process.env.COOUD_WEBHOOK_SECRET;
  const sigHeader = req.headers["x-cooud-signature"] as string | undefined;

  if (webhookSecret) {
    if (!verifyCooudSignature(payload, sigHeader, webhookSecret)) {
      console.error("[Cooud Webhook] Signature verification failed");
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid signature" }));
      return;
    }
  } else {
    console.warn("[Cooud Webhook] COOUD_WEBHOOK_SECRET not set — skipping signature verification");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  console.log(`[Cooud Webhook] event=${event.type} id=${event.id}`);

  try {
    if (event.type === "order.paid") {
      const order = event.data as {
        id: string;
        email?: string;
        customer_name?: string;
        status: string;
        currency: string;
        total_amount: number;
        metadata?: Record<string, string>;
        items?: Array<{ name: string; amount: number; price_id?: string | null }>;
      };

      const orderId = order.metadata?.order_id;
      const amountMxn = order.total_amount / 100;
      const now = toUtcString(new Date());
      const totalCents = toCents(amountMxn);

      if (!orderId) {
        console.error("[Cooud Webhook] order.paid sem order_id no metadata — cooud order:", order.id);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ received: true }));
        return;
      }

      const paid = await markOrderPaid(orderId).catch((e) => {
        console.error("[Cooud Webhook] markOrderPaid error:", e);
        return null;
      });

      await sendToUtmify({
        orderId,
        platform: "Front",
        paymentMethod: "credit_card",
        status: "paid",
        createdAt: now,
        approvedDate: now,
        refundedAt: null,
        customer: {
          name: order.customer_name ?? paid?.customer_name ?? "",
          email: order.email ?? paid?.customer_email ?? "",
          phone: null,
          document: null,
          country: "MX",
          ip: "0.0.0.0",
        },
        products: [
          {
            id: order.metadata?.kit_id ?? "kit",
            name: paid?.product_name ?? "Kit Panini FIFA WC26",
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
          gatewayFeeInCents: Math.round(totalCents * 0.036),
          userCommissionInCents: Math.round(totalCents * 0.964),
        },
      });

      if (paid?.customer_email) {
        await sendConfirmationEmail({
          customer_name: paid.customer_name,
          customer_email: paid.customer_email,
          tracking_code: paid.tracking_code,
          product_name: paid.product_name,
          amount_eur: Number(paid.amount_eur),
          payment_method: "cooud",
        }).catch((e) => console.error("[Cooud Webhook] email error:", e));

        await markEmailSent(orderId).catch(() => {});
      }
    } else if (event.type === "order.refunded") {
      const order = event.data as {
        metadata?: Record<string, string>;
      };
      const orderId = order.metadata?.order_id;
      if (orderId) {
        await markOrderRefused(orderId).catch((e) =>
          console.error("[Cooud Webhook] markOrderRefused error:", e)
        );
      }
    }
  } catch (err) {
    console.error("[Cooud Webhook] processing error:", err);
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ received: true }));
}

function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
