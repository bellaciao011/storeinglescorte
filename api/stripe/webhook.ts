import type { IncomingMessage, ServerResponse } from "http";
import Stripe from "stripe";
import { sendToUtmify, toUtcString, toCents } from "../lib/utmify";
import { markOrderPaid, markEmailSent, markOrderRefused } from "../lib/orders";
import { sendConfirmationEmail } from "../lib/email";

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Stripe não configurado" }));
    return;
  }

  const stripe = new Stripe(stripeKey);

  // Read raw body for signature verification
  const rawBody = await readRawBody(req);
  const sig = req.headers["stripe-signature"] as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Webhook signature invalid" }));
    return;
  }

  console.log(`[Webhook] event=${event.type}`);

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as {
        metadata?: Record<string, string>;
        amount: number;
        last_payment_error?: { message?: string };
      };
      const orderId = pi.metadata?.order_id;
      const amountMxn = pi.amount / 100;
      const now = toUtcString(new Date());
      const totalCents = toCents(amountMxn);

      if (!orderId) {
        console.error("[Webhook] payment_intent.succeeded sem order_id no metadata");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ received: true }));
        return;
      }

      // Mark as paid in DB
      const paid = await markOrderPaid(orderId).catch((e) => {
        console.error("[Webhook] markOrderPaid error:", e);
        return null;
      });

      // Send UTMify paid event
      await sendToUtmify({
        orderId,
        platform: "Front",
        paymentMethod: "credit_card",
        status: "paid",
        createdAt: now,
        approvedDate: now,
        refundedAt: null,
        customer: {
          name: pi.metadata?.customer_name ?? paid?.customer_name ?? "",
          email: pi.metadata?.customer_email ?? paid?.customer_email ?? "",
          phone: null,
          document: null,
          country: "MX",
          ip: "0.0.0.0",
        },
        products: [
          {
            id: pi.metadata?.kit_id ?? "kit",
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

      // Send confirmation email
      if (paid?.customer_email) {
        await sendConfirmationEmail({
          customer_name: paid.customer_name,
          customer_email: paid.customer_email,
          tracking_code: paid.tracking_code,
          product_name: paid.product_name,
          amount_eur: Number(paid.amount_eur),
          payment_method: "stripe",
        }).catch((e) => console.error("[Webhook] email error:", e));

        await markEmailSent(orderId).catch(() => {});
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as {
        metadata?: Record<string, string>;
        last_payment_error?: { message?: string };
      };
      const orderId = pi.metadata?.order_id;
      const reason = pi.last_payment_error?.message ?? null;

      if (orderId) {
        await markOrderRefused(orderId, reason).catch((e) =>
          console.error("[Webhook] markOrderRefused error:", e)
        );
      }
    }
  } catch (err) {
    console.error("[Webhook] processing error:", err);
  }

  // Always return 200 to Stripe
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
