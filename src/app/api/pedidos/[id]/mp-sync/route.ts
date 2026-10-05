import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncOrderFromMercadoPago } from '@/lib/mp-payment-sync';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const email = request.nextUrl.searchParams.get('email');

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (email && email.toLowerCase() !== order.customerEmail.toLowerCase()) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (order.paymentStatus !== 'PAID') {
      await syncOrderFromMercadoPago(order.id);
    }

    const updated = await prisma.order.findUnique({ where: { id } });

    if (!updated) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      paymentStatus: updated.paymentStatus,
      status: updated.status,
      paidAt: updated.paidAt,
      mercadopagoPaymentId: updated.mercadopagoPaymentId,
    });
  } catch (error) {
    console.error('Error syncing order with Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar el pago' },
      { status: 500 }
    );
  }
}
