import { NextResponse } from 'next/server';
import { PAYMENT_PROVIDER_LABELS, getPaymentSettings } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getPaymentSettings();

  return NextResponse.json({
    defaultProvider: settings.defaultProvider,
    enabledProviders: settings.enabledProviders,
    options: settings.enabledProviders.map((provider) => ({
      value: provider,
      label: PAYMENT_PROVIDER_LABELS[provider],
    })),
  });
}