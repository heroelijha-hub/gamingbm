import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Stripe Webhook Handler
 * 
 * Listens for `checkout.session.completed` events to confirm payments.
 * Updates order status from PENDING to PAID and triggers post-payment logic.
 * 
 * Setup in Stripe Dashboard:
 * - Endpoint URL: https://your-domain.com/api/stripe/webhook
 * - Events: checkout.session.completed
 * - Webhook signing secret → set as STRIPE_WEBHOOK_SECRET env var
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Get Stripe secret key from Settings DB
    const stripeSecretSetting = await prisma.setting.findUnique({
      where: { key: 'STRIPE_SECRET_KEY' },
    });

    if (!stripeSecretSetting?.value) {
      console.error('[Stripe Webhook] STRIPE_SECRET_KEY not found in Settings');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Get webhook secret from env
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET env var not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeSecretSetting.value);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object;
      const orderId = session.client_reference_id;

      if (!orderId) {
        console.error('[Stripe Webhook] No client_reference_id in session');
        return NextResponse.json(
          { error: 'Missing order reference' },
          { status: 400 }
        );
      }

      // SECURITY: a completed session is not necessarily paid (async methods)
      if (session.payment_status !== 'paid') {
        console.warn(`[Stripe Webhook] Session ${session.id} not paid yet (${session.payment_status})`);
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order) {
        console.error(`[Stripe Webhook] Order ${orderId} not found`);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // SECURITY: the session must be the one created for this order,
      // and the paid amount must cover the order total.
      if (order.stripeSessionId && order.stripeSessionId !== session.id) {
        console.error(`[Stripe Webhook] Session mismatch for order ${orderId}`);
        return NextResponse.json({ error: 'Session mismatch' }, { status: 400 });
      }
      const expectedCents = Math.round(order.total * 100);
      // 2-cent tolerance for per-line rounding differences
      if (typeof session.amount_total === 'number' && session.amount_total < expectedCents - 2) {
        console.error(`[Stripe Webhook] Amount mismatch for order ${orderId}: paid ${session.amount_total}, expected ${expectedCents}`);
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      // Atomic update (idempotency): only one delivery can switch PENDING -> PAID
      const updated = await prisma.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'PAID', stripeSessionId: session.id },
      });

      if (updated.count === 1) {
        // Trigger post-payment logic (emails, stock, notifications)
        const { finalizeOrder } = await import('@/lib/orderFinalizer');
        await finalizeOrder(orderId);
      }

      return NextResponse.json({ received: true });
    }

    // Return 200 for unhandled event types
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
