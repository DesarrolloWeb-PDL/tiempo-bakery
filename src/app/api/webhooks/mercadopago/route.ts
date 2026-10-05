import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import { applyMercadoPagoPaymentToOrder } from '@/lib/mp-payment-sync';

export const dynamic = 'force-dynamic';

function getClientSecret(): string | null {
  return process.env.MERCADOPAGO_CLIENT_SECRET?.trim() ?? null;
}

async function verifyMercadoPagoSignature(
  request: NextRequest,
  paymentId: string
): Promise<boolean> {
  const clientSecret = getClientSecret();
  if (!clientSecret) {
    return false;
  }

  const xSignature = request.headers.get('x-signature') ?? '';
  const xRequestId = request.headers.get('x-request-id') ?? '';

  if (!xSignature || !xRequestId || !paymentId) {
    return false;
  }

  const tsMatch = xSignature.match(/ts=(\d+)/);
  const v1Match = xSignature.match(/v1=([a-f0-9]+)/);

  if (!tsMatch || !v1Match) {
    return false;
  }

  const ts = tsMatch[1];
  const receivedSignature = v1Match[1];
  const signingMessage = 'id:' + paymentId + ';request-id:' + xRequestId + ';ts:' + ts + ';';

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signingMessage));
  const hashArray = Array.from(new Uint8Array(signatureBytes));
  const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return expectedSignature === receivedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const body = await request.json().catch(() => null);
    const topic = searchParams.get('topic') ?? searchParams.get('type') ?? body?.type ?? body?.topic;
    const resourceId = searchParams.get('id') ?? body?.data?.id ?? body?.id;

    if (!topic || !resourceId || topic !== 'payment') {
      return NextResponse.json({ received: true, ignored: true });
    }

    const clientSecret = getClientSecret();
    if (clientSecret) {
      const isValid = await verifyMercadoPagoSignature(request, String(resourceId));
      if (!isValid) {
        console.error('Mercado Pago webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('Mercado Pago webhook: MERCADOPAGO_CLIENT_SECRET not configured, skipping signature verification');
    }

    const payment = await getMercadoPagoPayment(resourceId);
    const orderId = String(payment.external_reference ?? payment.metadata?.orderId ?? '');

    if (!orderId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    await applyMercadoPagoPaymentToOrder(orderId, {
      id: payment.id ?? resourceId,
      status: payment.status,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mercado Pago webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}