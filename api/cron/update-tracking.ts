import type { IncomingMessage, ServerResponse } from "http";
import { query } from "../lib/db";
import { MILESTONES, getMilestoneForDay } from "../lib/milestones";
import { sendStatusUpdateEmail } from "../lib/email";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Vercel automatically sends Authorization: Bearer <CRON_SECRET> for cron jobs
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers["authorization"];
    if (auth !== `Bearer ${cronSecret}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const { rows } = await query<{
      id: string;
      tracking_code: string;
      customer_name: string;
      customer_email: string;
      product_name: string;
      amount_eur: string;
      order_status: string;
      paid_at: string;
      status_emails_sent: string;
    }>(
      `SELECT id, tracking_code, customer_name, customer_email, product_name,
              amount_eur, order_status, paid_at, status_emails_sent
       FROM panini_orders
       WHERE status = 'paid' AND paid_at IS NOT NULL`
    );

    const now = Date.now();
    const results: { tracking_code: string; action: string }[] = [];

    for (const order of rows) {
      const paidAt = new Date(order.paid_at).getTime();
      const daysSincePaid = Math.floor((now - paidAt) / (1000 * 60 * 60 * 24));
      const milestone = getMilestoneForDay(daysSincePaid);

      if (!milestone) continue;

      const sentList = (order.status_emails_sent ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const alreadySent = sentList.includes(milestone.status);

      // Update order_status if it changed
      if (order.order_status !== milestone.status) {
        await query(
          `UPDATE panini_orders SET order_status = $1, updated_at = NOW() WHERE id = $2`,
          [milestone.status, order.id]
        );
        results.push({ tracking_code: order.tracking_code, action: `status → ${milestone.status}` });
      }

      // Send email if not yet sent for this milestone
      if (!alreadySent && order.customer_email) {
        await sendStatusUpdateEmail({
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          tracking_code: order.tracking_code,
          product_name: order.product_name,
          amount_mxn: Number(order.amount_eur),
          milestone,
        }).catch((e) => console.error(`[Cron] email error for ${order.tracking_code}:`, e));

        const newSent = [...sentList, milestone.status].join(",");
        await query(
          `UPDATE panini_orders SET status_emails_sent = $1, updated_at = NOW() WHERE id = $2`,
          [newSent, order.id]
        );
        results.push({ tracking_code: order.tracking_code, action: `email → ${milestone.status}` });
      }
    }

    console.log(`[Cron] update-tracking done — ${rows.length} orders checked, ${results.length} actions`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, checked: rows.length, actions: results }));
  } catch (err) {
    console.error("[Cron] error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal error" }));
  }
}

// Required by Next.js/Vercel for raw body (not needed here but keeps signature correct)
export const config = { api: { bodyParser: false } };
