const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "Panini WC26 <panini@confirmedorder.site>";
const SITE_URL = "https://www.albumpaninini.site";

export async function sendConfirmationEmail(order: {
  customer_name: string;
  customer_email: string;
  tracking_code: string;
  product_name: string;
  amount_eur: number;
  payment_method: string;
}): Promise<void> {
  const token = process.env.RESEND_API_KEY;
  if (!token) {
    console.error("[Email] RESEND_API_KEY not set");
    return;
  }

  const trackingUrl = `${SITE_URL}/rastreio?codigo=${order.tracking_code}`;
  const methodLabel = order.payment_method === "mbway" ? "MB WAY" : "Multibanco";
  const amountFormatted = `€${order.amount_eur.toFixed(2).replace(".", ",")}`;

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Confirmação de Compra</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#6b0f1a;padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Confirmação de Encomenda</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:900;">Compra Confirmada! 🎉</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 20px;font-size:16px;color:#333;">Olá <strong>${order.customer_name.split(" ")[0]}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
              O teu pagamento foi confirmado com sucesso! A tua encomenda do <strong>${order.product_name}</strong> está a ser preparada e receberás uma atualização quando for enviada.
            </p>

            <!-- Order details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#6b0f1a;text-transform:uppercase;letter-spacing:1px;">Detalhes da Encomenda</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#666;">Produto</td>
                    <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;text-align:right;">${order.product_name}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#666;">Valor</td>
                    <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;text-align:right;">${amountFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#666;">Método</td>
                    <td style="padding:6px 0;font-size:14px;color:#333;font-weight:600;text-align:right;">${methodLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0 0;font-size:14px;color:#666;border-top:1px solid #eee;margin-top:8px;">Código de rastreio</td>
                    <td style="padding:10px 0 0;font-size:15px;color:#6b0f1a;font-weight:900;text-align:right;letter-spacing:2px;border-top:1px solid #eee;">${order.tracking_code}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${trackingUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;">
                  📦 Acompanhar a minha encomenda
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#999;text-align:center;">
              Ou acede diretamente a:<br/>
              <a href="${trackingUrl}" style="color:#6b0f1a;">${trackingUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#3d0710;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:#ffffff;opacity:0.7;font-size:12px;">
              Kit Panini FIFA World Cup 2026 · albumpaninini.site<br/>
              Portes grátis · Produto original Panini
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: order.customer_email,
        subject: `✅ Encomenda confirmada — Código ${order.tracking_code}`,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Email] Resend error ${res.status}:`, text);
    } else {
      console.log(`[Email] Sent to ${order.customer_email} — tracking: ${order.tracking_code}`);
    }
  } catch (err) {
    console.error("[Email] fetch failed:", err);
  }
}
