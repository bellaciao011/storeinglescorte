import type { IncomingMessage, ServerResponse } from "http";

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  if (req.method !== "POST") {
    res.writeHead(405); res.end(JSON.stringify({ error: "Method not allowed" })); return;
  }

  try {
    const body = await parseBody(req) as {
      nome?: string;
      encomenda?: string;
      email?: string;
      motivo?: string;
      opcao?: string;
    };

    const token = process.env.RESEND_API_KEY;
    if (token) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          from: "Suporte Panini <panini@confirmedorder.site>",
          to: "panini@confirmedorder.site",
          subject: `[Suporte] ${body.encomenda ?? "sem código"} — ${body.nome ?? "cliente"}`,
          html: `<p><b>Nome:</b> ${body.nome ?? "-"}</p>
                 <p><b>Encomenda:</b> ${body.encomenda ?? "-"}</p>
                 <p><b>Email:</b> ${body.email ?? "-"}</p>
                 <p><b>Motivo:</b> ${body.motivo ?? "-"}</p>
                 <p><b>Opção:</b> ${body.opcao ?? "-"}</p>`,
        }),
      }).catch(() => {});
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("[Support] error:", err);
    res.writeHead(500); res.end(JSON.stringify({ error: "Internal error" }));
  }
}
