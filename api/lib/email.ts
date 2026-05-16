const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "Panini WC26 <panini@confirmedorder.site>";
const SITE_URL = "https://panini-mx.site";

export async function sendConfirmationEmail(order: {
  customer_name: string;
  customer_email: string;
  tracking_code: string;
  product_name: string;
  amount_eur: number; // stores MXN amount despite field name
  payment_method: string;
}): Promise<void> {
  const token = process.env.RESEND_API_KEY;
  if (!token) {
    console.error("[Email] RESEND_API_KEY not set");
    return;
  }

  const trackingUrl = `${SITE_URL}/rastreio?codigo=${order.tracking_code}`;
  const amountFormatted = `$${order.amount_eur.toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
  const firstName = order.customer_name.split(" ")[0];

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Pedido confirmado</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Marca -->
      <tr><td style="padding-bottom:24px;text-align:center;">
        <span style="font-size:13px;color:#999;letter-spacing:1px;text-transform:uppercase;">Kit Panini FIFA World Cup 2026</span>
      </td></tr>

      <!-- Tarjeta principal -->
      <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Banner verde de éxito -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:#16a34a;padding:28px 32px;text-align:center;">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;line-height:48px;font-size:24px;">✓</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">¡Pedido confirmado!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Tu pago fue recibido con éxito</p>
          </td></tr>
        </table>

        <!-- Cuerpo -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:32px;">

            <p style="margin:0 0 24px;font-size:15px;color:#374151;">Hola <strong>${firstName}</strong>,<br/><br/>
            Tu pedido de <strong>${order.product_name}</strong> está siendo preparado y será enviado muy pronto.</p>

            <!-- Resumen del pedido -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:28px;">
              <tr><td style="background:#f9fafb;padding:14px 20px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Resumen del pedido</span>
              </td></tr>
              <tr><td style="padding:4px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Producto</td>
                    <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${order.product_name}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Total pagado</td>
                    <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${amountFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 20px;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Método de pago</td>
                    <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">Tarjeta de crédito / débito</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 20px;font-size:14px;color:#6b7280;">Código de rastreo</td>
                    <td style="padding:14px 20px;text-align:right;">
                      <span style="font-size:16px;font-weight:800;color:#16a34a;letter-spacing:3px;font-family:monospace;">${order.tracking_code}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Botón CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="${trackingUrl}"
                   style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:15px 36px;border-radius:10px;letter-spacing:-0.2px;">
                  Rastrear mi pedido &rarr;
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
              O copia este enlace en tu navegador:<br/>
              <a href="${trackingUrl}" style="color:#16a34a;word-break:break-all;">${trackingUrl}</a>
            </p>

          </td></tr>
        </table>

      </td></tr>

      <!-- Pie de página -->
      <tr><td style="padding:24px 16px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.8;">
          panini-mx.site &nbsp;·&nbsp; Envío gratis a todo México &nbsp;·&nbsp; Producto original Panini<br/>
          <span style="font-size:11px;">Recibiste este correo porque realizaste una compra en nuestro sitio.</span>
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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: order.customer_email,
        subject: `Pedido confirmado — Código ${order.tracking_code}`,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Email] Resend error ${res.status}:`, text);
    } else {
      console.log(
        `[Email] Enviado para ${order.customer_email} — tracking: ${order.tracking_code}`
      );
    }
  } catch (err) {
    console.error("[Email] fetch failed:", err);
  }
}
