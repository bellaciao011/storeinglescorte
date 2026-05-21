import { query } from "./db";

export interface Order {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_district: string | null;
  product_name: string;
  amount_eur: number;
  status: string;
  order_status: string;
  paid_at: string | null;
  confirmation_email_sent_at: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
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
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_district: string | null;
  product_name: string;
  amount_eur: number;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO panini_orders (
      id, tracking_code, customer_name, customer_email, customer_phone,
      customer_document, shipping_address, shipping_city, shipping_postal_code, shipping_district,
      product_name, amount_eur,
      status, order_status,
      utm_source, utm_campaign, utm_medium, utm_content, utm_term
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'waiting_payment','preparing',$13,$14,$15,$16,$17)
    ON CONFLICT (id) DO NOTHING`,
    [
      order.id, order.tracking_code, order.customer_name, order.customer_email,
      order.customer_phone, order.customer_document,
      order.shipping_address, order.shipping_city, order.shipping_postal_code, order.shipping_district,
      order.product_name, order.amount_eur,
      order.utm_source ?? null, order.utm_campaign ?? null, order.utm_medium ?? null,
      order.utm_content ?? null, order.utm_term ?? null,
    ]
  );
}

export async function markOrderPaid(id: string): Promise<{ tracking_code: string; customer_name: string; customer_email: string; product_name: string; amount_eur: number } | null> {
  const res = await query<{ tracking_code: string; customer_name: string; customer_email: string; product_name: string; amount_eur: number }>(
    `UPDATE panini_orders
     SET status = 'paid', order_status = 'preparing', paid_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING tracking_code, customer_name, customer_email, product_name, amount_eur`,
    [id]
  );
  if (res.rowCount && res.rowCount > 0) return res.rows[0];
  return null;
}

export async function markOrderRefused(id: string, _reason?: string | null): Promise<void> {
  await query(
    `UPDATE panini_orders SET status = 'refused', updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function markEmailSent(id: string): Promise<void> {
  await query(
    `UPDATE panini_orders SET confirmation_email_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function getOrderByTrackingCode(code: string): Promise<Order | null> {
  const res = await query(
    `SELECT * FROM panini_orders WHERE tracking_code = $1`,
    [code.toUpperCase()]
  );
  return (res.rows[0] as unknown as Order) ?? null;
}

export async function getAllOrders(): Promise<Order[]> {
  const res = await query(
    `SELECT * FROM panini_orders ORDER BY created_at DESC`
  );
  return res.rows as unknown as Order[];
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await query(
    `UPDATE panini_orders SET order_status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id]
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const res = await query(
    `SELECT * FROM panini_orders WHERE id = $1`,
    [id]
  );
  return (res.rows[0] as unknown as Order) ?? null;
}
