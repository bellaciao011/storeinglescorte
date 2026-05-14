import type { IncomingMessage, ServerResponse } from "http";
import { getAllOrders, updateOrderStatus, getOrderById } from "../lib/orders";
import { sendToUtmify, toCents, mapPaymentMethod, toUtcString } from "../lib/utmify";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function checkAuth(req: IncomingMessage): boolean {
  return req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-password");
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  cors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!checkAuth(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  // GET — list all orders (includes UTM fields)
  if (req.method === "GET") {
    try {
      const orders = await getAllOrders();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(orders));
    } catch (err) {
      console.error("[Admin] getAllOrders error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Database error" }));
    }
    return;
  }

  // POST — update order status
  if (req.method === "POST") {
    try {
      const body = (req.body ?? (await parseBody(req))) as { id: string; status: string };
      if (!body.id || !body.status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing id or status" }));
        return;
      }
      const validStatuses = ["preparing", "shipped", "in_transit", "delivered"];
      if (!validStatuses.includes(body.status)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid status" }));
        return;
      }
      await updateOrderStatus(body.id, body.status);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error("[Admin] updateOrderStatus error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Database error" }));
    }
    return;
  }

  // PUT — resend order to UTMify
  if (req.method === "PUT") {
    try {
      const body = (req.body ?? (await parseBody(req))) as { id: string; action: string };
      if (!body.id || body.action !== "resend_utmify") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing id or invalid action" }));
        return;
      }

      const order = await getOrderById(body.id);
      if (!order) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Order not found" }));
        return;
      }

      const isPaid = order.payment_status === "paid";
      const totalCents = toCents(Number(order.amount_eur));
      const now = toUtcString(new Date());
      const createdAt = toUtcString(new Date(order.created_at));
      const approvedAt = order.paid_at ? toUtcString(new Date(order.paid_at)) : null;

      await sendToUtmify({
        orderId: order.id,
        platform: "Front",
        paymentMethod: mapPaymentMethod(order.payment_method, isPaid ? "paid" : "waiting_payment"),
        status: isPaid ? "paid" : "waiting_payment",
        createdAt,
        approvedDate: approvedAt,
        refundedAt: null,
        customer: {
          name: order.customer_name,
          email: order.customer_email ?? "",
          phone: order.customer_phone ?? null,
          document: order.customer_document ?? null,
          country: "PT",
        },
        products: [
          {
            id: "kit-panini",
            name: order.product_name,
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: totalCents,
          },
        ],
        trackingParameters: {
          src: order.src ?? null,
          sck: order.sck ?? null,
          utm_source: order.utm_source ?? null,
          utm_campaign: order.utm_campaign ?? null,
          utm_medium: order.utm_medium ?? null,
          utm_content: order.utm_content ?? null,
          utm_term: order.utm_term ?? null,
        },
        commission: {
          totalPriceInCents: totalCents,
          gatewayFeeInCents: Math.round(totalCents * 0.35),
          userCommissionInCents: Math.round(totalCents * 0.65),
        },
      });

      console.log(`[Admin] Resent order ${order.id} to UTMify`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error("[Admin] resend_utmify error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to resend to UTMify" }));
    }
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method not allowed" }));
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on("error", reject);
  });
}
