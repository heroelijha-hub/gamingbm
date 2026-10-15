import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSettings } from '@/actions/settings';
import { sendEmail, sendNewsletterWelcomeEmail } from '@/lib/mailer';
import { escapeHtml } from '@/lib/security';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing token', { status: 400 });
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, expiry, signature] = decoded.split('|');

    if (!email || !expiry || !signature) {
      return new NextResponse('Invalid token', { status: 400 });
    }

    if (Date.now() > parseInt(expiry, 10)) {
      return new NextResponse('Token expired', { status: 400 });
    }

    // Strong secret resolution: use dedicated secret or server-side keys
    const secret = process.env.NEWSLETTER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || process.env.DATABASE_URL || 'fallback-newsletter-key';
    const payload = `${email}|${expiry}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    const settings = await getSettings();
    const receiverEmail = settings.CONTACT_RECEIVER_EMAIL || 'admin@mystore.com';
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Top Kaminbrennstoffe';

    // 1. Send notification to admin
    await sendEmail({
      to: receiverEmail,
      subject: `Neue Newsletter-Anmeldung — ${escapeHtml(email)} (Bestätigt)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">📬 Neue Newsletter-Anmeldung</h1>
          <p style="font-size: 13px; color: #666;">Ein Besucher hat sich gerade erfolgreich für den Newsletter von <strong>${escapeHtml(storeName)}</strong> angemeldet (Double Opt-in abgeschlossen).</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <tr>
              <td style="padding: 10px; font-size: 13px; font-weight: bold; width: 120px;">E-Mail:</td>
              <td style="padding: 10px; font-size: 13px;">
                <a href="mailto:${escapeHtml(email)}" style="color: #2563eb;">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 10px; font-size: 13px; font-weight: bold;">Datum:</td>
              <td style="padding: 10px; font-size: 13px;">${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}</td>
            </tr>
          </table>
          
          <div style="border-top: 1px solid #eee; margin-top: 40px; padding-top: 25px; text-align: center; font-size: 10px; color: #eab308; text-transform: uppercase;">
            <strong>${storeName}</strong>
          </div>
        </div>
      `,
    }).catch(console.error);

    // 2. Send welcome email to client
    await sendNewsletterWelcomeEmail(email).catch(console.error);

    // 3. Redirect back to site with a success message
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.topkaminbrennstoffe.com';
    return NextResponse.redirect(`${baseUrl}/?newsletter=success`);
  } catch (err) {
    console.error('Confirm newsletter error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
