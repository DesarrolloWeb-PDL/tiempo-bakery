import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { stockManager } from '@/lib/stock-manager';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verificar el evento de Stripe
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Manejar el evento
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No orderId in session metadata');
    return;
  }

  try {
    // Obtener la orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Actualizar el estado de la orden
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Confirmar la venta y actualizar el stock
    for (const item of order.items) {
      await stockManager.confirmSale(
        item.productId,
        item.quantity,
        order.weekId
      );
    }

    console.log('Order completed:', order.orderNumber);

    // TODO: Enviar email de confirmación
    // await sendOrderConfirmationEmail(order);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Buscar orden por payment intent
  const order = await prisma.order.findFirst({
    where: {
      stripePaymentId: paymentIntent.id,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    console.error('Order not found for payment intent:', paymentIntent.id);
    return;
  }

  // Actualizar estado
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'FAILED',
      status: 'CANCELLED',
    },
  });

  // Liberar stock reservado
  for (const item of order.items) {
    await stockManager.releaseStock(
      item.productId,
      item.quantity,
      order.weekId
    );
  }

  console.log('Payment failed for order:', order.orderNumber);
}
