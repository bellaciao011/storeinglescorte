import type { IncomingMessage, ServerResponse } from "http";
import { sendToUtmify, toUtcString, toCents, mapPaymentMethod } from "../lib/utmify";
import { markOrderPaid, markEmailSent, markOrderRefused } from "../lib/orders";
import { sendConfirmationEmail } from "../lib/email";

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    // IMPORTANT: read body BEFORE sending response.
    // Vercel pre-parses JSON into req.body; fall back to stream for other runtimes.
    const body = (req.body !== undefined ? req.body : await parseBody(req)) as Record<string, any>;

    const rawStatus = (body.status ?? body.Status ?? body.payment_status ?? "").toLowerCase();
    const isPaid = rawStatus === "paid" || rawStatus === "success" || rawStatus === "completed" || rawStatus === "approved";

    console.log(`[Webhook] received status="${rawStatus}" isPaid=${isPaid} transactionID=${body.transactionID ?? body.transaction_id ?? body.id ?? "?"}`);

    if (!isPaid) {
      // Log full body for refused/expired events to capture reason
      const isRefused = rawStatus === "refused" || rawStatus === "rejected" || rawStatus === "failed" || rawStatus === "error" || rawStatus === "cancelled" || rawStatus === "expired";
      if (isRefused) {
        const transactionIdRef = body.transactionID ?? body.transaction_id ?? body.id ?? "?";
        const reason = body.reason ?? body.failure_reason ?? body.error ?? body.description ?? body.message ?? null;
        console.log(`[Webhook] REFUSED transactionID=${transactionIdRef} reason="${reason}" fullBody=${JSON.stringify(body)}`);
        try {
          await markOrderRefused(String(transactionIdRef), reason ? String(reason) : null);
        } catch (e) {
          console.error("[Webhook] markOrderRefused error:", e);
        }
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ received: true }));
      return;
    }

    const transactionId = body.transactionID ?? body.transaction_id ?? body.id ?? `wh-${Date.now()}`;
    const amountEur = Number(body.amount ?? body.value ?? 0);
    const method = (body.method ?? body.payment_method ?? "mbway").toLowerCase();
    const payer = body.payer ?? body.customer ?? {};
    const now = toUtcString(new Date());
    const totalCents = toCents(amountEur);

    // Send to UTMify
    await sendToUtmify({
      orderId: String(transactionId),
      platform: "Front",
      paymentMethod: mapPaymentMethod(method, "paid"),
      status: "paid",
      createdAt: now,
      approvedDate: now,
      refundedAt: null,
      customer: {
        name: payer.name ?? "",
        email: payer.email ?? "",
        phone: payer.phone ?? null,
        document: payer.document ?? null,
        country: "PT",
        ip: payer.ip ?? "0.0.0.0",
      },
      products: [
        {
          id: "kit-panini",
          name: "Kit Panini FIFA WC26",
          planId: null,
          planName: null,
          quantity: 1,
          priceInCents: totalCents,
        },
      ],
      trackingParameters: {
        src: body.src ?? null,
        sck: body.sck ?? null,
        utm_source: body.utm_source ?? null,
        utm_campaign: body.utm_campaign ?? null,
        utm_medium: body.utm_medium ?? null,
        utm_content: body.utm_content ?? null,
        utm_term: body.utm_term ?? null,
      },
      commission: {
        totalPriceInCents: totalCents,
        gatewayFeeInCents: Math.round(totalCents * 0.35),
        userCommissionInCents: Math.round(totalCents * 0.65),
      },
    });

    // Mark order as paid in DB and send confirmation email
    try {
      const paid = await markOrderPaid(String(transactionId));

      if (paid && paid.customer_email) {
        await sendConfirmationEmail({
          customer_name: paid.customer_name,
          customer_email: paid.customer_email,
          tracking_code: paid.tracking_code,
          product_name: paid.product_name,
          amount_eur: Number(paid.amount_eur),
          payment_method: method,
        });
        await markEmailSent(String(transactionId));
      } else if (!paid) {
        console.log(`[Webhook] Order ${transactionId} not found in DB — may have been created before DB setup`);
      }
    } catch (dbErr) {
      console.error("[Webhook] DB/email error:", dbErr);
    }

    // Respond AFTER all operations complete — Vercel kills the function after res.end()
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true }));

  } catch (err) {
    console.error("[Webhook] error:", err);
    // Always return 200 to WayMB — never let them retry due to our internal errors
    if (!res.headersSent) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ received: true }));
    }
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
