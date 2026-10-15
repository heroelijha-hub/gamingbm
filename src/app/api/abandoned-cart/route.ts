import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const MAX_BODY_BYTES = 50_000; // 50 KB
const MAX_CART_LINES = 20;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const str = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

export async function POST(req: Request) {
  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit(`abandoned_cart_${ip}`, 15, 300); // 15 calls per 5 mins
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const email = str(body?.email, 254)?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const firstName = str(body.firstName, 100);
    const lastName = str(body.lastName, 100);
    const phone = str(body.phone, 40);

    // Strict validation of cartData to prevent injection
    const cartData = Array.isArray(body.cartData)
      ? body.cartData
          .slice(0, MAX_CART_LINES)
          .filter((item: any) => item && typeof item.productId === 'string' && UUID_REGEX.test(item.productId))
          .map((item: any) => ({
            productId: item.productId,
            quantity: Math.min(Math.max(1, Number(item.quantity) || 1), 999),
            variationId: typeof item.variationId === 'string' ? item.variationId.slice(0, 100) : null,
          }))
      : [];

    const totalAmountNum = Number(body.totalAmount);
    const totalAmount = Number.isFinite(totalAmountNum) && totalAmountNum >= 0 && totalAmountNum < 1_000_000
      ? Math.round(totalAmountNum * 100) / 100
      : 0;

    // Upsert the abandoned cart record
    await prisma.abandonedCart.upsert({
      where: { email },
      update: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        cartData,
        totalAmount,
        status: 'ABANDONED',
        lastActive: new Date(),
      },
      create: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        cartData,
        totalAmount,
        status: 'ABANDONED',
        lastActive: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in abandoned-cart route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
