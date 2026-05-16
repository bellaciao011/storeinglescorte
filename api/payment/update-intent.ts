import type { IncomingMessage, ServerResponse } from "http";
import Stripe from "stripe";

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

  try {
    const body = await parseBody(req);
    const { piId, amount } = body as { piId?: string; amount?: number };

    if (!piId || !amount) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Falta piId ou amount" }));
      return;
    }

    await stripe.paymentIntents.update(piId, {
      amount: Math.round(amount * 100),
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("[UpdateIntent] error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error al actualizar el pago." }));
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
