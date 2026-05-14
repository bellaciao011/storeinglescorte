import { getDb } from "./db";

export interface Order {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  customer_address: string | null;
  product_name: string;
  amount_eur: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  paid_at: string | null;
  email_sent: boolean;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  src: string | null;
  sck: string | null;
  created_at: string;
  updated_at: string;
}

export function generateTrackingCode(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let code = "PAN";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createOrder(order: {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  customer_address: string | null;
  product_name: string;
  amount_eur: number;
  payment_method: string;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  src?: string | null;
  sck?: string | null;
}): Promise<void> {
  const db = getDb();
  await db.query(
    `INSERT INTO panini_orders (
      id, tracking_code, customer_name, customer_email, customer_phone,
      customer_document, customer_address, product_name, amount_eur,
      payment_method, payment_status, order_status, email_sent,
      utm_source, utm_campaign, utm_medium, utm_content, utm_term, src, sck
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'waiting_payment','preparing',false,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT (id) DO NOTHING`,
    [
      order.id, order.tracking_code, order.customer_name, order.customer_email,
      order.customer_phone, order.customer_document, order.customer_address,
      order.product_name, order.amount_eur, order.payment_method,
      order.utm_source ?? null, order.utm_campaign ?? null, order.utm_medium ?? null,
      order.utm_content ?? null, order.utm_term ?? null,
      order.src ?? null, order.sck ?? null,
    ]
  );
}

export async function markOrderPaid(id: string): Promise<string | null> {
  const db = getDb();
  const res = await db.query(
    `UPDATE panini_orders
     SET payment_status = 'paid', order_status = 'preparing', paid_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING tracking_code, customer_name, customer_email, product_name, amount_eur`,
    [id]
  );
  if (res.rowCount && res.rowCount > 0) return res.rows[0].tracking_code;
  return null;
}

export async function markEmailSent(id: string): Promise<void> {
  const db = getDb();
  await db.query(
    `UPDATE panini_orders SET email_sent = true, updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function getOrderByTrackingCode(code: string): Promise<Order | null> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM panini_orders WHERE tracking_code = $1`,
    [code.toUpperCase()]
  );
  return res.rows[0] ?? null;
}

export async function getAllOrders(): Promise<Order[]> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM panini_orders ORDER BY created_at DESC`
  );
  return res.rows;
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const db = getDb();
  await db.query(
    `UPDATE panini_orders SET order_status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id]
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = getDb();
  const res = await db.query(`SELECT * FROM panini_orders WHERE id = $1`, [id]);
  return res.rows[0] ?? null;
}
