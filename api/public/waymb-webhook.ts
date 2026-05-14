import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await parseBody(req);
    console.log("[WayMB Webhook]", JSON.stringify(body));

    // Acknowledge receipt immediately
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({ raw: data });
      }
    });
    req.on("error", reject);
  });
}
