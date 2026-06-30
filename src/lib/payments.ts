import { prisma } from '@/lib/db'

export const PAYMENT_PROVIDERS = ['STRIPE', 'MERCADO_PAGO', 'BANK_TRANSFER'] as const

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number]

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  STRIPE: 'Tarjeta con Stripe',
  MERCADO_PAGO: 'Mercado Pago',
  BANK_TRANSFER: 'Transferencia bancaria',
}

export const ORDER_PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: 'Tarjeta con Stripe',
  mercadopago: 'Mercado Pago',
  bank_transfer: 'Transferencia bancaria',
}

export function formatOrderPaymentMethod(value: string) {
  return ORDER_PAYMENT_METHOD_LABELS[value] ?? value
}

export interface BankTransferSettings {
  enabled: boolean;
  bankName: string;
  accountHolder: string;
  alias: string;
  cbu: string;
  cuit: string;
  notes: string;
}

const DEFAULT_BANK_TRANSFER_SETTINGS: BankTransferSettings = {
  enabled: false,
  bankName: '',
  accountHolder: '',
  alias: '',
  cbu: '',
  cuit: '',
  notes: '',
}

const DEFAULT_PROVIDER: PaymentProvider = 'STRIPE'
const SITE_CONFIG_KEY = 'default_payment_provider'
const BANK_TRANSFER_PREFIX = 'payment_bank_transfer_'

function isFilled(value: string) {
  return value.trim().length > 0
}

function parseBoolean(value: string | null | undefined) {
  return value === 'true' || value === '1' || value === 'yes'
}

function normalizeSetting(value: string | null | undefined) {
  return value?.trim() ?? ''
}

export function isPaymentProvider(value: string): value is PaymentProvider {
  return PAYMENT_PROVIDERS.includes(value as PaymentProvider)
}

export async function getStripeSecretKey(): Promise<string | null> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { key: 'stripe_secret_key' },
      select: { value: true },
    })
    if (row?.value?.trim()) return row.value.trim()
  } catch {}
  return process.env.STRIPE_SECRET_KEY ?? null
}

export async function setStripeSecretKey(key: string) {
  await prisma.siteConfig.upsert({
    where: { key: 'stripe_secret_key' },
    create: { key: 'stripe_secret_key', value: key },
    update: { value: key },
  })
}

export async function getMercadoPagoAccessToken(): Promise<string | null> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { key: 'mercadopago_access_token' },
      select: { value: true },
    })
    if (row?.value?.trim()) return row.value.trim()
  } catch {}
  return process.env.MERCADOPAGO_ACCESS_TOKEN ?? null
}

export async function setMercadoPagoAccessToken(token: string) {
  await prisma.siteConfig.upsert({
    where: { key: 'mercadopago_access_token' },
    create: { key: 'mercadopago_access_token', value: token },
    update: { value: token },
  })
}

export async function getEnabledPaymentProviders(): Promise<PaymentProvider[]> {
  const providers: PaymentProvider[] = []

  const stripeKey = await getStripeSecretKey()
  const mpToken = await getMercadoPagoAccessToken()

  if (stripeKey) {
    providers.push('STRIPE')
  }

  if (mpToken) {
    providers.push('MERCADO_PAGO')
  }

  return providers
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
}

export async function getBankTransferSettings(): Promise<BankTransferSettings> {
  try {
    const rows = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            `${BANK_TRANSFER_PREFIX}enabled`,
            `${BANK_TRANSFER_PREFIX}bank_name`,
            `${BANK_TRANSFER_PREFIX}account_holder`,
            `${BANK_TRANSFER_PREFIX}alias`,
            `${BANK_TRANSFER_PREFIX}cbu`,
            `${BANK_TRANSFER_PREFIX}cuit`,
            `${BANK_TRANSFER_PREFIX}notes`,
          ],
        },
      },
    })

    const map = new Map(rows.map((row) => [row.key, row.value]))

    return {
      enabled: parseBoolean(map.get(`${BANK_TRANSFER_PREFIX}enabled`)),
      bankName: normalizeSetting(map.get(`${BANK_TRANSFER_PREFIX}bank_name`)),
      accountHolder: normalizeSetting(map.get(`${BANK_TRANSFER_PREFIX}account_holder`)),
      alias: normalizeSetting(map.get(`${BANK_TRANSFER_PREFIX}alias`)),
      cbu: normalizeSetting(map.get(`${BANK_TRANSFER_PREFIX}cbu`)),
      cuit: normalizeSetting(map.get(`${BANK_TRANSFER_PREFIX}cuit`)),
      notes: normalizeSetting(map.get(`${BANK_TRANSFER_PREFIX}notes`)),
    }
  } catch (error) {
    console.error('Error reading bank transfer settings:', error)
    return DEFAULT_BANK_TRANSFER_SETTINGS
  }
}

export async function setBankTransferSettings(settings: BankTransferSettings) {
  const entries = {
    enabled: settings.enabled ? 'true' : 'false',
    bank_name: settings.bankName,
    account_holder: settings.accountHolder,
    alias: settings.alias,
    cbu: settings.cbu,
    cuit: settings.cuit,
    notes: settings.notes,
  }

  await prisma.$transaction(
    Object.entries(entries).map(([suffix, value]) =>
      prisma.siteConfig.upsert({
        where: { key: `${BANK_TRANSFER_PREFIX}${suffix}` },
        create: { key: `${BANK_TRANSFER_PREFIX}${suffix}`, value },
        update: { value },
      })
    )
  )
}

interface PaymentSettings {
  enabledProviders: PaymentProvider[]
  defaultProvider: PaymentProvider
  bankTransfer: BankTransferSettings
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const enabledProviders = await getEnabledPaymentProviders()
  const bankTransfer = await getBankTransferSettings()

  if (bankTransfer.enabled && (isFilled(bankTransfer.alias) || isFilled(bankTransfer.cbu) || isFilled(bankTransfer.bankName))) {
    enabledProviders.push('BANK_TRANSFER')
  }

  let configuredDefault: string | null = null

  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: SITE_CONFIG_KEY },
      select: { value: true },
    })

    configuredDefault = config?.value ?? null
  } catch (error) {
    console.error('Error reading payment settings:', error)
  }

  const configuredProvider: PaymentProvider | null = isPaymentProvider(configuredDefault ?? '')
    ? (configuredDefault as PaymentProvider)
    : null

  const defaultProvider = configuredProvider && enabledProviders.includes(configuredProvider)
    ? configuredProvider
    : enabledProviders[0] ?? DEFAULT_PROVIDER

  return {
    enabledProviders,
    defaultProvider,
    bankTransfer,
  }
}

export async function setDefaultPaymentProvider(provider: PaymentProvider) {
  await prisma.siteConfig.upsert({
    where: { key: SITE_CONFIG_KEY },
    update: { value: provider },
    create: { key: SITE_CONFIG_KEY, value: provider },
  })
}