import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import { sendOrderPaidEmails } from '@/lib/order-email';
import { stockManager } from '@/lib/stock-manager';

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

function mapMercadoPagoStatus(status: string | undefined) {
  switch (status) {
    case 'approved':
      return 'PAID';
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'FAILED';
    default:
      return 'PENDING';
  }
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const mappedStatus = mapMercadoPagoStatus(payment.status);

    if (mappedStatus === 'PAID' && order.paymentStatus !== 'PAID') {
      const result = await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        })

        if (!freshOrder || freshOrder.paymentStatus === 'PAID') {
          return { status: 'already-paid' as const }
        }

        const confirmed = await stockManager.confirmItems(freshOrder.items, freshOrder.weekId, tx)
        if (!confirmed) {
          throw new Error('No se pudo confirmar stock para ' + freshOrder.orderNumber)
        }

        const updatedOrder = await tx.order.update({
          where: { id: freshOrder.id },
          data: {
            paymentStatus: 'PAID',
            status: freshOrder.status === 'PENDING' ? 'PAID' : freshOrder.status,
            paymentMethod: 'mercadopago',
            mercadopagoPaymentId: String(payment.id),
            paidAt: freshOrder.paidAt ?? new Date(),
          },
        })

        return {
          status: 'paid' as const,
          order: {
            ...freshOrder,
            paymentStatus: updatedOrder.paymentStatus,
            status: updatedOrder.status,
            paymentMethod: updatedOrder.paymentMethod,
            mercadopagoPaymentId: updatedOrder.mercadopagoPaymentId,
            paidAt: updatedOrder.paidAt,
          },
        }
      })

      if (result.status === 'paid') {
        const emailResult = await sendOrderPaidEmails(result.order)
        if (emailResult.skipped) {
          console.log('Order email skipped: RESEND_API_KEY no configurada')
        }
      }
    }

    if (mappedStatus === 'FAILED' && order.paymentStatus !== 'FAILED' && order.paymentStatus !== 'PAID') {
      await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        })

        if (
          !freshOrder ||
          freshOrder.paymentStatus === 'FAILED' ||
          freshOrder.status === 'CANCELLED' ||
          freshOrder.paymentStatus === 'PAID'
        ) {
          return
        }

        const released = await stockManager.releaseItems(freshOrder.items, freshOrder.weekId, tx)
        if (!released) {
          throw new Error('No se pudo liberar stock para ' + freshOrder.orderNumber)
        }

        await tx.order.update({
          where: { id: freshOrder.id },
          data: {
            paymentStatus: 'FAILED',
            status: 'CANCELLED',
            paymentMethod: 'mercadopago',
            mercadopagoPaymentId: String(payment.id),
          },
        })
      })
    }

    if (mappedStatus === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PENDING',
          paymentMethod: 'mercadopago',
          mercadopagoPaymentId: String(payment.id),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Mercado Pago webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}