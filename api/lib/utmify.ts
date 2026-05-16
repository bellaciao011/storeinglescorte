const UTMIFY_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

// MXN → BRL approximate rate (UTMify works in BRL cents)
// 1 MXN ≈ 0.30 BRL
// Ex: $1,199 MXN → Math.round(1199 * 0.30 * 100) = 35,970 cents = R$359.70
const MXN_TO_BRL = 0.30;

export function toCents(amountMxn: number): number {
  return Math.round(amountMxn * MXN_TO_BRL * 100);
}

export type UtmifyPaymentMethod =
  | "pix"
  | "bank_transfer"
  | "billet"
  | "credit_card"
  | "paypal"
  | "free_price";

export interface UtmifyOrder {
  orderId: string;
  platform: string;
  paymentMethod: UtmifyPaymentMethod;
  status: "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    document: string | null;
    country?: string;
    ip?: string;
  };
  products: Array<{
    id: string;
    name: string;
    planId: string | null;
    planName: string | null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters: {
    src: string | null;
    sck: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
    utm_content: string | null;
    utm_term: string | null;
    fbclid?: string | null;
    gclid?: string | null;
    ttclid?: string | null;
  };
  commission: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
  };
}

export async function sendToUtmify(order: UtmifyOrder): Promise<void> {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) {
    console.error("[UTMify] UTMIFY_API_TOKEN not set — skipping");
    return;
  }

  const payload = {
    ...order,
    currency: "MXN",
    isTest: false,
  };

  try {
    const res = await fetch(UTMIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[UTMify] API error ${res.status}:`, text);
    } else {
      console.log(
        `[UTMify] OK — order ${order.orderId} status=${order.status} response=${text}`
      );
    }
  } catch (err) {
    console.error("[UTMify] fetch failed:", err);
  }
}

export function toUtcString(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export function mapPaymentMethod(
  method: string,
  _status?: string
): UtmifyPaymentMethod {
  if (method === "stripe" || method === "credit_card" || method === "card")
    return "credit_card";
  if (method === "pix") return "pix";
  if (method === "bank_transfer") return "bank_transfer";
  return "credit_card";
}
