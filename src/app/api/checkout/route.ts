import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { stockManager } from '@/lib/stock-manager';
import { getTimeGatingRuntime } from '@/lib/time-gating';
import { getShippingCostByMethod, getShippingCostsRuntime } from '@/lib/shipping-costs';
import Stripe from 'stripe';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const checkoutSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(9),
  deliveryMethod: z.enum(['PICKUP_POINT', 'LOCAL_DELIVERY', 'NATIONAL_COURIER']),
  pickupLocationId: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingPostal: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      sliced: z.boolean().default(true),
    })
  ),
  customerNotes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });

  try {
    // 1. Verificar time-gating
    const { enabled, service } = await getTimeGatingRuntime();
    const gatingStatus = service.getTimeUntilOpening();
    if (enabled && !gatingStatus.isOpen) {
      return NextResponse.json(
        { error: 'El sitio está cerrado para pedidos' },
        { status: 403 }
      );
    }

    // 2. Validar datos
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // 3. Verificar stock para todos los productos
    const weekId = service.getCurrentWeekId();
    const stockChecks = await Promise.all(
      data.items.map((item) =>
        stockManager.checkAvailability(item.productId, item.quantity, weekId)
      )
    );

    const outOfStockItems = stockChecks
      .map((check, index) => ({ ...check, ...data.items[index] }))
      .filter((item) => !item.available);

    if (outOfStockItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Algunos productos no tienen stock suficiente',
          outOfStockItems,
        },
        { status: 400 }
      );
    }

    // 4. Obtener detalles de productos y calcular totales
    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
    });

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        sliced: item.sliced,
      };
    });

    // 5. Calcular costos de envío
    const shippingCosts = await getShippingCostsRuntime();
    const shippingCost = getShippingCostByMethod(data.deliveryMethod, shippingCosts);

    const total = subtotal + shippingCost;

    // 6. Obtener/crear usuario
    let user = await prisma.user.findUnique({
      where: { email: data.customerEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.customerEmail,
          name: data.customerName,
          phone: data.customerPhone,
        },
      });
    }

    // 7. Generar número de pedido
    const orderCount = await prisma.order.count();
    const orderNumber = `TBK-${new Date().getFullYear()}-${String(
      orderCount + 1
    ).padStart(4, '0')}`;

    // 8. Obtener detalles del punto de recogida si aplica
    let pickupDetails = null;
    if (data.deliveryMethod === 'PICKUP_POINT' && data.pickupLocationId) {
      pickupDetails = await prisma.pickupPoint.findUnique({
        where: { id: data.pickupLocationId },
      });
    }

    // 9. Crear orden en estado PENDING
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        weekId,
        subtotal,
        shippingCost,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryMethod: data.deliveryMethod,
        pickupLocation: pickupDetails?.name,
        pickupAddress: pickupDetails?.address,
        pickupSchedule: pickupDetails?.schedule,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingPostal: data.shippingPostal,
        customerNotes: data.customerNotes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 10. Reservar stock
    await Promise.all(
      data.items.map((item) =>
        stockManager.reserveStock(item.productId, item.quantity, weekId)
      )
    );

    // 11. Crear sesión de pago en Stripe
    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: 'ars',
        product_data: {
          name: item.productName,
          description: item.sliced ? 'Rebanado' : 'Sin rebanar',
        },
        unit_amount: Math.round(Number(item.unitPrice) * 100), // Centavos
      },
      quantity: item.quantity,
    }));

    // Agregar shipping como línea adicional si existe
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'ars',
          product_data: {
            name: 'Gastos de envío',
            description:
              data.deliveryMethod === 'NATIONAL_COURIER'
                ? 'Mensajería nacional'
                : 'Envío local',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/pedido/${order.id}/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout?cancelled=true`,
      customer_email: data.customerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    // 12. Actualizar orden con ID de Stripe
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentId: session.id },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error procesando el pedido',
      },
      { status: 500 }
    );
  }
}
