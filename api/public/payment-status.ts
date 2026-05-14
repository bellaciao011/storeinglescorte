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
  const transactionId = url.searchParams.get("transactionId") ?? "";

  if (!transactionId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing transactionId" }));
    return;
  }

  try {
    const order = await getOrderById(transactionId);
    if (!order) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "not_found" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: order.payment_status }));
  } catch (err) {
    console.error("[PaymentStatus] error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
