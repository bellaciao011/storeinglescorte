import type { IncomingMessage, ServerResponse } from "http";
import { getOrderById } from "../lib/orders";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const url = new URL(req.url ?? "", `http://localhost`);
  const orderId = url.searchParams.get("orderId") ?? "";

  if (!orderId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing orderId" }));
    return;
  }

  if (!process.env.SUPABASE_DB_URL) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "SUPABASE_DB_URL not configured" }));
    return;
  }

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "not_found" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: order.status, tracking_code: order.tracking_code }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PaymentStatus] error:", msg);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "DB error", detail: msg }));
  }
}
