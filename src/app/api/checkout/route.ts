import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { stockManager } from '@/lib/stock-manager';
import { expirePendingOrders } from '@/lib/order-expiry';
import { getTimeGatingRuntime } from '@/lib/time-gating';
import { getShippingCostByMethod, getShippingCostsRuntime } from '@/lib/shipping-costs';
import { createMercadoPagoPreference } from '@/lib/mercadopago';
import { PaymentProvider, getPaymentSettings, getStripeSecretKey, getMercadoPagoAccessToken, getSiteUrl } from '@/lib/payments';
import Stripe from 'stripe';
import { z } from 'zod';
import { checkoutSchema } from '@/types/checkout';
import { apiError, apiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

class StockReservationError extends Error {
  constructor(public readonly productId: string) {
    super(`No hay stock suficiente para ${productId}`)
    this.name = 'StockReservationError'
  }
}

async function rollbackPendingOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order || order.paymentStatus === 'PAID') {
      return
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
      },
    })
  })
}

function randomOrderSuffix(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar time-gating
    const { enabled, service } = await getTimeGatingRuntime();
    const gatingStatus = service.getTimeUntilOpening();
    if (enabled && !gatingStatus.isOpen) {
      return apiError('El sitio está cerrado para pedidos', 403);
    }

    // Expiración lazy: liberar stock de pedidos PENDING viejos antes de crear uno nuevo
    try {
      await expirePendingOrders()
    } catch (expiryError) {
      console.error('Error en expiración lazy de pedidos:', expiryError)
    }

    // 2. Validar datos
    const body = await request.json();
    const data = checkoutSchema.parse(body);
    const paymentSettings = await getPaymentSettings();
    const selectedProvider = (data.paymentProvider as PaymentProvider | undefined) ?? paymentSettings.defaultProvider;

    if (!paymentSettings.enabledProviders.length) {
      return apiError('No hay medios de pago configurados en el servidor', 503);
    }

    if (!paymentSettings.enabledProviders.includes(selectedProvider)) {
      return apiError('El medio de pago seleccionado no está disponible', 400);
    }

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
      return apiError(
        'Algunos productos no tienen stock suficiente',
        400,
        JSON.stringify(outOfStockItems)
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

    const order = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: data.customerEmail },
        update: {
          name: data.customerName,
          phone: data.customerPhone,
        },
        create: {
          email: data.customerEmail,
          name: data.customerName,
          phone: data.customerPhone,
        },
      })

      const orderNumber = `TBK-${new Date().getFullYear()}-${randomOrderSuffix()}`;

      let pickupDetails = null;
      if (data.deliveryMethod === 'PICKUP_POINT' && data.pickupLocationId) {
        pickupDetails = await tx.pickupPoint.findUnique({
          where: { id: data.pickupLocationId },
        });
      }

      const reservation = await stockManager.reserveItems(data.items, weekId, tx)
      if (!reservation.success) {
        throw new StockReservationError(reservation.failedProductId)
      }

      return tx.order.create({
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
          paymentMethod:
            selectedProvider === 'MERCADO_PAGO'
              ? 'mercadopago'
              : selectedProvider === 'BANK_TRANSFER'
                ? 'bank_transfer'
                : 'stripe',
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
      })
    });

    let checkoutUrl: string | null = null;

    try {
      if (selectedProvider === 'STRIPE') {
        const stripeKey = await getStripeSecretKey()
        if (!stripeKey) throw new Error('Falta STRIPE_SECRET_KEY')
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2025-02-24.acacia',
        });

        const lineItems = order.items.map((item) => ({
          price_data: {
            currency: 'ars',
            product_data: {
              name: item.productName,
              description: item.sliced ? 'Rebanado' : 'Sin rebanar',
            },
            unit_amount: Math.round(Number(item.unitPrice) * 100),
          },
          quantity: item.quantity,
        }));

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
          success_url: `${getSiteUrl()}/pedido/${order.id}/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${getSiteUrl()}/checkout?cancelled=true`,
          customer_email: data.customerEmail,
          client_reference_id: order.id,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
          payment_intent_data: {
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
            },
          },
        });

        checkoutUrl = session.url;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            stripePaymentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
          },
        });
      }

      if (selectedProvider === 'MERCADO_PAGO') {
        const mpToken = await getMercadoPagoAccessToken()
        const preference = await createMercadoPagoPreference({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          deliveryMethod: data.deliveryMethod,
          shippingAddress: data.shippingAddress,
          shippingPostal: data.shippingPostal,
          items: order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            sliced: item.sliced,
          })),
          shippingCost,
          accessToken: mpToken ?? undefined,
        });

        checkoutUrl = preference.init_point ?? preference.sandbox_init_point ?? null;

        await prisma.order.update({
          where: { id: order.id },
          data: { mercadopagoPaymentId: preference.id },
        });
      }

      if (selectedProvider === 'BANK_TRANSFER') {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentMethod: 'bank_transfer' },
        });
      }
    } catch (paymentError) {
      await rollbackPendingOrder(order.id)
      throw paymentError
    }

    return apiSuccess({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl,
      paymentProvider: selectedProvider,
    });
  } catch (error) {
    console.error('Checkout error:', error);

    if (error instanceof z.ZodError) {
      return apiError('Datos inválidos', 400, JSON.stringify(error.errors));
    }

    if (error instanceof StockReservationError) {
      return apiError(
        'Algunos productos no tienen stock suficiente',
        400,
        JSON.stringify([{ productId: error.productId }])
      )
    }

    return apiError(
      error instanceof Error ? error.message : 'Error procesando el pedido',
      500
    );
  }
}
