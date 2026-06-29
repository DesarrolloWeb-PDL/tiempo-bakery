import { NextRequest, NextResponse } from 'next/server';
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDERS,
  type PaymentProvider,
  getPaymentSettings,
  isPaymentProvider,
  setBankTransferSettings,
  setDefaultPaymentProvider,
  setStripeSecretKey,
  setMercadoPagoAccessToken,
  getStripeSecretKey,
  getMercadoPagoAccessToken,
} from '@/lib/payments';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  defaultProvider: z.enum(PAYMENT_PROVIDERS),
  stripeSecretKey: z.string().max(500).optional().default(''),
  mercadopagoAccessToken: z.string().max(500).optional().default(''),
  bankTransfer: z.object({
    enabled: z.boolean(),
    bankName: z.string().max(120),
    accountHolder: z.string().max(120),
    alias: z.string().max(120),
    cbu: z.string().max(80),
    cuit: z.string().max(30),
    notes: z.string().max(500),
  }),
});

export async function GET() {
  const settings = await getPaymentSettings();
  const stripeSecretKey = await getStripeSecretKey();
  const mercadopagoAccessToken = await getMercadoPagoAccessToken();

  return NextResponse.json({
    ...settings,
    stripeSecretKey: stripeSecretKey ?? '',
    mercadopagoAccessToken: mercadopagoAccessToken ?? '',
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
    const { defaultProvider, stripeSecretKey, mercadopagoAccessToken, bankTransfer } = parsed.data;

    const bankTransferWillBeEnabled =
      bankTransfer.enabled &&
      (bankTransfer.alias.trim() || bankTransfer.cbu.trim() || bankTransfer.bankName.trim());

    if (bankTransfer.enabled && !bankTransferWillBeEnabled) {
      return NextResponse.json(
        { error: 'Completá al menos banco, alias o CBU para habilitar la transferencia bancaria' },
        { status: 400 }
      );
    }

    const stripeWillBeEnabled = !!stripeSecretKey.trim() && !!process.env.NEXT_PUBLIC_URL;
    const mpWillBeEnabled = !!mercadopagoAccessToken.trim() && !!process.env.NEXT_PUBLIC_URL;

    const nextEnabledProviders: PaymentProvider[] = [
      ...(stripeWillBeEnabled ? ['STRIPE' as PaymentProvider] : []),
      ...(mpWillBeEnabled ? ['MERCADO_PAGO' as PaymentProvider] : []),
      ...settings.enabledProviders.filter(
        (p) =>
          (p === 'STRIPE' && !stripeWillBeEnabled) ||
          (p === 'MERCADO_PAGO' && !mpWillBeEnabled)
      ),
    ];

    if (bankTransferWillBeEnabled && !nextEnabledProviders.includes('BANK_TRANSFER')) {
      nextEnabledProviders.push('BANK_TRANSFER');
    }

    if (!isPaymentProvider(defaultProvider) || !nextEnabledProviders.includes(defaultProvider)) {
      return NextResponse.json(
        { error: 'El proveedor seleccionado no está habilitado en el entorno' },
        { status: 400 }
      );
    }

    if (stripeSecretKey.trim()) {
      await setStripeSecretKey(stripeSecretKey.trim());
    }

    if (mercadopagoAccessToken.trim()) {
      await setMercadoPagoAccessToken(mercadopagoAccessToken.trim());
    }

    await setBankTransferSettings(bankTransfer);

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