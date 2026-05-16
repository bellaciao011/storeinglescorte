import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { paniniOrdersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

function generateTrackingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "PAN";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.post("/payment/create-intent", async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const {
      amount,
      customerEmail,
      customerName,
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
      orderType = "main",
      utmParams = {},
    } = req.body as {
      amount: number;
      customerEmail: string;
      customerName: string;
      customerPhone?: string;
      customerDocument?: string;
      shippingAddress?: string;
      shippingPostalCode?: string;
      shippingCity?: string;
      shippingDistrict?: string;
      kitId?: string;
      productName?: string;
      quantity?: number;
      items?: unknown[];
      orderType?: string;
      utmParams?: Record<string, string>;
    };

    if (!amount || !customerEmail || !customerName) {
      res.status(400).json({ error: "Campos obrigatórios em falta: amount, customerEmail, customerName" });
      return;
    }

    const amountInCents = Math.round(amount * 100);
    const orderId = crypto.randomUUID();

    await db.insert(paniniOrdersTable).values({
      id: orderId,
      status: "PENDING",
      customerEmail,
      customerName,
      customerPhone,
      customerDocument,
      shippingAddress,
      shippingPostalCode,
      shippingCity,
      shippingDistrict,
      kitId,
      productName,
      quantity,
      amountEur: String(amount),
      items: items ?? null,
      orderType,
      utmSource: utmParams.utm_source,
      utmCampaign: utmParams.utm_campaign,
      utmMedium: utmParams.utm_medium,
      utmContent: utmParams.utm_content,
      utmTerm: utmParams.utm_term,
    });

    const pi = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "mxn",
      description: `${productName ?? "Kit Panini"} — Panini FIFA WC26`.slice(0, 255),
      statement_descriptor_suffix: "PANINI",
      automatic_payment_methods: { enabled: true },
      payment_method_options: {
        card: { request_three_d_secure: "automatic" },
      },
      metadata: {
        order_id: orderId,
        order_type: orderType,
        kit_id: kitId ?? "",
        quantity: String(quantity ?? 1),
      },
    });

    await db.update(paniniOrdersTable)
      .set({ stripePaymentIntentId: pi.id })
      .where(eq(paniniOrdersTable.id, orderId));

    req.log.info({ orderId, piId: pi.id, amount, orderType }, "PaymentIntent created");
    res.json({ clientSecret: pi.client_secret, orderId });
  } catch (err) {
    req.log.error({ err }, "payment/create-intent error");
    res.status(500).json({ error: "Erro interno ao criar pagamento." });
  }
});

router.post("/payment/update-intent", async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const { orderId, amount, items } = req.body as {
      orderId: string;
      amount: number;
      items?: unknown[];
    };

    if (!orderId || !amount) {
      res.status(400).json({ error: "orderId e amount são obrigatórios" });
      return;
    }

    const [order] = await db
      .select({ stripePaymentIntentId: paniniOrdersTable.stripePaymentIntentId })
      .from(paniniOrdersTable)
      .where(eq(paniniOrdersTable.id, orderId));

    if (!order?.stripePaymentIntentId) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }

    await stripe.paymentIntents.update(order.stripePaymentIntentId, {
      amount: Math.round(amount * 100),
    });

    await db.update(paniniOrdersTable)
      .set({ amountEur: String(amount), items: items ?? undefined, updatedAt: new Date() })
      .where(eq(paniniOrdersTable.id, orderId));

    req.log.info({ orderId, amount }, "PaymentIntent amount updated");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "payment/update-intent error");
    res.status(500).json({ error: "Erro ao actualizar o pagamento." });
  }
});

router.get("/public/payment-status", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.query as { orderId?: string };
    if (!orderId) {
      res.status(400).json({ error: "orderId é obrigatório" });
      return;
    }

    const [order] = await db
      .select({ status: paniniOrdersTable.status, trackingCode: paniniOrdersTable.trackingCode })
      .from(paniniOrdersTable)
      .where(eq(paniniOrdersTable.id, orderId));

    if (!order) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }

    res.json({ status: order.status, trackingCode: order.trackingCode });
  } catch (err) {
    req.log.error({ err }, "public/payment-status error");
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/stripe-webhook", async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      req.log.error("STRIPE_WEBHOOK_SECRET not configured");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as unknown as { rawBody: Buffer }).rawBody,
        sig,
        webhookSecret,
      );
    } catch (err) {
      req.log.error({ err }, "Webhook signature verification failed");
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        const trackingCode = generateTrackingCode();
        await db.update(paniniOrdersTable)
          .set({ status: "PAID", paidAt: new Date(), trackingCode, stripePaymentIntentId: pi.id, updatedAt: new Date() })
          .where(eq(paniniOrdersTable.id, orderId));
        req.log.info({ orderId, piId: pi.id, trackingCode }, "Order marked as PAID");
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        await db.update(paniniOrdersTable)
          .set({ status: "FAILED", updatedAt: new Date() })
          .where(eq(paniniOrdersTable.id, orderId));
        req.log.info({ orderId, piId: pi.id }, "Order marked as FAILED");
      }
    }

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "stripe-webhook error");
    res.status(500).json({ error: "Webhook processing error" });
  }
});

export default router;
