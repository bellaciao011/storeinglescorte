import type { IncomingMessage, ServerResponse } from "http";
import { getAllOrders, updateOrderStatus } from "../lib/orders";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function checkAuth(req: IncomingMessage): boolean {
  return req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
