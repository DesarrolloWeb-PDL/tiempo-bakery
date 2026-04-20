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
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: order.status === 'PENDING' ? 'PAID' : order.status,
          paymentMethod: 'mercadopago',
          mercadopagoPaymentId: String(payment.id),
          paidAt: new Date(),
        },
      });

      for (const item of order.items) {
        await stockManager.confirmSale(item.productId, item.quantity, order.weekId);
      }
    }

    if (mappedStatus === 'FAILED' && order.paymentStatus !== 'FAILED' && order.paymentStatus !== 'PAID') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
          paymentMethod: 'mercadopago',
          mercadopagoPaymentId: String(payment.id),
        },
      });

      for (const item of order.items) {
        await stockManager.releaseStock(item.productId, item.quantity, order.weekId);
      }
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