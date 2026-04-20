import { prisma } from '@/lib/db';

export const PAYMENT_PROVIDERS = ['STRIPE', 'MERCADO_PAGO'] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  STRIPE: 'Tarjeta con Stripe',
  MERCADO_PAGO: 'Mercado Pago',
};

const DEFAULT_PROVIDER: PaymentProvider = 'STRIPE';
const SITE_CONFIG_KEY = 'default_payment_provider';

export function isPaymentProvider(value: string): value is PaymentProvider {
  return PAYMENT_PROVIDERS.includes(value as PaymentProvider);
}

export function getEnabledPaymentProvidersFromEnv(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];

  if (process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_URL) {
    providers.push('STRIPE');
  }

  if (process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.NEXT_PUBLIC_URL) {
    providers.push('MERCADO_PAGO');
  }

  return providers;
}

export async function getPaymentSettings() {
  const enabledProviders = getEnabledPaymentProvidersFromEnv();

  let configuredDefault: string | null = null;

  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: SITE_CONFIG_KEY },
      select: { value: true },
    });

    configuredDefault = config?.value ?? null;
  } catch (error) {
    console.error('Error reading payment settings:', error);
  }

  const defaultProvider = isPaymentProvider(configuredDefault ?? '') && enabledProviders.includes(configuredDefault)
    ? configuredDefault
    : enabledProviders[0] ?? DEFAULT_PROVIDER;

  return {
    enabledProviders,
    defaultProvider,
  };
}

export async function setDefaultPaymentProvider(provider: PaymentProvider) {
  await prisma.siteConfig.upsert({
    where: { key: SITE_CONFIG_KEY },
    update: { value: provider },
    create: { key: SITE_CONFIG_KEY, value: provider },
  });
}