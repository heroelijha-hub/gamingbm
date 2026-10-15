'use server';

import prisma from '@/lib/prisma';
import { getSettings } from './settings';
import { getContactSettings } from './contactSettings';
import { getTranslations } from 'next-intl/server';
import { escapeHtml } from '@/lib/security';
import crypto from 'crypto';
import { SITE_URL } from '@/lib/site';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function submitContactMessage(formData: FormData) {
  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(`contact_${ip}`, 5, 600); // 5 messages per 10 minutes per IP
    if (!rateLimit.success) {
      return { error: 'Too many requests. Please wait a few minutes before sending another message.' };
    }

    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !message) {
      const t = await getTranslations('Contact');
      return { error: t('missing_fields') };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: 'Please provide a valid email address.' };
    }

    // Limit field lengths to prevent abuse
    if (name.length > 200 || email.length > 254 || (subject && subject.length > 500) || message.length > 5000) {
      const t = await getTranslations('Contact');
      return { error: t('fields_too_long') };
    }

    const contactSettings = await getContactSettings();
    const receiverEmail = contactSettings.formRecipient;

    // Send email to the configured admin/receiver
    try {
      const { sendEmail } = await import('@/lib/mailer');
      await sendEmail({
        to: receiverEmail,
        subject: subject ? `Neue Nachricht: "${escapeHtml(subject)}"` : `Neue Nachricht von ${escapeHtml(name)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #1a1a1a;">Sie haben eine neue Nachricht erhalten.</h2>
            <p><strong>Von:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
            ${phone ? `<p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>` : ''}
            ${subject ? `<p><strong>Betreff:</strong> ${escapeHtml(subject)}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
            <p><strong>Nachricht:</strong><br/><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
            <br/>
            <p style="color: #666; font-size: 13px;"><em>Bitte antworten Sie dem Kunden so schnell wie möglich.</em></p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[CONTACT] Failed to send email:', emailErr);
    }

    return { success: true, message: 'Your message has been sent successfully!' };
  } catch (error) {
    console.error('Contact submission error:', error);
    const t = await getTranslations('Contact');
    return { error: t('error_sending') };
  }
}

export async function submitNewsletter(formData: FormData) {
  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(`newsletter_${ip}`, 5, 3600); // 5 subscriptions per hour per IP
    if (!rateLimit.success) {
      return { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' };
    }

    const email = String(formData.get('email') || '').trim().toLowerCase();

    if (!email) {
      return { error: 'Veuillez entrer une adresse e-mail valide.' };
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return { error: 'Adresse e-mail invalide.' };
    }

    const secret = process.env.NEWSLETTER_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || process.env.DATABASE_URL || 'fallback-newsletter-key';
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const payload = `${email}|${expiry}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}|${signature}`).toString('base64');
    const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;

    try {
      const { sendEmail } = await import('@/lib/mailer');
      await sendEmail({
        to: email,
        subject: `Bestätigen Sie Ihre Newsletter-Anmeldung`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.5; padding: 20px;">
            <h1 style="font-size: 24px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px;">Bitte bestätigen Sie Ihre Anmeldung</h1>
            <p style="font-size: 14px; color: #333; margin-bottom: 20px;">Vielen Dank für Ihr Interesse an unserem Newsletter! Bitte klicken Sie auf den folgenden Link, um Ihre Anmeldung zu bestätigen:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Anmeldung bestätigen</a>
            </p>
            <p style="font-size: 12px; color: #666;">Falls Sie sich nicht angemeldet haben, können Sie diese E-Mail einfach ignorieren.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[NEWSLETTER] Failed to send opt-in email:', emailErr);
    }

    return { success: true, message: 'Bitte überprüfen Sie Ihren Posteingang, um Ihre Anmeldung zu bestätigen (Double Opt-in).' };
  } catch (error) {
    console.error('Newsletter submission error:', error);
    return { error: "Une erreur est survenue lors de l'inscription." };
  }
}
