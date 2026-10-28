import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

// HTML escape utility to prevent XSS in email templates
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fetch SMTP settings from DB
async function getTransporter() {
  const settingsDb = await prisma.setting.findMany({
    where: {
      key: {
        in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'HEADER_LOGO_IMAGE']
      }
    }
  });

  const settings = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

  if (!settings.SMTP_HOST || !settings.SMTP_USER || !settings.SMTP_PASS) {
    throw new Error('SMTP configuration is missing in the database.');
  }

  const transporter = nodemailer.createTransport({
    host: settings.SMTP_HOST,
    port: parseInt(settings.SMTP_PORT || '587'),
    secure: settings.SMTP_PORT === '465',
    auth: {
      user: settings.SMTP_USER,
      pass: settings.SMTP_PASS,
    },
  });

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "My Store";
  return { transporter, from: settings.SMTP_FROM || `"${storeName}" <${settings.SMTP_USER}>`, logo: settings.HEADER_LOGO_IMAGE };
}

// General email sender
export async function sendEmail({ to, subject, html, attachments }: { to: string, subject: string, html: string, attachments?: any[] }) {
  try {
    const { transporter, from } = await getTransporter();
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });

    // Message sent successfully
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email: ", error);
    return { success: false, error };
  }
}

// FORMATTER HELPERS
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
};

// --- EMAIL TEMPLATES ---

