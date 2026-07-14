import nextEnv from '@next/env';
import { createConfiguredPrismaClient } from '../src/lib/prisma-client';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const prisma = createConfiguredPrismaClient();

  try {
    console.log('=== Simulando proceso de checkout ===\n');

    // 1. Time gating
    const { getTimeGatingRuntime } = await import('../src/lib/time-gating');
    const { enabled, service } = await getTimeGatingRuntime();
    const gatingStatus = service.getTimeUntilOpening();
    console.log('1. Time gating:', enabled ? 'enabled' : 'disabled', '| isOpen:', gatingStatus.isOpen);

    // 2. Payment settings
    const { getPaymentSettings } = await import('../src/lib/payments');
    const paymentSettings = await getPaymentSettings();
    console.log('2. Payment settings:', paymentSettings.enabledProviders, '| default:', paymentSettings.defaultProvider);

    // 3. Get product
    const product = await prisma.product.findFirst({
      where: { published: true, isActive: true },
    });
    if (!product) {
      console.error('3. No hay productos publicados');
      return;
    }
    console.log('3. Producto:', product.name, '| price:', product.price, '| id:', product.id);

    // 4. Stock check
    const { stockManager } = await import('../src/lib/stock-manager');
    const weekId = service.getCurrentWeekId();
    console.log('4. Week ID:', weekId);
    const stockCheck = await stockManager.checkAvailability(product.id, 1, weekId);
    console.log('   Stock check:', stockCheck);

    // 5. Simulate the entire transaction
    console.log('\n5. Ejecutando transacción...');
    const weekId2 = service.getCurrentWeekId();
    
    try {
      const order = await prisma.$transaction(async (tx) => {
        console.log('   a) Upsert user...');
        const user = await tx.user.upsert({
          where: { email: 'test@example.com' },
          update: { name: 'Test User', phone: '123456789' },
          create: { email: 'test@example.com', name: 'Test User', phone: '123456789' },
        });
        console.log('      User:', user.id, user.email);

        console.log('   b) Order count...');
        const orderCount = await tx.order.count();
        const orderNumber = `TBK-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;
        console.log('      Order number:', orderNumber);

        console.log('   c) Reserve stock...');
        const reservation = await stockManager.reserveItems(
          [{ productId: product.id, quantity: 1 }],
          weekId2,
          tx
        );
        console.log('      Reservation:', reservation);

        console.log('   d) Create order...');
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            customerEmail: 'test@example.com',
            customerName: 'Test User',
            customerPhone: '123456789',
            weekId: weekId2,
            subtotal: Number(product.price),
            shippingCost: 0,
            total: Number(product.price),
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: 'mercadopago',
            deliveryMethod: 'PICKUP_POINT',
            items: {
              create: [{
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                subtotal: Number(product.price),
                sliced: true,
              }],
            },
          },
          include: { items: true },
        });
        console.log('      Order created:', newOrder.id, newOrder.orderNumber);

        return newOrder;
      });

      console.log('\n✅ Transacción completada! Order:', order.id);

      // Rollback - borrar la orden de prueba
      console.log('\n6. Limpiando orden de prueba...');
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.order.delete({ where: { id: order.id } });
      console.log('   Limpio!');

    } catch (txError: any) {
      console.error('\n❌ Error en transacción:', txError.message);
      console.error('   Stack:', txError.stack?.split('\n').slice(0, 5).join('\n'));
    }

    console.log('\n=== Fin de la simulación ===');
  } catch (error: any) {
    console.error('FATAL:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
