import { NextRequest, NextResponse } from 'next/server';
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDERS,
  getPaymentSettings,
  isPaymentProvider,
  setDefaultPaymentProvider,
} from '@/lib/payments';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  defaultProvider: z.enum(PAYMENT_PROVIDERS),
});

export async function GET() {
  const settings = await getPaymentSettings();

  return NextResponse.json({
    ...settings,
    options: PAYMENT_PROVIDERS.map((provider) => ({
      value: provider,
      label: PAYMENT_PROVIDER_LABELS[provider],
      enabled: settings.enabledProviders.includes(provider),
    })),
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const settings = await getPaymentSettings();
    const { defaultProvider } = parsed.data;

    if (!isPaymentProvider(defaultProvider) || !settings.enabledProviders.includes(defaultProvider)) {
      return NextResponse.json(
        { error: 'El proveedor seleccionado no está habilitado en el entorno' },
        { status: 400 }
      );
    }

    await setDefaultPaymentProvider(defaultProvider);

    return NextResponse.json({
      success: true,
      defaultProvider,
      label: PAYMENT_PROVIDER_LABELS[defaultProvider],
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json({ error: 'No se pudo guardar la configuración de pagos' }, { status: 500 });
  }
}