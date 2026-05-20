import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const COOUD_API = "https://api.cooud.com/v2";
const COMPAT_DATE = "2026-09-01";

function cooudHeaders(key: string, idempotencyKey?: string): Record<string, string> {
  const h: Record<string, string> = {
    "Authorization": `Bearer ${key}`,
    "Cooud-Compat-Date": COMPAT_DATE,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) h["Idempotency-Key"] = idempotencyKey;
  return h;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

router.post("/payment/create", async (req: Request, res: Response) => {
  const cooudKey = process.env.COOUD_SECRET_KEY;
  if (!cooudKey) {
    res.status(500).json({ error: "Gateway de pagamento não configurado" });
    return;
  }

  try {
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
    } = req.body as {
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
    };

    if (!amount) {
      res.status(400).json({ error: "Falta el campo amount" });
      return;
    }

    const orderId = randomUUID();
    const qty = quantity ?? 1;
    const totalCents = toCents(amount);

    const lineItems =
      items && items.length > 0
        ? items.map((item) => ({
            name: item.name,
            amount: toCents(item.price * (item.quantity ?? 1)),
            currency: "mxn",
            quantity: item.quantity ?? 1,
          }))
        : [
            {
              name: productName ?? "Kit Panini FIFA WC26",
              amount: totalCents,
              currency: "mxn",
              quantity: qty,
            },
          ];

    const origin =
      (req.headers["origin"] as string | undefined) ??
      `http://localhost:${process.env.PORT ?? 5000}`;

    const successUrl = `${origin}/checkout?return=1&orderId=${orderId}`;
    const cancelUrl = `${origin}/checkout?kit=${kitId ?? "basico"}`;

    const sessionRes = await fetch(`${COOUD_API}/checkout-sessions`, {
      method: "POST",
      headers: cooudHeaders(cooudKey, orderId),
      body: JSON.stringify({
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail ?? undefined,
        metadata: {
          order_id: orderId,
          kit_id: kitId ?? "",
          customer_name: customerName ?? "",
          customer_email: customerEmail ?? "",
        },
      }),
    });

    if (!sessionRes.ok) {
      const errBody = await sessionRes.text();
      req.log.error({ errBody }, "[payment/create] Cooud session error");
      res.status(500).json({ error: "Error al iniciar el pago. Inténtalo de nuevo." });
      return;
    }

    const session = (await sessionRes.json()) as { url: string; id: string };

    let elementConfig: Record<string, unknown> | null = null;
    try {
      const elemRes = await fetch(
        `${COOUD_API}/checkout-sessions/${session.id}/element-config`,
        {
          method: "POST",
          headers: cooudHeaders(cooudKey),
          body: JSON.stringify({}),
        }
      );
      if (elemRes.ok) {
        elementConfig = (await elemRes.json()) as Record<string, unknown>;
      } else {
        req.log.warn({ status: elemRes.status }, "[payment/create] element-config non-ok");
      }
    } catch (e) {
      req.log.warn({ e }, "[payment/create] element-config fetch failed");
    }

    res.json({
      checkoutUrl: session.url,
      orderId,
      sessionId: session.id,
      elementConfig,
    });
  } catch (err) {
    req.log.error({ err }, "[payment/create] error");
    res.status(500).json({ error: "Error al crear el pago. Inténtalo de nuevo." });
  }
});

export default router;