// 1. Client Order Confirmation
export async function sendClientOrderConfirmation(order: any, userEmail: string, userName: string) {
  try {
    const { logo, from } = await getTransporter().catch(() => ({ logo: '', from: '' }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 40px;"></div>` : '';

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) {}
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0 ? "Kostenlos!" : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName ? `(${metadata.shippingMethodName})` : "";
    
    // Addresses
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || userName || 'Kunde');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;
    
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";
    const storeEmailMatch = from.match(/<(.+)>/);
    const storeEmail = storeEmailMatch ? storeEmailMatch[1] : "info@gamingbm.com";
    
    // Payment Method mapping
    let paymentMethodStr = order.paymentMethod;
    if (paymentMethodStr === 'BANK_TRANSFER') paymentMethodStr = 'Direkte Banküberweisung';
    if (paymentMethodStr === 'STRIPE') paymentMethodStr = 'Kreditkarte';
    if (paymentMethodStr === 'PAYPAL') paymentMethodStr = 'PayPal';

    const orderId = order.id.slice(-6).toUpperCase();

    const itemsHtml = order.orderItems?.map((item: any) => {
      let imageUrl = '';
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
      } else if (typeof item.product?.images === 'string') {
        try {
          const imgs = JSON.parse(item.product.images);
          if (imgs.length > 0) imageUrl = imgs[0];
        } catch(e) {}
      }

      const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
      const imgTag = safeImageUrl ? `<img src="${safeImageUrl}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : '';
      
      let sku = item.product?.sku ? `(#${escapeHtml(item.product.sku)})` : '';

      return `
        <tr style="border-bottom: 1px dashed #eee;">
          <td style="padding: 15px 0;">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 65px; vertical-align: middle;">${imgTag}</td>
                <td style="vertical-align: middle;">
                  <span style="font-size: 13px; color: #333;">${escapeHtml(item.product?.title || 'Produkt')}</span><br/>
                  <span style="font-size: 12px; color: #666;">${sku}</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 15px 0; text-align: center; vertical-align: middle; color: #666; font-size: 13px;">×${item.quantity}</td>
          <td style="padding: 15px 0; text-align: right; vertical-align: middle; color: #666; font-size: 13px;">${formatPrice(item.price)}</td>
        </tr>
      `;
    }).join('') || '';

    // Bank Details logic
    let bankDetailsHtml = '';
    if (order.paymentMethod === 'BANK_TRANSFER') {
      const dbSettings = await prisma.setting.findMany({
        where: { key: { in: ['BANK_TRANSFER_ACCOUNT_HOLDER', 'BANK_TRANSFER_IBAN', 'BANK_TRANSFER_BIC', 'BANK_TRANSFER_BANK_NAME', 'BANK_TRANSFER_INSTRUCTIONS'] } }
      });
      const settings = dbSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
      
      bankDetailsHtml = `
        <div style="background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-top: 25px; margin-bottom: 25px;">
          <h4 style="margin-top: 0; margin-bottom: 15px; color: #1a1a1a; font-size: 14px;">Ihre Banküberweisung Details</h4>
          <p style="font-size: 13px; color: #666; margin-bottom: 15px;">Bitte überweisen Sie den Rechnungsbetrag auf folgendes Konto. Geben Sie als Verwendungszweck Ihre Bestellnummer <strong>${orderId}</strong> an.</p>
          <table style="width: 100%; font-size: 13px; color: #333; line-height: 1.6;">
            ${settings.BANK_TRANSFER_ACCOUNT_HOLDER ? `<tr><td style="width: 150px; color: #666;">Kontoinhaber:</td><td><strong>${settings.BANK_TRANSFER_ACCOUNT_HOLDER}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_IBAN ? `<tr><td style="color: #666;">IBAN:</td><td><strong>${settings.BANK_TRANSFER_IBAN}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_BIC ? `<tr><td style="color: #666;">BIC:</td><td><strong>${settings.BANK_TRANSFER_BIC}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_BANK_NAME ? `<tr><td style="color: #666;">Bank:</td><td><strong>${settings.BANK_TRANSFER_BANK_NAME}</strong></td></tr>` : ''}
          </table>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">Details zur Bestellung Nr. ${orderId}</h1>
        <p style="font-size: 13px; color: #666;">Hallo ${escapeHtml(userName) || 'Kunde'},</p>
        <p style="font-size: 13px; color: #666;">Hier sind die Einzelheiten deiner Bestellung vom ${formatDate(new Date(order.createdAt))}:</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 35px; margin-bottom: 5px;">Bestellübersicht</h3>
        <p style="color: #eab308; font-size: 12px; font-weight: bold; margin-top: 0; margin-bottom: 25px;">Bestellung Nr. ${orderId} (${formatDate(new Date(order.createdAt))})</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead style="text-align: left; border-bottom: 1px solid #eee;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #333;">Produkt</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #333;">Anzahl</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #333;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 25px;">
          <table style="width: 100%; font-size: 13px; color: #666; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versand: Gratis Lieferung ${shippingMethod}</td>
              <td style="text-align: right;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #1a1a1a; font-size: 14px;">
              <td><strong>Gesamt:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td>Zahlungsart:</td>
              <td style="text-align: right;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        ${bankDetailsHtml}

        <div style="border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-top: 30px; padding-top: 25px; padding-bottom: 25px;">
          <table style="width: 100%; font-size: 12px; color: #333; line-height: 1.4;">
            <tr>
              <td style="vertical-align: top; width: 50%;">
                <strong style="font-size: 13px;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #eab308;">${escapeHtml(b.phone)}</span><br/>` : ''}
                  ${b.email ? `<a href="mailto:${b.email}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(b.email)}</a>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%;">
                <strong style="font-size: 13px;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #eab308;">${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px; font-size: 13px;">
          <p style="color: #333;">Nochmals vielen Dank! Wenn du Hilfe bei deiner Bestellung benötigst, kannst du uns jederzeit unter <a href="mailto:${storeEmail}" style="color: #2563eb; text-decoration: underline;">${storeEmail}</a> kontaktieren.</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    const { generateInvoicePDF } = await import('./pdfGenerator');
    let pdfAttachment: any = null;
    try {
      const pdfBuffer = await generateInvoicePDF(order);
      pdfAttachment = {
        filename: `rechnung-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      };
    } catch (pdfErr) {
      console.error('Failed to generate PDF invoice', pdfErr);
    }

    return sendEmail({
      to: userEmail,
      subject: `Bestellbestätigung #${orderId}`,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : []
    });
  } catch (e) {
    console.error(e);
  }
}

// 2. Admin New Order Notification
export async function sendAdminOrderNotification(order: any, adminEmail: string, customerDetails: any) {
  try {
    const { logo } = await getTransporter().catch(() => ({ logo: '' }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 40px;"></div>` : '';

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) {}
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0 ? "Kostenlos!" : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName ? `(${metadata.shippingMethodName})` : "";
    
    // Addresses
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || customerDetails?.name || 'Kunde');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;
    
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";
    
    // Payment Method mapping
    let paymentMethodStr = order.paymentMethod;
    if (paymentMethodStr === 'BANK_TRANSFER') paymentMethodStr = 'Direkte Banküberweisung';
    if (paymentMethodStr === 'STRIPE') paymentMethodStr = 'Kreditkarte';
    if (paymentMethodStr === 'PAYPAL') paymentMethodStr = 'PayPal';

    const orderId = order.id.slice(-6).toUpperCase();

    const itemsHtml = order.orderItems?.map((item: any) => {
      let imageUrl = '';
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
      } else if (typeof item.product?.images === 'string') {
        try {
          const imgs = JSON.parse(item.product.images);
          if (imgs.length > 0) imageUrl = imgs[0];
        } catch(e) {}
      }

      const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
      const imgTag = safeImageUrl ? `<img src="${safeImageUrl}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : '';
      
      let sku = item.product?.sku ? `(#${escapeHtml(item.product.sku)})` : '';

      return `
        <tr style="border-bottom: 1px dashed #eee;">
          <td style="padding: 15px 0;">
            <table style="width: 100%; border: none;">
              <tr>
                <td style="width: 65px; vertical-align: middle;">${imgTag}</td>
                <td style="vertical-align: middle;">
                  <span style="font-size: 13px; color: #333;">${escapeHtml(item.product?.title || 'Produkt')}</span><br/>
                  <span style="font-size: 12px; color: #666;">${sku}</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 15px 0; text-align: center; vertical-align: middle; color: #666; font-size: 13px;">×${item.quantity}</td>
          <td style="padding: 15px 0; text-align: right; vertical-align: middle; color: #666; font-size: 13px;">${formatPrice(item.price)}</td>
        </tr>
      `;
    }).join('') || '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">Neue Bestellung: Nr. ${orderId}</h1>
        <p style="font-size: 13px; color: #666;">Du hast eine neue Bestellung von ${escapeHtml(customerDetails.name) || 'einem Kunden'} erhalten:</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 35px; margin-bottom: 5px;">Bestellübersicht</h3>
        <p style="color: #eab308; font-size: 12px; font-weight: bold; margin-top: 0; margin-bottom: 25px;">Bestellung Nr. ${orderId} (${formatDate(new Date(order.createdAt))})</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead style="text-align: left; border-bottom: 1px solid #eee;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #333;">Produkt</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #333;">Anzahl</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #333;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 25px;">
          <table style="width: 100%; font-size: 13px; color: #666; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versand: Gratis Lieferung ${shippingMethod}</td>
              <td style="text-align: right;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #1a1a1a; font-size: 14px;">
              <td><strong>Gesamt:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td>Zahlungsart:</td>
              <td style="text-align: right;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-top: 30px; padding-top: 25px; padding-bottom: 25px;">
          <table style="width: 100%; font-size: 12px; color: #333; line-height: 1.4;">
            <tr>
              <td style="vertical-align: top; width: 50%;">
                <strong style="font-size: 13px;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #eab308;">${escapeHtml(b.phone)}</span><br/>` : ''}
                  ${b.email ? `<a href="mailto:${b.email}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(b.email)}</a>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%;">
                <strong style="font-size: 13px;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #eab308;">${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px; font-size: 13px;">
          <p style="margin-bottom: 8px; color: #333;">Herzlichen Glückwunsch zum Verkauf!</p>
          <p style="color: #666; margin-top: 0;">Verarbeite deine Bestellungen unterwegs. <a href="#" style="color: #eab308; text-decoration: underline;">Hol dir die App</a>.</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `Neue Bestellung #${orderId}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 3. Client Order Status Update (Cancelled / Shipped / Delivered)
export async function sendOrderStatusUpdate(order: any, userEmail: string, status: string) {
  try {
    const { logo, from } = await getTransporter().catch(() => ({ logo: '', from: '' }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 40px;"></div>` : '';

    let title = "Ihre Bestellung wurde aktualisiert";
    let message = `Der Status Ihrer Bestellung <strong>#${order.id.slice(-6).toUpperCase()}</strong> wurde aktualisiert.`;
    let color = "#1a1a1a";

    if (status === 'SHIPPED') {
      title = "Ihre Bestellung ist unterwegs 🚚";
      message = `Ihre Bestellung <strong>#${order.id.slice(-6).toUpperCase()}</strong> wurde versandt. Sie können die Lieferung in Ihrem Konto verfolgen.`;
      color = "#16a34a"; // green
    } else if (status === 'CANCELLED') {
      title = "Informationen zu Ihrer Bestellung";
      message = `Wir möchten Sie darüber informieren, dass Ihre Bestellung <strong>#${order.id.slice(-6).toUpperCase()}</strong> leider <strong>storniert</strong> wurde. Falls eine Zahlung getätigt wurde, wird die Rückerstattung derzeit bearbeitet.`;
      color = "#dc2626"; // red
    } else if (status === 'DELIVERED') {
      title = "Ihre Bestellung wurde zugestellt!";
      message = `Ihre Bestellung <strong>#${order.id.slice(-6).toUpperCase()}</strong> wurde als zugestellt markiert. Wir hoffen, Sie sind zufrieden!`;
      color = "#16a34a";
    }

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) {}
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0 ? "Kostenlos!" : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName ? `(${metadata.shippingMethodName})` : "";
    
    // Addresses
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Kunde');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;
    
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";
    const storeEmailMatch = from?.match(/<(.+)>/);
    const storeEmail = storeEmailMatch ? storeEmailMatch[1] : "info@gamingbm.com";
    
    // Payment Method mapping
    let paymentMethodStr = order.paymentMethod;
    if (paymentMethodStr === 'BANK_TRANSFER') paymentMethodStr = 'Direkte Banküberweisung';
    if (paymentMethodStr === 'STRIPE') paymentMethodStr = 'Kreditkarte';
    if (paymentMethodStr === 'PAYPAL') paymentMethodStr = 'PayPal';

    const orderId = order.id.slice(-6).toUpperCase();

    let itemsHtml = '';
    if (order.orderItems && order.orderItems.length > 0) {
      itemsHtml = order.orderItems.map((item: any) => {
        let imageUrl = '';
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
        } else if (typeof item.product?.images === 'string') {
          try {
            const imgs = JSON.parse(item.product.images);
            if (imgs.length > 0) imageUrl = imgs[0];
          } catch(e) {}
        }
  
        const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
        const imgTag = safeImageUrl ? `<img src="${safeImageUrl}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : '';
        let sku = item.product?.sku ? `(#${escapeHtml(item.product.sku)})` : '';
  
        return `
          <tr style="border-bottom: 1px dashed #eee;">
            <td style="padding: 15px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  <td style="width: 65px; vertical-align: middle;">${imgTag}</td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 13px; color: #333;">${escapeHtml(item.product?.title || 'Produkt')}</span><br/>
                    <span style="font-size: 12px; color: #666;">${sku}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 15px 0; text-align: center; vertical-align: middle; color: #666; font-size: 13px;">×${item.quantity}</td>
            <td style="padding: 15px 0; text-align: right; vertical-align: middle; color: #666; font-size: 13px;">${formatPrice(item.price)}</td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: ${color}; margin-top: 0; margin-bottom: 15px;">${title}</h1>
        <p style="font-size: 13px; color: #666;">Hallo,</p>
        <p style="font-size: 13px; color: #666;">${message}</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 35px; margin-bottom: 5px;">Bestellübersicht</h3>
        <p style="color: #eab308; font-size: 12px; font-weight: bold; margin-top: 0; margin-bottom: 25px;">Bestellung Nr. ${orderId} (${formatDate(new Date(order.createdAt))})</p>
        
        ${itemsHtml ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead style="text-align: left; border-bottom: 1px solid #eee;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #333;">Produkt</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #333;">Anzahl</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #333;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        ` : ''}
        
        <div style="margin-top: 25px;">
          <table style="width: 100%; font-size: 13px; color: #666; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versand: Gratis Lieferung ${shippingMethod}</td>
              <td style="text-align: right;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #1a1a1a; font-size: 14px;">
              <td><strong>Gesamt:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td>Zahlungsart:</td>
              <td style="text-align: right;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-top: 30px; padding-top: 25px; padding-bottom: 25px;">
          <table style="width: 100%; font-size: 12px; color: #333; line-height: 1.4;">
            <tr>
              <td style="vertical-align: top; width: 50%;">
                <strong style="font-size: 13px;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #eab308;">${escapeHtml(b.phone)}</span><br/>` : ''}
                  ${b.email ? `<a href="mailto:${b.email}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(b.email)}</a>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%;">
                <strong style="font-size: 13px;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #eab308;">${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px; font-size: 13px;">
          <p style="color: #333;">Zögern Sie nicht, uns bei weiteren Fragen unter <a href="mailto:${storeEmail}" style="color: #2563eb; text-decoration: underline;">${storeEmail}</a> zu kontaktieren.</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Aktualisierung Ihrer Bestellung #${orderId}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 4. Abandoned Cart Recovery Email
export async function sendAbandonedCartRecoveryEmail(cart: any, userEmail: string, userName: string, checkoutUrl: string) {
  try {
    const { logo } = await getTransporter().catch(() => ({ logo: '' }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 50px;"></div>` : '';

    // USER TODO: Add your coupon code here! For example: "Use code COMEBACK10 for 10% off!"
    const couponMessage = ""; 

    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

    let itemsHtml = '';
    if (Array.isArray(cart.cartData) && cart.cartData.length > 0) {
      const productIds = cart.cartData
        .map((i: any) => i?.productId)
        .filter((id: any): id is string => typeof id === 'string');

      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, isDeleted: false },
        select: { id: true, title: true, price: true, images: true }
      });
      const dbMap = new Map(dbProducts.map(p => [p.id, p]));

      itemsHtml = cart.cartData.map((item: any) => {
        const dbProduct = item?.productId ? dbMap.get(item.productId) : null;
        const title = dbProduct?.title || item?.title || 'Produkt';
        const price = dbProduct?.price ?? (Number(item?.price) || 0);
        const rawImages = dbProduct?.images || item?.product?.images;

        let imageUrl = '';
        if (Array.isArray(rawImages) && rawImages.length > 0) {
          imageUrl = typeof rawImages[0] === 'string' ? rawImages[0] : (rawImages[0]?.url || '');
        } else if (typeof rawImages === 'string') {
          try {
            const parsed = JSON.parse(rawImages);
            if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
          } catch {}
        }
  
        const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
        const imgTag = safeImageUrl ? `<img src="${safeImageUrl}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : '';
        const qty = Math.min(Math.max(1, Number(item?.quantity) || 1), 999);
  
        return `
          <tr style="border-bottom: 1px dashed #eee;">
            <td style="padding: 15px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  <td style="width: 65px; vertical-align: middle;">${imgTag}</td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 13px; color: #333;">${escapeHtml(title)}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 15px 0; text-align: center; vertical-align: middle; color: #666; font-size: 13px;">×${qty}</td>
            <td style="padding: 15px 0; text-align: right; vertical-align: middle; color: #666; font-size: 13px;">${formatPrice(price)}</td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">Verlassener Warenkorb</h1>
        <p style="font-size: 13px; color: #666;">Hallo ${escapeHtml(userName) || 'Kunde'},</p>
        <p style="font-size: 13px; color: #666;">Wir haben festgestellt, dass Sie Artikel in Ihrem Warenkorb gelassen haben. Sie warten auf Sie!</p>
        
        <div style="margin: 20px 0;">
          ${couponMessage ? `<p style="font-size: 16px; font-weight: bold; color: #eab308;">${couponMessage}</p>` : ''}
        </div>

        <h3 style="font-size: 16px; font-weight: bold; margin-top: 35px; margin-bottom: 5px;">Zusammenfassung Ihres Warenkorbs</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead style="text-align: left; border-bottom: 1px solid #eee;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #333;">Produkt</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #333;">Anzahl</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #333;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${checkoutUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Bestellung abschließen
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px; font-size: 13px;">
          <p style="color: #666;">Wenn Sie Fragen haben, zögern Sie nicht, uns zu kontaktieren.</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Schließen Sie Ihre Bestellung ab`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}


// 5. Review Request Email
export async function sendReviewRequestEmail(order: any, userEmail: string, userName: string, storeUrl: string) {
  try {
    const { logo } = await getTransporter().catch(() => ({ logo: "" }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 50px;"></div>` : "";

    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

    let itemsHtml = '';
    if (order.orderItems && order.orderItems.length > 0) {
      itemsHtml = order.orderItems.map((item: any) => {
        let imageUrl = '';
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
        } else if (typeof item.product?.images === 'string') {
          try {
            const imgs = JSON.parse(item.product.images);
            if (imgs.length > 0) imageUrl = imgs[0];
          } catch(e) {}
        }
  
        const imgTag = imageUrl ? `<img src="${imageUrl}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : '';
  
        return `
          <tr style="border-bottom: 1px dashed #eee;">
            <td style="padding: 15px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  <td style="width: 65px; vertical-align: middle;">${imgTag}</td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 13px; color: #333;">${escapeHtml(item.product?.title || 'Produkt')}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 15px 0; text-align: right; vertical-align: middle;">
              <a href="${storeUrl}/product/${item.product?.slug || item.product?.id}" style="background-color: #ea580c; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">
                Bewerten
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">Wie war Ihre Bestellung?</h1>
        <p style="font-size: 13px; color: #666;">Hallo ${escapeHtml(userName) || "Kunde"},</p>
        <p style="font-size: 13px; color: #666;">Wir hoffen, dass Sie die Artikel aus Ihrer letzten Bestellung in unserem Shop genießen!</p>
        <p style="font-size: 13px; color: #666;">Ihre Meinung ist uns sehr wichtig und hilft anderen Kunden, die richtige Wahl zu treffen.</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-top: 35px; margin-bottom: 5px;">Hinterlassen Sie eine Bewertung</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px; font-size: 13px;">
          <p style="color: #666;">Vielen Dank, dass Sie sich die Zeit nehmen, Ihre Erfahrung zu teilen.</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Hinterlassen Sie eine Bewertung zu Ihrer letzten Bestellung #${order.id.slice(-6).toUpperCase()}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}


// 6. Admin Low Stock Alert
export async function sendLowStockAlertEmail(productTitle: string, variationName: string | null, currentStock: number, threshold: number, adminEmail: string, storeUrl: string, productId: string) {
  try {
    const { logo } = await getTransporter().catch(() => ({ logo: "" }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 40px;"></div>` : "";

    const productName = variationName ? `${productTitle} (${variationName})` : productTitle;

    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: #dc2626; margin-top: 0; margin-bottom: 15px;">Warnung: Geringer Bestand</h1>
        <p style="font-size: 13px; color: #666;">Hallo,</p>
        <p style="font-size: 13px; color: #666;">Der Bestand des folgenden Produkts ist unter die Warnschwelle gefallen (${threshold} Einheiten).</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">${escapeHtml(productName)}</h3>
          <p style="margin-bottom: 0; font-size: 16px;"><strong>Verbleibender Bestand: <span style="color: #dc2626;">${currentStock}</span></strong></p>
        </div>
        
        <p style="margin-top: 30px; text-align: center; margin-bottom: 40px;">
          <a href="${storeUrl}/admin/products/${productId}/edit" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Bestand verwalten
          </a>
        </p>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `[Bestandswarnung] ${productName} - Nur noch ${currentStock} auf Lager`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}


// 7. Admin New Chat Message Notification
export async function sendAdminNewChatMessageEmail(guestName: string, guestEmail: string | null, messageContent: string, adminEmail: string, storeUrl: string) {
  try {
    const { logo } = await getTransporter().catch(() => ({ logo: "" }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 40px;"></div>` : "";

    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">Neue Support-Nachricht</h1>
        <p style="font-size: 13px; color: #666;">Ein Besucher hat gerade eine Nachricht im Chat Ihres Shops hinterlassen.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
          <tr>
            <td style="padding: 10px; font-size: 13px;"><strong>Von:</strong></td>
            <td style="padding: 10px; font-size: 13px;">${escapeHtml(guestName) || "Besucher"} ${guestEmail ? `(<a href="mailto:${guestEmail}" style="color: #2563eb;">${escapeHtml(guestEmail)}</a>)` : ""}</td>
          </tr>
          <tr>
            <td style="padding: 10px; vertical-align: top; font-size: 13px;"><strong>Nachricht:</strong></td>
            <td style="padding: 10px; font-size: 13px; font-style: italic;">"${escapeHtml(messageContent)}"</td>
          </tr>
        </table>
        
        <p style="margin-top: 30px; text-align: center; margin-bottom: 40px;">
          <a href="${storeUrl}/admin/chat" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Admin-Chat öffnen
          </a>
        </p>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `[Support-Chat] Neue Nachricht von ${escapeHtml(guestName) || "Besucher"}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 8. Newsletter Welcome Email for Client
export async function sendNewsletterWelcomeEmail(userEmail: string) {
  try {
    const { logo, from } = await getTransporter().catch(() => ({ logo: '', from: '' }));
    
    const logoHtml = logo ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="Logo" style="max-height: 40px;"></div>` : "";
    
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Gaming BM";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
        ${logoHtml}
        <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">🎁 Willkommen! 25 € Rabatt auf Ihren nächsten Einkauf</h1>
        
        <p style="font-size: 14px; color: #333; margin-bottom: 20px;">Wir freuen uns sehr, Sie als neuen Abonnenten unseres Newsletters begrüßen zu dürfen! 🌿</p>
        <p style="font-size: 14px; color: #333; margin-bottom: 25px;">🎁 Als Willkommensgeschenk erhalten Sie <strong>25 € Rabatt</strong> auf Ihren nächsten Einkauf!</p>
        
        <div style="background-color: #fef3c7; border: 1px dashed #d97706; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">Verwenden Sie einfach den folgenden exklusiven Aktionscode:</p>
          <p style="margin: 10px 0 0 0; font-size: 22px; font-weight: bold; color: #b45309; letter-spacing: 2px;">🏷️ BH874XP</p>
        </div>
        
        <p style="font-size: 13px; color: #666; margin-bottom: 30px;">Geben Sie den Code bei Ihrem nächsten Einkauf ein – es gibt keinen Mindestbestellwert! 🛒</p>
        
        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">Als Abonnent(in) unseres Newsletters erhalten Sie regelmäßig:</h3>
        <ul style="font-size: 14px; color: #333; padding-left: 20px; margin-bottom: 30px; line-height: 1.8;">
          <li>✨ Exklusive Angebote und Rabatte</li>
          <li>🔥 Neuigkeiten zu unseren Produkten</li>
          <li>💡 Praktische Tipps und Informationen rund um unsere Kaminbrennstoffe</li>
        </ul>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 30px; border-radius: 0 4px 4px 0;">
          <p style="margin: 0; font-size: 13px; color: #4b5563;">📩 <strong>Tipp:</strong> Speichern Sie unsere E-Mail-Adresse in Ihren Kontakten, damit Sie keine unserer Angebote und Neuigkeiten verpassen!</p>
        </div>
        
        <p style="font-size: 14px; color: #333; margin-bottom: 10px;">Wir freuen uns, bald wieder von Ihnen zu hören, und wünschen Ihnen viel Freude beim Einkaufen! 😊</p>
        <p style="font-size: 14px; font-weight: bold; color: #ea580c; margin-bottom: 40px;">🔥 Ihr Team von ${storeName}</p>
        
        <div style="border-top: 1px solid #eee; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
          <strong>${storeName}</strong><br/>
          DÜNNENRIEDE 3, 30853 LANGENHAGEN, DEUTSCHLAND
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Willkommen! Hier ist Ihr 25 € Gutschein 🎁`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 7. Supervision Live Admin Alert Email
export async function sendAdminAlertEmail({
  title,
  message,
  details,
}: {
  title: string;
  message: string;
  details?: Record<string, any>;
}) {
  try {
    const settingsDb = await prisma.setting.findMany({
      where: { key: { in: ['CONTACT_RECEIVER_EMAIL', 'SMTP_USER'] } }
    });
    const sMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const recipient = sMap['CONTACT_RECEIVER_EMAIL'] || sMap['SMTP_USER'] || 'info@gamingbm.com';

    let detailsHtml = '';
    if (details && Object.keys(details).length > 0) {
      detailsHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-top: 15px;">
          <table style="width: 100%; font-size: 13px; color: #334155;">
            ${Object.entries(details).map(([k, v]) => `
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; width: 140px; vertical-align: top;">${escapeHtml(k)}:</td>
                <td style="padding: 4px 8px; font-family: monospace;">${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
        <div style="background-color: #ef4444; color: white; padding: 12px 20px; border-radius: 6px 6px 0 0; font-size: 16px; font-weight: bold;">
          ⚠️ Supervision Live Shop : ${escapeHtml(title)}
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 6px 6px; background: white;">
          <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">${escapeHtml(message)}</p>
          ${detailsHtml}
          <p style="font-size: 12px; color: #64748b; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            Alerte automatique générée par le système de supervision live.
          </p>
        </div>
      </div>
    `;

    return sendEmail({
      to: recipient,
      subject: `🚨 [Alerte Shop] ${title}`,
      html,
    });
  } catch (err) {
    console.error('Failed to send admin alert email:', err);
  }
}


