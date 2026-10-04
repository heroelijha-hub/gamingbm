import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const MAX_LAYOUT_BYTES = 200_000; // 200 KB
const FONT_REGEX = /^[A-Za-z0-9 \-]{1,60}$/;

export async function POST(req: Request) {
  // SECURITY: admin only (previously anyone could write into the Settings table)
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { layout, font } = await req.json();
    
    // Save draft layout
    if (layout) {
      const serialized = JSON.stringify(layout);
      if (serialized.length > MAX_LAYOUT_BYTES) {
        return NextResponse.json({ success: false, error: 'Layout too large' }, { status: 413 });
      }
      await prisma.setting.upsert({
        where: { key: 'PREVIEW_LAYOUT_DRAFT' },
        update: { value: serialized },
        create: { key: 'PREVIEW_LAYOUT_DRAFT', value: serialized }
      });
    }

    // Save draft font (strict whitelist: font names are injected into CSS)
    if (font) {
      if (typeof font !== 'string' || !FONT_REGEX.test(font)) {
        return NextResponse.json({ success: false, error: 'Invalid font' }, { status: 400 });
      }
      await prisma.setting.upsert({
        where: { key: 'PREVIEW_FONT_DRAFT' },
        update: { value: font },
        create: { key: 'PREVIEW_FONT_DRAFT', value: font }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving preview draft:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
