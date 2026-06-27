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
const CRED_PREFIX = 'payment_cred_'

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

function maskKey(key: string): string {
  if (key.length <= 8) return '****'
  const suffix = key.slice(-4)
  return `****...${suffix}`
}

function getSingleSetting(key: string): string | null {
  return process.env[key]?.trim() || null
}

export async function getStripeSecretKey(): Promise<string | null> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { key: `${CRED_PREFIX}stripe_secret_key` },
      select: { value: true },
    })
    if (row?.value) return row.value
  } catch {}
  return getSingleSetting('STRIPE_SECRET_KEY')
}

export async function getMercadoPagoAccessToken(): Promise<string | null> {
  try {
    const row = await prisma.siteConfig.findUnique({
      where: { key: `${CRED_PREFIX}mercadopago_access_token` },
      select: { value: true },
    })
    if (row?.value) return row.value
  } catch {}
  return getSingleSetting('MERCADOPAGO_ACCESS_TOKEN')
}

export async function getStripeConfigured(): Promise<boolean> {
  const key = await getStripeSecretKey()
  return !!key
}

export async function getMercadoPagoConfigured(): Promise<boolean> {
  const token = await getMercadoPagoAccessToken()
  return !!token
}

export async function setStripeSecretKey(key: string) {
  if (!key.trim()) {
    await prisma.siteConfig.delete({
      where: { key: `${CRED_PREFIX}stripe_secret_key` },
    }).catch(() => {})
    return
  }
  await prisma.siteConfig.upsert({
    where: { key: `${CRED_PREFIX}stripe_secret_key` },
    create: { key: `${CRED_PREFIX}stripe_secret_key`, value: key.trim() },
    update: { value: key.trim() },
  })
}

export async function setMercadoPagoAccessToken(token: string) {
  if (!token.trim()) {
    await prisma.siteConfig.delete({
      where: { key: `${CRED_PREFIX}mercadopago_access_token` },
    }).catch(() => {})
    return
  }
  await prisma.siteConfig.upsert({
    where: { key: `${CRED_PREFIX}mercadopago_access_token` },
    create: { key: `${CRED_PREFIX}mercadopago_access_token`, value: token.trim() },
    update: { value: token.trim() },
  })
}

export async function getStripeKeyMask(): Promise<string | null> {
  const key = await getStripeSecretKey()
  return key ? maskKey(key) : null
}

export async function getMercadoPagoKeyMask(): Promise<string | null> {
  const token = await getMercadoPagoAccessToken()
  return token ? maskKey(token) : null
}

async function getAvailablePaymentProviders(): Promise<PaymentProvider[]> {
  const providers: PaymentProvider[] = []
  const hasUrl = !!process.env.NEXT_PUBLIC_URL

  if (hasUrl) {
    const stripeKey = await getStripeSecretKey()
    if (stripeKey) providers.push('STRIPE')
    const mpToken = await getMercadoPagoAccessToken()
    if (mpToken) providers.push('MERCADO_PAGO')
  }

  return providers
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
  const enabledProviders = await getAvailablePaymentProviders()
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