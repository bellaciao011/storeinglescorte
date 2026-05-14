const UTMIFY_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

// UTMify dashboard is typically configured in BRL.
// We apply a fixed EUR→BRL conversion rate of 6 to get realistic BRL centavos.
// If your UTMify account is configured in EUR, set this to 1.
const EUR_TO_BRL = 6;

export function toCents(amountEur: number): number {
  return Math.round(amountEur * EUR_TO_BRL * 100);
}

export type UtmifyPaymentMethod = "pix" | "bank_transfer" | "credit_card" | "boleto" | "paypal" | "free_price";

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
  };
  commission: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
    currency?: string;
  };
  isTest?: boolean;
}

export async function sendToUtmify(order: UtmifyOrder): Promise<void> {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) return;

  try {
    await fetch(UTMIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify({ ...order, isTest: false }),
    });
  } catch {
    // non-blocking — never fail the payment flow because of analytics
  }
}

export function toUtcString(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export function mapPaymentMethod(method: string): UtmifyPaymentMethod {
  if (method === "mbway") return "pix";
  if (method === "multibanco") return "bank_transfer";
  return "pix";
}
