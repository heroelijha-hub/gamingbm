import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSettings } from '@/actions/settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new NextResponse('Invalid or missing token.', { status: 400 });
    }

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('|');
    if (parts.length !== 3) {
      return new NextResponse('Invalid token format.', { status: 400 });
    }

    const [email, expiry, signature] = parts;
    if (Date.now() > parseInt(expiry, 10)) {
      return new NextResponse('Link expired. Please subscribe again.', { status: 400 });
    }

    const secret = process.env.NEXTAUTH_SECRET || process.env.CRON_SECRET || 'fallback-secret';
    const payload = `${email}|${expiry}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== expectedSignature) {
      return new NextResponse('Invalid signature.', { status: 400 });
    }

    // Le mail est vérifié ! On alerte l'administrateur et on envoie le mail de bienvenue.
    const settings = await getSettings();
    const receiverEmail = settings.CONTACT_RECEIVER_EMAIL || 'admin@mystore.com';
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Topkaminbrennstoffe';

    try {
      const { sendEmail, sendNewsletterWelcomeEmail } = await import('@/lib/mailer');
      
      // Alerte l'Administrateur
      await sendEmail({
        to: receiverEmail,
        subject: `Neue Newsletter-Anmeldung — ${email} (Bestätigt)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
            <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">📬 Neue Newsletter-Anmeldung</h1>
            <p style="font-size: 13px; color: #666;">Ein Besucher hat seine Newsletter-Anmeldung für <strong>${storeName}</strong> soeben bestätigt (Double Opt-in).</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <tr>
                <td style="padding: 10px; font-size: 13px; font-weight: bold; width: 120px;">E-Mail:</td>
                <td style="padding: 10px; font-size: 13px;">
                  <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
      
      // Email de bienvenue au client
      await sendNewsletterWelcomeEmail(email);
    } catch (e) {
      console.error('[NEWSLETTER] Error sending emails after confirmation:', e);
    }

    // Redirection vers l'accueil avec un message de succès
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.topkaminbrennstoffe.com';
    return NextResponse.redirect(new URL('/?newsletter=success', baseUrl));
  } catch (error) {
    console.error('Newsletter confirmation error:', error);
    return new NextResponse('Internal server error.', { status: 500 });
  }
}
