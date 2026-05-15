const UTMIFY_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

// EUR→BRL fixed rate (UTMify works in BRL cents)
// 30 EUR → Math.round(30 * 6 * 100) = 18000 cents = R$180
const EUR_TO_BRL = 6;

export function toCents(amountEur: number): number {
  return Math.round(amountEur * EUR_TO_BRL * 100);
}

export type UtmifyPaymentMethod = "pix" | "bank_transfer" | "billet" | "credit_card" | "paypal" | "free_price";

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
    currency: "EUR",
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
      console.log(`[UTMify] OK — order ${order.orderId} status=${order.status} response=${text}`);
    }
  } catch (err) {
    console.error("[UTMify] fetch failed:", err);
  }
}

export function toUtcString(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

// waiting_payment: mbway→pix, multibanco→bank_transfer
// paid:            mbway→pix, multibanco→billet  (matches reference project)
export function mapPaymentMethod(
  method: string,
  status: "waiting_payment" | "paid" = "waiting_payment"
): UtmifyPaymentMethod {
  if (method === "mbway") return "pix";
  if (method === "multibanco") return status === "paid" ? "billet" : "bank_transfer";
  return "pix";
}
