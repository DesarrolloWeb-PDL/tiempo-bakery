import { prisma } from '@/lib/db';
import { sendOrderPaidEmails } from '@/lib/order-email';
import { stockManager } from '@/lib/stock-manager';
import { searchMercadoPagoPaymentByExternalReference } from '@/lib/mercadopago';

export type MpSyncResult =
  | 'paid'
  | 'failed'
  | 'pending'
  | 'already-paid'
  | 'not-found'
  | 'no-payment';

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

/**
 * Apply a known Mercado Pago payment to an order.
 * Shared by the webhook route and syncOrderFromMercadoPago.
 */
export async function applyMercadoPagoPaymentToOrder(
  orderId: string,
  payment: { id: string | number; status?: string }
): Promise<MpSyncResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return 'not-found';

  const mappedStatus = mapMercadoPagoStatus(payment.status);

  if (mappedStatus === 'PAID') {
    if (order.paymentStatus === 'PAID') {
      return 'already-paid';
    }

    const result = await prisma.$transaction(async (tx) => {
      const freshOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (!freshOrder || freshOrder.paymentStatus === 'PAID') {
        return { status: 'already-paid' as const };
      }

      const confirmed = await stockManager.confirmItems(freshOrder.items, freshOrder.weekId, tx);
      if (!confirmed) {
        throw new Error('No se pudo confirmar stock para ' + freshOrder.orderNumber);
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
      });

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
      };
    });

    if (result.status === 'paid') {
      const emailResult = await sendOrderPaidEmails(result.order);
      if (emailResult.skipped) {
        console.log('Order email skipped: RESEND_API_KEY no configurada');
      }
    }

    return result.status;
  }

  if (mappedStatus === 'FAILED') {
    if (order.paymentStatus === 'PAID') return 'already-paid';
    if (order.paymentStatus === 'FAILED' || order.status === 'CANCELLED') return 'failed';

    await prisma.$transaction(async (tx) => {
      const freshOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      if (
        !freshOrder ||
        freshOrder.paymentStatus === 'FAILED' ||
        freshOrder.status === 'CANCELLED' ||
        freshOrder.paymentStatus === 'PAID'
      ) {
        return;
      }

      const released = await stockManager.releaseItems(freshOrder.items, freshOrder.weekId, tx);
      if (!released) {
        throw new Error('No se pudo liberar stock para ' + freshOrder.orderNumber);
      }

      await tx.order.update({
        where: { id: freshOrder.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
          paymentMethod: 'mercadopago',
          mercadopagoPaymentId: String(payment.id),
        },
      });
    });

    return 'failed';
  }

  // PENDING — never downgrade an already-paid order (stale webhook guard)
  if (order.paymentStatus === 'PAID') {
    return 'already-paid';
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PENDING',
      paymentMethod: 'mercadopago',
      mercadopagoPaymentId: String(payment.id),
    },
  });

  return 'pending';
}

/**
 * Sync an order with Mercado Pago by searching payments
 * for its external_reference and applying the latest relevant one.
 */
export async function syncOrderFromMercadoPago(orderId: string): Promise<MpSyncResult> {
  const payment = await searchMercadoPagoPaymentByExternalReference(orderId);

  if (!payment || !payment.id) return 'no-payment';

  return applyMercadoPagoPaymentToOrder(orderId, {
    id: payment.id,
    status: payment.status,
  });
}
