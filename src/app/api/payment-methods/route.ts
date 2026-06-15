import { NextResponse } from 'next/server';
import { PAYMENT_PROVIDER_LABELS, getPaymentSettings } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getPaymentSettings();

  return NextResponse.json({
    defaultProvider: settings.defaultProvider,
    enabledProviders: settings.enabledProviders,
    bankTransfer: settings.bankTransfer,
    options: settings.enabledProviders.map((provider) => ({
      value: provider,
      label: PAYMENT_PROVIDER_LABELS[provider],
      description:
        provider === 'BANK_TRANSFER'
          ? 'Transferencia manual con los datos configurados en el panel.'
          : provider === 'MERCADO_PAGO'
            ? 'Checkout Pro con billetera, tarjetas y medios locales.'
            : 'Pago con tarjeta redirigido a Stripe Checkout.',
    })),
  });
}