import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { sendOrderPaidEmails } from '@/lib/order-email';
import { stockManager } from '@/lib/stock-manager';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const stripeSecretKey = await getStripeSecretKey()
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY no está configurada' }, { status: 503 })
  }
  const stripe = new Stripe(stripeSecretKey, {
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

      case 'payment_intent.canceled': {
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
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

  if (!orderId) {
    console.error('No orderId in session metadata');
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        return { status: 'missing' as const };
      }

      if (order.paymentStatus === 'PAID') {
        return { status: 'already-paid' as const, orderNumber: order.orderNumber };
      }

      const confirmed = await stockManager.confirmItems(order.items, order.weekId, tx)
      if (!confirmed) {
        throw new Error(`No se pudo confirmar stock para el pedido ${order.orderNumber}`)
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          status: order.status === 'PENDING' ? 'PAID' : order.status,
          paymentMethod: 'stripe',
          paidAt: order.paidAt ?? new Date(),
          stripePaymentId: paymentIntentId ?? order.stripePaymentId,
        },
      })

      return {
        status: 'paid' as const,
        order: {
          ...order,
          orderNumber: updatedOrder.orderNumber,
          paymentStatus: updatedOrder.paymentStatus,
          status: updatedOrder.status,
          paymentMethod: updatedOrder.paymentMethod,
          paidAt: updatedOrder.paidAt,
          stripePaymentId: updatedOrder.stripePaymentId,
        },
      }
    })

    if (result.status === 'missing') {
      console.error('Order not found:', orderId);
      return;
    }

    if (result.status === 'already-paid') {
      console.log('Order already confirmed:', result.orderNumber);
      return;
    }

    console.log('Order completed:', result.order.orderNumber);

    const emailResult = await sendOrderPaidEmails(result.order)
    if (emailResult.skipped) {
      console.log('Order email skipped: RESEND_API_KEY no configurada')
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = String(paymentIntent.metadata?.orderId ?? '')

  const result = await prisma.$transaction(async (tx) => {
    const order = orderId
      ? await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        })
      : await tx.order.findFirst({
          where: {
            stripePaymentId: paymentIntent.id,
          },
          include: {
            items: true,
          },
        })

    if (!order) {
      return { status: 'missing' as const }
    }

    if (order.paymentStatus === 'PAID') {
      return { status: 'already-paid' as const, orderNumber: order.orderNumber }
    }

    if (order.paymentStatus === 'FAILED' || order.status === 'CANCELLED') {
      return { status: 'already-failed' as const, orderNumber: order.orderNumber }
    }

    const released = await stockManager.releaseItems(order.items, order.weekId, tx)
    if (!released) {
      throw new Error(`No se pudo liberar stock para el pedido ${order.orderNumber}`)
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
        paymentMethod: 'stripe',
        stripePaymentId: paymentIntent.id,
      },
    })

    return { status: 'failed' as const, orderNumber: updatedOrder.orderNumber }
  })

  if (result.status === 'missing') {
    console.error('Order not found for payment intent:', paymentIntent.id);
    return;
  }

  if (result.status === 'already-paid' || result.status === 'already-failed') {
    console.log('Ignoring payment failure for order:', result.orderNumber);
    return;
  }

  console.log('Payment failed for order:', result.orderNumber);
}
