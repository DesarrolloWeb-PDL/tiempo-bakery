import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import { stockManager } from '@/lib/stock-manager';

export const dynamic = 'force-dynamic';

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
      await prisma.$transaction(async (tx) => {
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        })

        if (!freshOrder || freshOrder.paymentStatus === 'PAID') {
          return
        }

        const confirmed = await stockManager.confirmItems(freshOrder.items, freshOrder.weekId, tx)
        if (!confirmed) {
          throw new Error(`No se pudo confirmar stock para ${freshOrder.orderNumber}`)
        }

        await tx.order.update({
          where: { id: freshOrder.id },
          data: {
            paymentStatus: 'PAID',
            status: freshOrder.status === 'PENDING' ? 'PAID' : freshOrder.status,
            paymentMethod: 'mercadopago',
            mercadopagoPaymentId: String(payment.id),
            paidAt: freshOrder.paidAt ?? new Date(),
          },
        })
      })
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
          throw new Error(`No se pudo liberar stock para ${freshOrder.orderNumber}`)
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