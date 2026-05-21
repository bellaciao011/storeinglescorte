import { pgTable, text, uuid, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";

export const paniniOrdersTable = pgTable("panini_orders", {
  id: uuid("id").primaryKey(),
  stripePaymentIntentId: text("stripe_pi_id"),
  status: text("status").notNull().default("PENDING"),

  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerDocument: text("customer_document"),

  shippingAddress: text("shipping_address"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCity: text("shipping_city"),
  shippingDistrict: text("shipping_district"),

  productName: text("product_name"),
  kitId: text("kit_id"),
  quantity: integer("quantity"),
  amountEur: numeric("amount_eur", { precision: 10, scale: 2 }),
  items: jsonb("items"),
  orderType: text("order_type").default("main"),

  trackingCode: text("tracking_code"),
  orderStatus: text("order_status").default("preparing"),

  utmSource: text("utm_source"),
  utmCampaign: text("utm_campaign"),
  utmMedium: text("utm_medium"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),

  confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PaniniOrder = typeof paniniOrdersTable.$inferSelect;
export type InsertPaniniOrder = typeof paniniOrdersTable.$inferInsert;
