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
  getStripeKeyMask,
  getMercadoPagoKeyMask,
  getStripeConfigured,
  getMercadoPagoConfigured,
} from '@/lib/payments';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  defaultProvider: z.enum(PAYMENT_PROVIDERS),
  bankTransfer: z.object({
    enabled: z.boolean(),
    bankName: z.string().max(120),
    accountHolder: z.string().max(120),
    alias: z.string().max(120),
    cbu: z.string().max(80),
    cuit: z.string().max(30),
    notes: z.string().max(500),
  }),
  stripeSecretKey: z.string().max(200).optional(),
  mercadopagoAccessToken: z.string().max(200).optional(),
});

export async function GET() {
  const settings = await getPaymentSettings();
  const stripeKeyMask = await getStripeKeyMask();
  const mercadopagoKeyMask = await getMercadoPagoKeyMask();
  const stripeConfigured = await getStripeConfigured();
  const mercadopagoConfigured = await getMercadoPagoConfigured();

  return NextResponse.json({
    ...settings,
    stripeKeyMask,
    mercadopagoKeyMask,
    stripeConfigured,
    mercadopagoConfigured,
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
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const settings = await getPaymentSettings();
    const { defaultProvider, bankTransfer, stripeSecretKey, mercadopagoAccessToken } = parsed.data;

    if (stripeSecretKey !== undefined) {
      await setStripeSecretKey(stripeSecretKey);
    }

    if (mercadopagoAccessToken !== undefined) {
      await setMercadoPagoAccessToken(mercadopagoAccessToken);
    }

    const stripeConfigured = await getStripeConfigured();
    const mercadopagoConfigured = await getMercadoPagoConfigured();

    const bankTransferWillBeEnabled =
      bankTransfer.enabled &&
      (bankTransfer.alias.trim() || bankTransfer.cbu.trim() || bankTransfer.bankName.trim());

    if (bankTransfer.enabled && !bankTransferWillBeEnabled) {
      return NextResponse.json(
        { error: 'Completá al menos banco, alias o CBU para habilitar la transferencia bancaria' },
        { status: 400 }
      );
    }

    await setBankTransferSettings(bankTransfer);

    const nextEnabledProviders: PaymentProvider[] = [];
    if (stripeConfigured) nextEnabledProviders.push('STRIPE');
    if (mercadopagoConfigured) nextEnabledProviders.push('MERCADO_PAGO');
    if (bankTransferWillBeEnabled) nextEnabledProviders.push('BANK_TRANSFER');

    if (!nextEnabledProviders.length) {
      return NextResponse.json(
        { error: 'No hay ningún medio de pago configurado. Activá al menos uno.' },
        { status: 400 }
      );
    }

    if (!isPaymentProvider(defaultProvider) || !nextEnabledProviders.includes(defaultProvider)) {
      return NextResponse.json(
        { error: 'El proveedor seleccionado no está habilitado' },
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
