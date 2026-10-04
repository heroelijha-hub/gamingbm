import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PayPal Capture Handler
 * 
 * Called after the user approves the payment on PayPal.
 * Captures the payment, updates order status, and triggers post-payment logic.
 * 
 * Flow:
 * 1. User clicks "Pay with PayPal" → redirected to PayPal approval URL
 * 2. User approves → PayPal redirects to this route with token & orderId
 * 3. This route captures the payment via PayPal API
 * 4. On success → finalizeOrder() + redirect to success page
 * 5. On failure → redirect to checkout with error
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const paypalToken = url.searchParams.get('token');

    if (!orderId || !paypalToken) {
      return NextResponse.redirect(
        new URL('/checkout?error=missing_params', request.url)
      );
    }

    // Validate orderId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.redirect(
        new URL('/checkout?error=invalid_order', request.url)
      );
    }

    // Verify order exists and is PENDING
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.redirect(
        new URL('/checkout?error=order_not_found', request.url)
      );
    }

    if (order.status !== 'PENDING') {
      // Already processed (idempotency)
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.topkaminbrennstoffe.com';
      return NextResponse.redirect(
        new URL(`/checkout/success?orderId=${orderId}`, baseUrl)
      );
    }

    // Fetch PayPal credentials from Settings DB
    const [clientIdSetting, secretSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'PAYPAL_CLIENT_ID' } }),
      prisma.setting.findUnique({ where: { key: 'PAYPAL_SECRET' } }),
    ]);

    if (!clientIdSetting?.value || !secretSetting?.value) {
      console.error('[PayPal Capture] PayPal credentials not found in Settings');
      return NextResponse.redirect(
        new URL('/checkout?error=paypal_not_configured', request.url)
      );
    }

    // Get PayPal access token
    const auth = Buffer.from(
      `${clientIdSetting.value}:${secretSetting.value}`
    ).toString('base64');

    const tokenRes = await fetch(
      'https://api-m.paypal.com/v1/oauth2/token',
      {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[PayPal Capture] Failed to get access token');
      return NextResponse.redirect(
        new URL('/checkout?error=paypal_auth_failed', request.url)
      );
    }

    // Validate PayPal token format (alphanumeric order ID) to avoid path injection
    if (!/^[A-Z0-9-]{5,64}$/i.test(paypalToken)) {
      return NextResponse.redirect(
        new URL('/checkout?error=invalid_order', request.url)
      );
    }

    const expectedAmount = order.total.toFixed(2);
    const currencySetting = await prisma.setting.findUnique({ where: { key: 'currency' } });
    const expectedCurrency = (currencySetting?.value || 'EUR').toUpperCase();

    // ===== SECURITY: verify the PayPal order BEFORE capturing =====
    // The PayPal order must belong to THIS shop order and have the exact amount.
    // Without this check, an attacker could pay a cheap order and use its token
    // to mark an expensive order as PAID.
    const detailsRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${encodeURIComponent(paypalToken)}`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const details = await detailsRes.json();
    const unit = details?.purchase_units?.[0];

    if (
      !unit ||
      unit.reference_id !== orderId ||
      unit.amount?.value !== expectedAmount ||
      String(unit.amount?.currency_code).toUpperCase() !== expectedCurrency
    ) {
      console.error('[PayPal Capture] Order mismatch', {
        orderId,
        paypalRef: unit?.reference_id,
        paypalAmount: unit?.amount?.value,
        expectedAmount,
      });
      return NextResponse.redirect(
        new URL('/checkout?error=paypal_order_mismatch', request.url)
      );
    }

    // Capture the payment
    const captureRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${encodeURIComponent(paypalToken)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          // Idempotency: PayPal will not capture twice for the same request id
          'PayPal-Request-Id': `capture-${orderId}`,
        },
      }
    );

    const captureData = await captureRes.json();

    // Double-check the captured amount (defence in depth)
    const capture = captureData?.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedOk =
      captureData.status === 'COMPLETED' &&
      capture?.status === 'COMPLETED' &&
      capture?.amount?.value === expectedAmount &&
      String(capture?.amount?.currency_code).toUpperCase() === expectedCurrency;

    if (capturedOk) {
      // Atomic update: only one concurrent request can switch PENDING -> PAID
      const updated = await prisma.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'PAID' },
      });

      // Trigger post-payment logic only once
      if (updated.count === 1) {
        const { finalizeOrder } = await import('@/lib/orderFinalizer');
        await finalizeOrder(orderId);
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.topkaminbrennstoffe.com';
      return NextResponse.redirect(
        new URL(`/checkout/success?orderId=${orderId}`, baseUrl)
      );
    } else {
      console.error(
        '[PayPal Capture] Capture failed:',
        JSON.stringify(captureData)
      );
      return NextResponse.redirect(
        new URL('/checkout?error=paypal_capture_failed', request.url)
      );
    }
  } catch (error: any) {
    console.error('[PayPal Capture] Unhandled error:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=server_error', request.url)
    );
  }
}
