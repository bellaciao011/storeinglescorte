import { Router, type IRouter, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@workspace/db";
import { paniniOrdersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

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

router.post("/cooud/webhook", async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.COOUD_WEBHOOK_SECRET;
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    const payload = rawBody ? rawBody.toString("utf8") : JSON.stringify(req.body);
    const sigHeader = req.headers["x-cooud-signature"] as string | undefined;

    if (webhookSecret) {
      if (!verifyCooudSignature(payload, sigHeader, webhookSecret)) {
        req.log.error("Cooud webhook signature verification failed");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }
    }

    const event = JSON.parse(payload) as {
      id: string;
      type: string;
      data: {
        id: string;
        email?: string;
        customer_name?: string;
        total_amount: number;
        metadata?: Record<string, string>;
      };
    };

    req.log.info({ type: event.type, id: event.id }, "Cooud webhook received");

    if (event.type === "order.paid") {
      const orderId = event.data.metadata?.order_id;
      if (orderId) {
        await db.update(paniniOrdersTable)
          .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
          .where(eq(paniniOrdersTable.id, orderId));
        req.log.info({ orderId }, "Order marked as paid via Cooud webhook");
      }
    }

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "cooud/webhook error");
    res.status(500).json({ error: "Webhook processing error" });
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

export default router;
