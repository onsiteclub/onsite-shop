import { Resend } from 'resend';

// ============================================
// TYPES
// ============================================

interface OrderEmailData {
  orderNumber: string;
  items: Array<{
    name: string;
    sku?: string;
    design?: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress?: {
    name?: string;
    street?: string;
    apartment?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  } | null;
  customerEmail?: string;
  stripeSessionId?: string;
}

// ============================================
// RESEND CLIENT
// ============================================

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY not configured');
  }
  return new Resend(key);
}

const FROM_EMAIL = 'OnSite Club <contact@onsiteclub.ca>';

// ============================================
// SEND FUNCTIONS
// ============================================

export async function sendOrderConfirmationToCustomer(
  order: OrderEmailData,
  customerEmail: string
) {
  const resend = getResend();

  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `OnSite Shop — Order ${order.orderNumber} confirmed!`,
    html: buildCustomerEmailHtml(order),
  });

  console.log(`[EMAIL] Confirmation sent to ${customerEmail}`);
}

export async function sendNewOrderToAdmin(order: OrderEmailData) {
  const resend = getResend();
  const adminEmail = process.env.SHOP_ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn('[EMAIL] SHOP_ADMIN_EMAIL not configured, skipping admin notification');
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `New sale! Order ${order.orderNumber} — CA$${order.total.toFixed(2)}`,
    html: buildAdminEmailHtml(order),
  });

  console.log(`[EMAIL] Admin notification sent to ${adminEmail}`);
}

export async function sendShippedNotification(
  orderNumber: string,
  trackingCode: string,
  customerEmail: string
) {
  const resend = getResend();

  await resend.emails.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject: `OnSite Shop — Order ${orderNumber} has been shipped!`,
    html: buildShippedEmailHtml(orderNumber, trackingCode),
  });

  console.log(`[EMAIL] Shipped notification sent to ${customerEmail}`);
}

// ============================================
// HTML TEMPLATES
// ============================================

