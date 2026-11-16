import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, sendNewsletterWelcomeEmail } from '@/lib/mailer';
import { escapeHtml } from '@/lib/security';
import { verifyNewsletterToken } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing token', { status: 400 });
  }

  try {
    const verification = verifyNewsletterToken(token);
    if (!verification.valid) {
      return new NextResponse(
        verification.reason === 'expired' ? 'Token expired' : 'Invalid token',
        { status: 400 }
      );
    }

    const { email } = verification;

    const receiverSetting = await prisma.setting.findUnique({
      where: { key: 'CONTACT_RECEIVER_EMAIL' },
      select: { value: true }
    });
    const receiverEmail = receiverSetting?.value || 'info@gamingbm.com';
    const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Gaming BM';

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
            <strong>${escapeHtml(storeName)}</strong>
          </div>
        </div>
      `,
    }).catch(console.error);

    // 2. Send welcome email to client
    await sendNewsletterWelcomeEmail(email).catch(console.error);

    // 3. Redirect back to site with a success message
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gamingbm.com';
    return NextResponse.redirect(`${baseUrl}/?newsletter=success`);
  } catch (err) {
    console.error('Confirm newsletter error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
