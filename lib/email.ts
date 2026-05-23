import { Resend } from "resend";
import { formatINR } from "./utils";
import type { Order, OrderItem } from "./types";

/**
 * Send the order confirmation email via Resend.
 * Failures are logged but never block the checkout response — the order is
 * already paid and recorded in the database at this point.
 */
export async function sendOrderConfirmation(
  to: string,
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Kickd <onboarding@resend.dev>";
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping confirmation email.");
    return;
  }

  const resend = new Resend(apiKey);
  const shortId = order.id.slice(0, 8).toUpperCase();

  const rows = items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            ${i.product_name} <span style="color:#737373;">· Size ${i.size} · Qty ${i.quantity}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">
            ${formatINR(i.unit_price * i.quantity)}
          </td>
        </tr>`
    )
    .join("");

  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0a0a0a;">
    <div style="background:#E11D2A;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:22px;letter-spacing:-0.02em;">Kickd</h1>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
      <h2 style="margin:0 0 4px;">Thanks for your order!</h2>
      <p style="color:#525252;margin:0 0 20px;">Order <strong>#${shortId}</strong> is confirmed and being prepared.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
        <tr>
          <td style="padding:14px 0 0;font-weight:700;">Total paid</td>
          <td style="padding:14px 0 0;text-align:right;font-weight:700;">${formatINR(order.total_amount)}</td>
        </tr>
      </table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#525252;">
        <strong style="color:#0a0a0a;">Shipping to</strong><br/>
        ${order.shipping_name}<br/>
        ${order.shipping_line1}${order.shipping_line2 ? ", " + order.shipping_line2 : ""}<br/>
        ${order.shipping_city}, ${order.shipping_state} ${order.shipping_pincode}<br/>
        ${order.shipping_phone}
      </div>
    </div>
  </div>`;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Kickd — Order #${shortId} confirmed`,
      html,
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }
}
