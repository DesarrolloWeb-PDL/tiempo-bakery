import { prisma } from '@/lib/db';
import { stockManager } from '@/lib/stock-manager';

export const PENDING_ORDER_TTL_MS = 2 * 60 * 60 * 1000;

export async function expirePendingOrders(
  ttlMs: number = PENDING_ORDER_TTL_MS
): Promise<{ expired: number }> {
  const cutoff = new Date(Date.now() - ttlMs);

  const candidates = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: { in: ['stripe', 'mercadopago'] },
      createdAt: { lt: cutoff },
      deletedAt: null,
    },
    select: { id: true },
  });

  let expired = 0;

  for (const candidate of candidates) {
    const cancelled = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: candidate.id },
        include: { items: true },
      });

      if (
        !order ||
        order.status !== 'PENDING' ||
        order.paymentStatus !== 'PENDING' ||
        order.deletedAt
      ) {
        return false
      }

      const released = await stockManager.releaseItems(order.items, order.weekId, tx)
      if (!released) {
        throw new Error(`No se pudo liberar la reserva del pedido ${order.orderNumber}`)
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
          adminNotes: 'Pedido expirado automáticamente por falta de pago (2h)',
        },
      })

      return true
    })

    if (cancelled) {
      expired += 1
    }
  }

  return { expired }
}
