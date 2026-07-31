import { NextRequest, NextResponse } from 'next/server';
import { expirePendingOrders } from '@/lib/order-expiry';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authorization = request.headers.get('authorization');
  if (authorization === `Bearer ${cronSecret}`) return true;

  const xCronSecret = request.headers.get('x-cron-secret');
  return xCronSecret === cronSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const { expired } = await expirePendingOrders();
    return NextResponse.json({ ok: true, expired });
  } catch (error) {
    console.error('Error expirando pedidos:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
