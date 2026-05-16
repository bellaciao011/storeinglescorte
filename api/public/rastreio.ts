import type { IncomingMessage, ServerResponse } from "http";
import { getOrderByTrackingCode } from "../lib/orders";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const url = new URL(req.url ?? "", `http://localhost`);
  const codigo = url.searchParams.get("codigo") ?? "";

  if (!codigo) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing tracking code" }));
    return;
  }

  try {
    const order = await getOrderByTrackingCode(codigo);
    if (!order) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Order not found" }));
      return;
    }

    // Only return safe, non-sensitive fields
    const safe = {
      tracking_code: order.tracking_code,
      customer_name: order.customer_name,
      product_name: order.product_name,
      amount_eur: order.amount_eur,
      payment_status: order.status,
      order_status: order.order_status,
      paid_at: order.paid_at,
      created_at: order.created_at,
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(safe));
  } catch (err) {
    console.error("[Rastreio] error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
