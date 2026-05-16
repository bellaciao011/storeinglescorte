import type { Milestone } from "./milestones";

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
  const amountFormatted = `$${Number(order.amount_eur).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;
  const firstName = order.customer_name.split(" ")[0];

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Pedido confirmado</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Cabeçalho marca -->
      <tr><td style="background:#7B1C1C;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">FIFA World Cup 2026™</p>
        <p style="margin:0;font-size:22px;font-weight:900;color:#F5C518;letter-spacing:1px;font-family:Georgia,serif;">PANINI</p>
      </td></tr>

      <!-- Corpo principal -->
      <tr><td style="background:#ffffff;padding:0;border-radius:0 0 12px 12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);">

        <!-- Banner de éxito -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:#1a7a3c;padding:24px 32px;text-align:center;">
            <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 10px;line-height:52px;font-size:26px;color:#fff;">&#10003;</div>
            <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:800;">¡Pedido confirmado!</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Tu pago fue recibido con éxito</p>
          </td></tr>
        </table>

        <!-- Contenido -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:28px 32px;">

            <p style="margin:0 0 22px;font-size:15px;color:#374151;line-height:1.6;">
              Hola <strong>${firstName}</strong>,<br/>
              Tu pedido de <strong>${order.product_name}</strong> está siendo preparado y será enviado muy pronto a México.
            </p>

            <!-- Resumen -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr><td style="background:#7B1C1C;padding:12px 20px;">
                <span style="font-size:10px;font-weight:700;color:#F5C518;text-transform:uppercase;letter-spacing:1.5px;">Resumen del pedido</span>
              </td></tr>
              <tr><td style="padding:4px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Producto</td>
                    <td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${order.product_name}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Total pagado</td>
                    <td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:700;text-align:right;border-bottom:1px solid #f3f4f6;">${amountFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Método de pago</td>
                    <td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">Tarjeta de crédito / débito</td>
                  </tr>
                  <tr>
                    <td style="padding:13px 20px;font-size:13px;color:#6b7280;">Código de rastreo</td>
                    <td style="padding:13px 20px;text-align:right;">
                      <span style="font-size:17px;font-weight:900;color:#7B1C1C;letter-spacing:3px;font-family:monospace;">${order.tracking_code}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Botón CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td align="center">
                <a href="${trackingUrl}"
                   style="display:inline-block;background:#7B1C1C;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 38px;border-radius:8px;letter-spacing:0.3px;">
                  Rastrear mi pedido &rarr;
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;">
              O copia este enlace en tu navegador:<br/>
              <a href="${trackingUrl}" style="color:#7B1C1C;word-break:break-all;">${trackingUrl}</a>
            </p>

          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 16px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.9;">
          panini-mx.site &nbsp;·&nbsp; Envío gratis a todo México &nbsp;·&nbsp; Producto original Panini<br/>
          <span style="font-size:10px;">Recibiste este correo porque realizaste una compra en nuestro sitio.</span>
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
        subject: `¡Pedido confirmado! — Código ${order.tracking_code}`,
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

export async function sendStatusUpdateEmail(params: {
  customer_name: string;
  customer_email: string;
  tracking_code: string;
  product_name: string;
  amount_mxn: number;
  milestone: Milestone;
}): Promise<void> {
  const token = process.env.RESEND_API_KEY;
  if (!token) {
    console.error("[Email] RESEND_API_KEY not set");
    return;
  }

  const { customer_name, customer_email, tracking_code, product_name, amount_mxn, milestone } = params;
  const firstName = customer_name.split(" ")[0];
  const trackingUrl = `${SITE_URL}/rastreio?codigo=${tracking_code}`;
  const amountFormatted = `$${Number(amount_mxn).toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${milestone.label}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#7B1C1C;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">FIFA World Cup 2026™</p>
        <p style="margin:0;font-size:22px;font-weight:900;color:#F5C518;letter-spacing:1px;font-family:Georgia,serif;">PANINI</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:0;border-radius:0 0 12px 12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);">

        <!-- Status banner -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="background:#1a4fa0;padding:22px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">Actualización de pedido</p>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">${milestone.label}</h1>
          </td></tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:28px 32px;">

            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.6;">
              Hola <strong>${firstName}</strong>,<br/>
              ${milestone.desc}
            </p>

            <!-- Order summary -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tr><td style="background:#7B1C1C;padding:12px 20px;">
                <span style="font-size:10px;font-weight:700;color:#F5C518;text-transform:uppercase;letter-spacing:1.5px;">Tu pedido</span>
              </td></tr>
              <tr><td style="padding:4px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Producto</td>
                    <td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${product_name}</td>
                  </tr>
                  <tr>
                    <td style="padding:11px 20px;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Total pagado</td>
                    <td style="padding:11px 20px;font-size:13px;color:#111827;font-weight:700;text-align:right;border-bottom:1px solid #f3f4f6;">${amountFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding:13px 20px;font-size:13px;color:#6b7280;">Código de rastreo</td>
                    <td style="padding:13px 20px;text-align:right;">
                      <span style="font-size:17px;font-weight:900;color:#7B1C1C;letter-spacing:3px;font-family:monospace;">${tracking_code}</span>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr><td align="center">
                <a href="${trackingUrl}"
                   style="display:inline-block;background:#7B1C1C;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 38px;border-radius:8px;letter-spacing:0.3px;">
                  Ver estado del pedido &rarr;
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;">
              O copia este enlace:<br/>
              <a href="${trackingUrl}" style="color:#7B1C1C;word-break:break-all;">${trackingUrl}</a>
            </p>

          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 16px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.9;">
          panini-mx.site &nbsp;·&nbsp; Envío gratis a todo México &nbsp;·&nbsp; Producto original Panini<br/>
          <span style="font-size:10px;">Recibiste este correo porque realizaste una compra en nuestro sitio.</span>
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        from: FROM,
        to: customer_email,
        subject: milestone.emailSubject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Email] Resend status update error ${res.status}:`, text);
    } else {
      console.log(`[Email] Status update enviado para ${customer_email} — ${milestone.status} — ${tracking_code}`);
    }
  } catch (err) {
    console.error("[Email] status update fetch failed:", err);
  }
}
