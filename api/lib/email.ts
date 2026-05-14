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
  const firstName = order.customer_name.split(" ")[0];

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Encomenda confirmada</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Logo / brand -->
      <tr><td style="padding-bottom:24px;text-align:center;">
        <span style="font-size:13px;color:#999;letter-spacing:1px;text-transform:uppercase;">Kit Panini FIFA World Cup 2026</span>
      </td></tr>

      <!-- Main card -->
      <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Green success banner -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:#16a34a;padding:28px 32px;text-align:center;">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;line-height:48px;font-size:24px;">✓</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Encomenda confirmada!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">O teu pagamento foi recebido com sucesso</p>
          </td></tr>
        </table>

        <!-- Body -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:32px;">

            <p style="margin:0 0 24px;font-size:15px;color:#374151;">Olá <strong>${firstName}</strong>,<br/><br/>
            A tua encomenda do <strong>${order.product_name}</strong> está a ser preparada e será enviada em breve.</p>

            <!-- Order summary box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr><td style="background:#f9fafb;padding:14px 20px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Resumo da encomenda</span>
              </td></tr>
              <tr><td style="padding:4px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Produto</td>
                    <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${order.product_name}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Valor pago</td>
                    <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${amountFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Método</td>
                    <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${methodLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;font-size:14px;color:#6b7280;">Código de rastreio</td>
                    <td style="padding:14px 20px;text-align:right;">
                      <span style="font-size:16px;font-weight:800;color:#16a34a;letter-spacing:3px;font-family:monospace;">${order.tracking_code}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="${trackingUrl}"
                   style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:15px 36px;border-radius:10px;letter-spacing:-0.2px;">
                  Acompanhar a minha encomenda &rarr;
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
              Ou copia este link no browser:<br/>
              <a href="${trackingUrl}" style="color:#16a34a;word-break:break-all;">${trackingUrl}</a>
            </p>

          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 16px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.8;">
          albumpaninini.site &nbsp;·&nbsp; Portes grátis para Portugal &nbsp;·&nbsp; Produto original Panini<br/>
          <span style="font-size:11px;">Recebeste este email porque efectuaste uma compra no nosso site.</span>
        </p>
      </td></tr>

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
        subject: `Encomenda confirmada — Código ${order.tracking_code}`,
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
