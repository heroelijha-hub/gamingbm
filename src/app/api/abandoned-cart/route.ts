import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const MAX_BODY_BYTES = 50_000; // 50 KB
const MAX_CART_LINES = 50;

const str = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

export async function POST(req: Request) {
  try {
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
    const cartData = Array.isArray(body.cartData) ? body.cartData.slice(0, MAX_CART_LINES) : [];
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
        status: 'ABANDONED', // Always set to ABANDONED when they are on checkout page
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

    // SECURITY: never echo the stored record back (it would leak the
    // name / phone / cart of whoever owns this e-mail address).
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in abandoned-cart route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