function buildItemsTableHtml(items: OrderEmailData['items']): string {
  return items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
        <strong style="color: #1B2B27;">${item.name}</strong>
        ${item.size || item.color ? `<br><span style="color: #6B7280; font-size: 13px;">${[item.color, item.size].filter(Boolean).join(' — ')}</span>` : ''}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: center; color: #6B7280;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #1B2B27;">
        CA$${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
}

function buildAdminItemsTableHtml(items: OrderEmailData['items']): string {
  return items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
        <strong style="color: #1B2B27;">${item.name}</strong>
        ${item.sku ? `<br><code style="font-size: 12px; background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${item.sku}</code>` : ''}
        ${item.design ? `<br><span style="color: #6B7280; font-size: 12px;">Design: ${item.design}</span>` : ''}
        <br><span style="color: #6B7280; font-size: 13px;">${[item.color, item.size].filter(Boolean).join(' — ')}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: center; color: #6B7280;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #1B2B27;">
        CA$${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');
}

function buildAddressHtml(address: OrderEmailData['shippingAddress']): string {
  if (!address) return '<p style="color: #6B7280;">Not provided</p>';
  return `
    <p style="color: #1B2B27; margin: 0; line-height: 1.6;">
      ${address.name ? `<strong>${address.name}</strong><br>` : ''}
      ${address.street || ''}
      ${address.apartment ? `, ${address.apartment}` : ''}<br>
      ${address.city || ''}, ${address.province || ''}<br>
      ${address.postal_code || ''}, ${address.country || 'Canada'}
    </p>
  `;
}

function buildCustomerEmailHtml(order: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #F5F3EF; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://shop.onsiteclub.ca/assets/logo-onsite-club.png" alt="OnSite Club" style="height: 48px; width: auto; margin-bottom: 8px;" />
      <p style="color: #6B7280; font-size: 13px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">Built For Those Who Build</p>
    </div>

    <!-- Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <!-- Success -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 56px; height: 56px; background: #DEF7EC; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">
          &#10003;
        </div>
        <h2 style="color: #1B2B27; font-size: 20px; margin: 16px 0 4px;">Order Confirmed!</h2>
        <p style="color: #6B7280; font-size: 14px; margin: 0;">Order <strong>${order.orderNumber}</strong></p>
      </div>

      <!-- Items -->
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid #1B2B27;">
            <th style="text-align: left; padding: 8px 0; color: #1B2B27;">Product</th>
            <th style="text-align: center; padding: 8px 0; color: #1B2B27;">Qty</th>
            <th style="text-align: right; padding: 8px 0; color: #1B2B27;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${buildItemsTableHtml(order.items)}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="border-top: 2px solid #1B2B27; padding-top: 16px; font-size: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6B7280;">Subtotal</span>
          <span style="color: #1B2B27;">CA$${order.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6B7280;">Shipping</span>
          <span style="color: ${order.shipping === 0 ? '#059669' : '#1B2B27'};">${order.shipping === 0 ? 'FREE' : `CA$${order.shipping.toFixed(2)}`}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 12px; padding-top: 12px; border-top: 1px solid #E5E7EB;">
          <span style="color: #1B2B27;">Total</span>
          <span style="color: #1B2B27;">CA$${order.total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Shipping Address -->
      ${order.shippingAddress ? `
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
        <h3 style="color: #1B2B27; font-size: 14px; margin: 0 0 8px;">Shipping Address</h3>
        ${buildAddressHtml(order.shippingAddress)}
      </div>
      ` : ''}

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://shop.onsiteclub.ca" style="display: inline-block; background: #1B2B27; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
        Continue Shopping
      </a>
      <div style="margin-top: 16px;">
        <a href="https://shop.onsiteclub.ca/review/${order.orderNumber}" style="display: inline-block; background: #B8860B; color: #1B2B27; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          ★ Leave a Review
        </a>
      </div>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
        OnSite Club — Construction Community in Canada
      </p>
    </div>

  </div>
</body>
</html>`;
}

function buildAdminEmailHtml(order: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #F5F3EF; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="background: #1B2B27; border-radius: 16px 16px 0 0; padding: 24px; text-align: center;">
      <img src="https://shop.onsiteclub.ca/assets/logo-onsite-club.png" alt="OnSite Club" style="height: 40px; width: auto; margin-bottom: 12px; filter: brightness(10);" />
      <h1 style="color: #B8860B; font-size: 20px; margin: 0;">New Sale!</h1>
      <p style="color: white; font-size: 28px; font-weight: bold; margin: 8px 0 0;">CA$${order.total.toFixed(2)}</p>
    </div>

    <!-- Card -->
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <!-- Order Info -->
      <div style="margin-bottom: 24px; font-size: 14px;">
        <p style="margin: 4px 0;"><strong>Order:</strong> ${order.orderNumber}</p>
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${order.customerEmail || 'N/A'}</p>
        ${order.stripeSessionId ? `<p style="margin: 4px 0;"><strong>Stripe Session:</strong> <code style="font-size: 11px; background: #F3F4F6; padding: 2px 6px; border-radius: 4px;">${order.stripeSessionId}</code></p>` : ''}
      </div>

      <!-- Items -->
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 2px solid #1B2B27;">
            <th style="text-align: left; padding: 8px 0;">Product / SKU</th>
            <th style="text-align: center; padding: 8px 0;">Qty</th>
            <th style="text-align: right; padding: 8px 0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${buildAdminItemsTableHtml(order.items)}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="font-size: 14px; padding: 16px; background: #F9FAFB; border-radius: 8px;">
        <div style="margin-bottom: 4px;"><span style="color: #6B7280;">Subtotal:</span> CA$${order.subtotal.toFixed(2)}</div>
        <div style="margin-bottom: 4px;"><span style="color: #6B7280;">Shipping:</span> CA$${order.shipping.toFixed(2)}</div>
        <div style="font-weight: bold; font-size: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">Total: CA$${order.total.toFixed(2)}</div>
      </div>

      <!-- Shipping Address -->
      ${order.shippingAddress ? `
      <div style="margin-top: 24px;">
        <h3 style="font-size: 14px; margin: 0 0 8px;">Ship to:</h3>
        ${buildAddressHtml(order.shippingAddress)}
      </div>
      ` : ''}

      <!-- Action -->
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://shop.onsiteclub.ca/admin/orders" style="display: inline-block; background: #B8860B; color: #1B2B27; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
          View in Admin
        </a>
      </div>

    </div>

  </div>
</body>
</html>`;
}

function buildShippedEmailHtml(orderNumber: string, trackingCode: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #F5F3EF; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://shop.onsiteclub.ca/assets/logo-onsite-club.png" alt="OnSite Club" style="height: 48px; width: auto; margin-bottom: 8px;" />
      <p style="color: #6B7280; font-size: 13px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">Built For Those Who Build</p>
    </div>

    <!-- Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1B2B27; font-size: 20px; margin: 16px 0 4px;">Your Order Has Shipped!</h2>
        <p style="color: #6B7280; font-size: 14px; margin: 0;">Order <strong>${orderNumber}</strong></p>
      </div>

      <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #0369A1; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
        <p style="color: #1B2B27; font-size: 20px; font-weight: bold; margin: 0; font-family: monospace; letter-spacing: 2px;">${trackingCode}</p>
      </div>

      <div style="text-align: center;">
        <a href="https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${trackingCode}" style="display: inline-block; background: #1B2B27; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Track on Canada Post
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 12px;">
          Tracking info may take a few hours to become available after shipment.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #9CA3AF; font-size: 12px;">
        OnSite Club — Construction Community in Canada
      </p>
    </div>

  </div>
</body>
</html>`;
}
