import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const WAYMB_BASE = "https://api.waymb.com";

function getConfig() {
  const clientId = process.env.WAYMB_CLIENT_ID;
  const clientSecret = process.env.WAYMB_CLIENT_SECRET;
  const accountEmail = process.env.WAYMB_ACCOUNT_EMAIL;

  if (!clientId || !clientSecret || !accountEmail) {
    throw new Error("WayMB credentials not configured");
  }

  return { clientId, clientSecret, accountEmail };
}

router.post("/payment/create", async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    const { amount, method, payer, paymentDescription } = req.body as {
      amount: number;
      method: "mbway" | "multibanco";
      payer: { email: string; name: string; document: string; phone: string };
      paymentDescription?: string;
    };

    if (!amount || !method || !payer) {
      res.status(400).json({ error: "Missing required fields: amount, method, payer" });
      return;
    }

    const payload = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      account_email: config.accountEmail,
      amount,
      method,
      currency: "EUR",
      payer,
      paymentDescription: paymentDescription ?? "Kit Panini FIFA World Cup 2026",
    };

    const response = await fetch(`${WAYMB_BASE}/transactions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const rawBody = await response.text();

    if (!response.ok) {
      const details = isJson ? JSON.parse(rawBody) : rawBody;
      req.log.error({ status: response.status, details }, "WayMB create transaction failed");
      res.status(502).json({ error: "Erro na plataforma de pagamento. Tenta novamente em instantes.", details });
      return;
    }

    const data = isJson ? JSON.parse(rawBody) : { raw: rawBody };
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "payment/create error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/payment/upsell", async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    const { amount, method, shippingOption, phone, payer } = req.body as {
      amount: number;
      method: "mbway" | "multibanco";
      shippingOption: string;
      phone: string;
      payer: { name: string; email: string; document: string; phone: string };
    };

    if (!amount || !method || !payer) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const payerPhone = method === "mbway" ? phone : payer.phone;

    const payload = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      account_email: config.accountEmail,
      amount,
      method,
      currency: "EUR",
      payer: { ...payer, phone: payerPhone },
      paymentDescription: `Frete — ${shippingOption ?? "Upsell"}`.slice(0, 50),
    };

    const response = await fetch(`${WAYMB_BASE}/transactions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const rawBody = await response.text();

    if (!response.ok) {
      const details = isJson ? JSON.parse(rawBody) : rawBody;
      req.log.error({ status: response.status, details }, "WayMB upsell transaction failed");
      res.status(502).json({ error: "Erro na plataforma de pagamento. Tenta novamente.", details });
      return;
    }

    const data = isJson ? JSON.parse(rawBody) : { raw: rawBody };
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "payment/upsell error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/payment/upsell2", async (req: Request, res: Response) => {
  try {
    const config = getConfig();
    const { amount, method, phone, payer } = req.body as {
      amount: number;
      method: "mbway" | "multibanco";
      phone: string;
      payer: { name: string; email: string; document: string; phone: string };
    };

    if (!amount || !method || !payer) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const payerPhone = method === "mbway" ? phone : payer.phone;

    const payload = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      account_email: config.accountEmail,
      amount,
      method,
      currency: "EUR",
      payer: { ...payer, phone: payerPhone },
      paymentDescription: "Encargos emissão fatura — Panini WC26",
    };

    const response = await fetch(`${WAYMB_BASE}/transactions/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const rawBody = await response.text();

    if (!response.ok) {
      const details = isJson ? JSON.parse(rawBody) : rawBody;
      req.log.error({ status: response.status, details }, "WayMB upsell2 transaction failed");
      res.status(502).json({ error: "Erro na plataforma de pagamento. Tenta novamente.", details });
      return;
    }

    const data = isJson ? JSON.parse(rawBody) : { raw: rawBody };
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "payment/upsell2 error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/payment/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.body as { id: string };

    if (!id) {
      res.status(400).json({ error: "Missing transaction id" });
      return;
    }

    const response = await fetch(`${WAYMB_BASE}/transactions/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const rawBody = await response.text();

    if (!response.ok) {
      const details = isJson ? JSON.parse(rawBody) : rawBody;
      req.log.error({ status: response.status, details }, "WayMB transaction info failed");
      res.status(502).json({ error: "Erro ao consultar o estado do pagamento.", details });
      return;
    }

    const data = isJson ? JSON.parse(rawBody) : { raw: rawBody };
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "payment/status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
