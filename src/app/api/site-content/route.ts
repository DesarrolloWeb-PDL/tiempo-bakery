import { NextResponse } from 'next/server';
import { getSiteContent } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json({
      contactWhatsapp: content.contactWhatsapp,
      contactPhone: content.contactPhone,
    });
  } catch {
    return NextResponse.json({ contactWhatsapp: '', contactPhone: '' });
  }
}
