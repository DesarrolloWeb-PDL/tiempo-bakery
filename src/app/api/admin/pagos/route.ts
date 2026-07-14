import { NextRequest, NextResponse } from 'next/server';
import {
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_PROVIDERS,
  type PaymentProvider,
  getPaymentSettings,
  setBankTransferSettings,
  setDefaultPaymentProvider,
  setStripeSecretKey,
  setMercadoPagoAccessToken,
  getStripeSecretKey,
  getMercadoPagoAccessToken,
  deleteStripeSecretKey,
  deleteMercadoPagoAccessToken,
} from '@/lib/payments';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  defaultProvider: z.enum(PAYMENT_PROVIDERS),
  stripeEnabled: z.boolean().optional().default(false),
  mercadopagoEnabled: z.boolean().optional().default(false),
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
    stripeEnabled: settings.enabledProviders.includes('STRIPE'),
    mercadopagoEnabled: settings.enabledProviders.includes('MERCADO_PAGO'),
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

    const { defaultProvider, stripeEnabled, mercadopagoEnabled, stripeSecretKey, mercadopagoAccessToken, bankTransfer } = parsed.data;

    const bankTransferWillBeEnabled =
      bankTransfer.enabled &&
      (bankTransfer.alias.trim() || bankTransfer.cbu.trim() || bankTransfer.bankName.trim());

    if (bankTransfer.enabled && !bankTransferWillBeEnabled) {
      return NextResponse.json(
        { error: 'Completá al menos banco, alias o CBU para habilitar la transferencia bancaria' },
        { status: 400 }
      );
    }

    // Guardar o eliminar credenciales según el estado enabled
    if (stripeEnabled) {
      if (!stripeSecretKey.trim()) {
        return NextResponse.json(
          { error: 'Stripe está habilitado pero no ingresaste la Secret Key' },
          { status: 400 }
        );
      }
      await setStripeSecretKey(stripeSecretKey.trim());
    } else {
      await deleteStripeSecretKey();
    }

    if (mercadopagoEnabled) {
      if (!mercadopagoAccessToken.trim()) {
        return NextResponse.json(
          { error: 'Mercado Pago está habilitado pero no ingresaste el Access Token' },
          { status: 400 }
        );
      }
      await setMercadoPagoAccessToken(mercadopagoAccessToken.trim());
    } else {
      await deleteMercadoPagoAccessToken();
    }

    await setBankTransferSettings(bankTransfer);

    const nextEnabledProviders: PaymentProvider[] = [];
    if (stripeEnabled) nextEnabledProviders.push('STRIPE');
    if (mercadopagoEnabled) nextEnabledProviders.push('MERCADO_PAGO');
    if (bankTransferWillBeEnabled) nextEnabledProviders.push('BANK_TRANSFER');

    const finalDefault = nextEnabledProviders.includes(defaultProvider as PaymentProvider)
      ? defaultProvider
      : nextEnabledProviders[0] ?? defaultProvider;

    await setDefaultPaymentProvider(finalDefault);

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