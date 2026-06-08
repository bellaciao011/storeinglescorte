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

        // Auto-send confirmation email
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        if (RESEND_API_KEY) {
          try {
            const [order] = await db.select().from(paniniOrdersTable).where(eq(paniniOrdersTable.id, orderId));
            if (order?.customerEmail) {
              const firstName = (order.customerName ?? "Cliente").split(" ")[0];
              const productName = order.productName ?? "Producto El Corte Inglés";
              const amountFmt = Number(order.amountEur ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
              const trackingUrl = `${process.env.SITE_URL ?? "https://elcorteingles-outlet.com"}/rastreio?codigo=${trackingCode}`;

              const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="background:#0B8A43;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center;">
  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">El Corte Inglés</p>
  <p style="margin:4px 0 0;font-size:22px;font-weight:900;color:#fff;">Confirmación de pedido</p>
</td></tr>
<tr><td style="background:#fff;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.10);padding:32px;">
  <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hola <strong>${firstName}</strong>,</p>
  <p style="margin:0 0 16px;font-size:15px;color:#374151;">Tu pedido de <strong>${productName}</strong> ha sido confirmado con éxito.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
    <tr><td style="background:#f9fafb;padding:12px 20px;border-bottom:1px solid #e5e7eb;">
      <strong style="font-size:12px;color:#374151;text-transform:uppercase;letter-spacing:1px;">Resumen del pedido</strong>
    </td></tr>
    <tr><td style="padding:16px 20px;">
      <table width="100%"><tr>
        <td style="font-size:14px;color:#6b7280;">Producto</td>
        <td style="font-size:14px;color:#111827;font-weight:600;text-align:right;">${productName}</td>
      </tr><tr style="margin-top:8px;">
        <td style="font-size:14px;color:#6b7280;padding-top:8px;">Total</td>
        <td style="font-size:16px;color:#0B8A43;font-weight:900;text-align:right;padding-top:8px;">${amountFmt}</td>
      </tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d1fae5;border-radius:10px;background:#f0fdf4;margin-bottom:24px;padding:16px 20px;">
    <tr><td>
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#065f46;text-transform:uppercase;letter-spacing:1.5px;">Tu código de rastreo</p>
      <p style="margin:0 0 12px;font-size:24px;font-weight:900;color:#065f46;font-family:monospace;letter-spacing:4px;">${trackingCode}</p>
      <a href="${trackingUrl}" style="background:#0B8A43;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 20px;border-radius:8px;display:inline-block;">Rastrear mi pedido →</a>
    </td></tr>
  </table>
  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Oferta sujeta a disponibilidad · El Corte Inglés</p>
</td></tr>
</table></td></tr></table></body></html>`;

              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
                body: JSON.stringify({
                  from: "El Corte Inglés <noreply@confirmedorder.site>",
                  to: order.customerEmail,
                  subject: `¡Pedido confirmado! · Código ${trackingCode}`,
                  html,
                }),
              });

              await db.update(paniniOrdersTable)
                .set({ confirmationEmailSentAt: new Date(), updatedAt: new Date() })
                .where(eq(paniniOrdersTable.id, orderId));

              req.log.info({ orderId, email: order.customerEmail, trackingCode }, "Auto confirmation email sent");
            }
          } catch (emailErr) {
            req.log.error({ emailErr }, "Failed to send auto confirmation email");
          }
        }
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

router.get("/public/rastreio", async (req: Request, res: Response) => {
  try {
    const { codigo } = req.query as { codigo?: string };
    if (!codigo) {
      res.status(400).json({ error: "Código de rastreio é obrigatório" });
      return;
    }

    const [order] = await db
      .select()
      .from(paniniOrdersTable)
      .where(eq(paniniOrdersTable.trackingCode, codigo.toUpperCase()));

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const rawStatus = (order.status ?? "").toLowerCase();
    const paymentStatus =
      rawStatus === "paid" ? "paid" :
      rawStatus === "failed" || rawStatus === "refused" ? "refused" :
      "waiting_payment";

    res.json({
      tracking_code: order.trackingCode,
      customer_name: order.customerName,
      product_name: order.productName,
      amount_eur: order.amountEur,
      payment_status: paymentStatus,
      order_status: order.orderStatus ?? "preparing",
      paid_at: order.paidAt,
      created_at: order.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "public/rastreio error");
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/admin/orders", async (req: Request, res: Response) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (req.headers["x-admin-password"] !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const orders = await db
      .select()
      .from(paniniOrdersTable)
      .orderBy(paniniOrdersTable.createdAt);

    const mapped = orders.map((o) => {
      const rawStatus = (o.status ?? "").toLowerCase();
      return {
        id: o.id,
        tracking_code: o.trackingCode,
        customer_name: o.customerName,
        customer_email: o.customerEmail,
        customer_phone: o.customerPhone,
        shipping_address: o.shippingAddress,
        shipping_city: o.shippingCity,
        shipping_postal_code: o.shippingPostalCode,
        product_name: o.productName,
        amount_eur: o.amountEur,
        status: rawStatus === "paid" ? "paid" : rawStatus === "failed" ? "refused" : rawStatus,
        order_status: o.orderStatus ?? "preparing",
        confirmation_email_sent_at: o.confirmationEmailSentAt,
        paid_at: o.paidAt,
        utm_source: o.utmSource,
        utm_campaign: o.utmCampaign,
        utm_medium: o.utmMedium,
        utm_content: o.utmContent,
        utm_term: o.utmTerm,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
      };
    });

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "admin/orders GET error");
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/admin/orders", async (req: Request, res: Response) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (req.headers["x-admin-password"] !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { id, status } = req.body as { id: string; status: string };
    const validStatuses = ["preparing", "shipped", "in_transit", "delivered"];
    if (!id || !validStatuses.includes(status)) {
      res.status(400).json({ error: "id e status válido são obrigatórios" });
      return;
    }
    await db
      .update(paniniOrdersTable)
      .set({ orderStatus: status, updatedAt: new Date() })
      .where(eq(paniniOrdersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin/orders POST error");
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/admin/orders", async (req: Request, res: Response) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (req.headers["x-admin-password"] !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { id, action } = req.body as { id: string; action: string };
    if (!id || action !== "send_email") {
      res.status(400).json({ error: "id e action=send_email são obrigatórios" });
      return;
    }

    const [order] = await db
      .select()
      .from(paniniOrdersTable)
      .where(eq(paniniOrdersTable.id, id));

    if (!order || !order.customerEmail) {
      res.status(404).json({ error: "Pedido não encontrado ou sem email" });
      return;
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      res.status(500).json({ error: "RESEND_API_KEY não configurado" });
      return;
    }

    const trackingCode = order.trackingCode ?? "—";
    const trackingUrl = `https://panini-mx.site/rastreio?codigo=${trackingCode}`;
    const firstName = (order.customerName ?? "Cliente").split(" ")[0];
    const amountFmt = `$${Number(order.amountEur ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
    const productName = order.productName ?? "Kit Panini FIFA World Cup 2026";

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="background:#7B1C1C;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center;"><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">FIFA World Cup 2026&#8482;</p><p style="margin:0;font-size:22px;font-weight:900;color:#F5C518;font-family:Georgia,serif;">PANINI</p></td></tr><tr><td style="background:#fff;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.10);"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#1a7a3c;padding:24px 32px;text-align:center;"><div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 10px;line-height:52px;font-size:26px;color:#fff;">&#10003;</div><h1 style="margin:0;color:#fff;font-size:21px;font-weight:800;">&#161;Pedido confirmado!</h1><p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Tu pago fue recibido con &#233;xito</p></td></tr></table><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 32px;"><p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hola <strong>${firstName}</strong>,<br/>Tu pedido de <strong>${productName}</strong> est&#225; siendo preparado y ser&#225; enviado muy pronto a M&#233;xico.</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;"><tr><td style="background:#7B1C1C;padding:12px 20px;"><span style="font-size:10px;font-weight:700;color:#F5C518;text-transform:uppercase;letter-spacing:1.5px;">Resumen del pedido</span></td></tr><tr><td style="padding:4px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Producto</td><td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${productName}</td></tr><tr><td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Total pagado</td><td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:700;text-align:right;border-bottom:1px solid #f3f4f6;">${amountFmt}</td></tr><tr><td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">M&#233;todo de pago</td><td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">Tarjeta de cr&#233;dito / d&#233;bito</td></tr><tr><td style="padding:13px 20px;font-size:13px;color:#6b7280;">C&#243;digo de rastreo</td><td style="padding:13px 20px;text-align:right;"><span style="font-size:17px;font-weight:900;color:#7B1C1C;letter-spacing:3px;font-family:monospace;">${trackingCode}</span></td></tr></table></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="center"><a href="${trackingUrl}" style="display:inline-block;background:#7B1C1C;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 38px;border-radius:8px;">Rastrear mi pedido &rarr;</a></td></tr></table><p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;">panini-mx.site &middot; Env&#237;o gratis a todo M&#233;xico</p></td></tr></table></td></tr></table></td></tr></table></body></html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Panini WC26 <panini@confirmedorder.site>",
        to: order.customerEmail,
        subject: `¡Pedido confirmado! — Código ${trackingCode}`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const txt = await emailRes.text();
      req.log.error({ status: emailRes.status, txt }, "Resend error");
      res.status(502).json({ error: "Falha ao enviar email" });
      return;
    }

    await db
      .update(paniniOrdersTable)
      .set({ confirmationEmailSentAt: new Date(), updatedAt: new Date() })
      .where(eq(paniniOrdersTable.id, id));

    req.log.info({ id, email: order.customerEmail }, "Confirmation email sent from admin");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin/orders PUT error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
