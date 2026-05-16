import type { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { sendToUtmify, toUtcString, toCents } from "../lib/utmify";
import { createOrder, generateTrackingCode } from "../lib/orders";

function getIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "0.0.0.0";
}

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
  if (!stripeKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Stripe não configurado" }));
    return;
  }

  const stripe = new Stripe(stripeKey);
  const ip = getIp(req);

  try {
    const body = await parseBody(req);
    const {
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerDocument,
      shippingAddress,
      shippingPostalCode,
      shippingCity,
      shippingDistrict,
      kitId,
      productName,
      quantity,
      items,
      utmParams,
    } = body as {
      amount: number;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      customerDocument?: string;
      shippingAddress?: string;
      shippingPostalCode?: string;
      shippingCity?: string;
      shippingDistrict?: string;
      kitId?: string;
      productName?: string;
      quantity?: number;
      items?: Array<{ id: string; name: string; quantity: number; price: number }>;
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

    if (!amount) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Falta el campo amount" }));
      return;
    }

    const trackingCode = generateTrackingCode();
    const orderId = randomUUID();

    // Create Stripe PaymentIntent in MXN
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // centavos MXN
      currency: "mxn",
      description: "Guía de automatizaciones con inteligencia artificial",
      statement_descriptor_suffix: "PANINI",
      metadata: {
        order_id: orderId,
        tracking_code: trackingCode,
        kit_id: kitId ?? "",
        customer_name: customerName ?? "",
        customer_email: customerEmail ?? "",
      },
    });

    const now = toUtcString(new Date());
    const qty = quantity ?? 1;
    const totalCents = toCents(amount);

    const utmProducts =
      items && items.length > 0
        ? items.map((item) => ({
            id: item.id,
            name: item.name,
            planId: null,
            planName: null,
            quantity: item.quantity ?? 1,
            priceInCents: toCents(item.price * (item.quantity ?? 1)),
          }))
        : [
            {
              id: kitId ?? "kit",
              name: productName ?? "Kit Panini FIFA WC26",
              planId: null,
              planName: null,
              quantity: qty,
              priceInCents: totalCents,
            },
          ];

    // UTMify + DB in parallel (DB errors are non-blocking)
    await Promise.all([
      sendToUtmify({
        orderId,
        platform: "Front",
        paymentMethod: "credit_card",
        status: "waiting_payment",
        createdAt: now,
        approvedDate: null,
        refundedAt: null,
        customer: {
          name: customerName ?? "",
          email: customerEmail ?? "",
          phone: customerPhone ?? null,
          document: customerDocument ?? null,
          country: "MX",
          ip,
        },
        products: utmProducts,
        trackingParameters: {
          src: utmParams?.src ?? null,
          sck: utmParams?.sck ?? null,
          utm_source: utmParams?.utm_source ?? null,
          utm_campaign: utmParams?.utm_campaign ?? null,
          utm_medium: utmParams?.utm_medium ?? null,
          utm_content: utmParams?.utm_content ?? null,
          utm_term: utmParams?.utm_term ?? null,
          fbclid: utmParams?.fbclid ?? null,
          gclid: utmParams?.gclid ?? null,
          ttclid: utmParams?.ttclid ?? null,
        },
        commission: {
          totalPriceInCents: totalCents,
          gatewayFeeInCents: Math.round(totalCents * 0.036),
          userCommissionInCents: Math.round(totalCents * 0.964),
        },
      }),
      createOrder({
        id: orderId,
        tracking_code: trackingCode,
        customer_name: customerName ?? "Cliente",
        customer_email: customerEmail ?? null,
        customer_phone: customerPhone ?? null,
        customer_document: customerDocument ?? null,
        shipping_address: shippingAddress ?? null,
        shipping_city: shippingCity ?? null,
        shipping_postal_code: shippingPostalCode ?? null,
        shipping_district: shippingDistrict ?? null,
        product_name: productName ?? "Kit Panini FIFA WC26",
        amount_eur: amount,
        utm_source: utmParams?.utm_source ?? null,
        utm_campaign: utmParams?.utm_campaign ?? null,
        utm_medium: utmParams?.utm_medium ?? null,
        utm_content: utmParams?.utm_content ?? null,
        utm_term: utmParams?.utm_term ?? null,
      }).catch((err) => console.error("[DB] createOrder error:", err)),
    ]);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, orderId })
    );
  } catch (err) {
    console.error("[CreateIntent] error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ error: "Error al crear el pago. Inténtalo de nuevo." })
    );
  }
}

function parseBody(
  req: IncomingMessage & { body?: unknown }
): Promise<unknown> {
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
