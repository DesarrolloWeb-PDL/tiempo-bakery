import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { getMercadoPagoAccessToken } from '@/lib/payments';

let mercadopagoClient: MercadoPagoConfig | null = null;

/** Resolve the MP access token: explicit arg > DB (siteConfig) > env fallback. */
async function resolveMercadoPagoAccessToken(accessToken?: string): Promise<string> {
  const token = accessToken ?? (await getMercadoPagoAccessToken());
  if (!token) {
    throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');
  }
  return token;
}

function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function splitCustomerName(fullName: string) {
  const [name, ...rest] = fullName.trim().split(/\s+/);

  return {
    name: name || fullName,
    surname: rest.join(' ') || undefined,
  };
}

/** Parse Argentine phone: strip country code 54, extract area_code (2 digits) and number */
function parseArgentinePhone(phone: string): { area_code: string; number: string } | undefined {
  if (!phone) return undefined;

  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;

  // Strip leading 0 or 15 (mobile prefix)
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('15') && digits.length > 10) digits = digits.slice(2);

  // Strip country code 54
  if (digits.startsWith('54') && digits.length > 10) digits = digits.slice(2);

  // Argentine phones: 2-digit area code + 8-digit number (landline) or 4+6 (mobile)
  if (digits.length >= 10) {
    return {
      area_code: digits.slice(0, 2),
      number: digits.slice(2),
    };
  }

  // Fallback: 2 + rest
  if (digits.length >= 8) {
    return {
      area_code: digits.slice(0, 2),
      number: digits.slice(2),
    };
  }

  return undefined;
}

export function getMercadoPagoClient(accessToken?: string) {
  const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');
  }

  if (!mercadopagoClient || mercadopagoClient.accessToken !== token) {
    mercadopagoClient = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 10000 },
    });
  }

  return mercadopagoClient;
}

export async function createMercadoPagoPreference(input: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  shippingAddress?: string | null;
  shippingPostal?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    sliced: boolean;
  }>;
  shippingCost: number;
  accessToken?: string;
}) {
  // Stable base URL for back_urls / notification_url:
  // explicit → Vercel production domain → deployment URL → localhost.
  const baseUrl = (process.env.NEXT_PUBLIC_URL?.trim() || '')
    .replace(/\/$/, '') ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    'http://localhost:3000'

  const client = getMercadoPagoClient(input.accessToken);
  const preference = new Preference(client);
  const { name, surname } = splitCustomerName(input.customerName);
  const phone = parseArgentinePhone(input.customerPhone);

  const lineItems = input.items.map((item) => ({
    id: item.productId,
    title: item.productName,
    description: item.sliced ? 'Rebanado' : 'Sin rebanar',
    quantity: item.quantity,
    unit_price: Number(item.unitPrice),
    currency_id: 'ARS',
  }));

  if (input.shippingCost > 0) {
    lineItems.push({
      id: `shipping-${input.deliveryMethod}`,
      title: 'Gastos de envío',
      description: input.deliveryMethod === 'NATIONAL_COURIER' ? 'Mensajería nacional' : 'Envío local',
      quantity: 1,
      unit_price: Number(input.shippingCost),
      currency_id: 'ARS',
    });
  }

  const preferenceBody: Record<string, unknown> = {
    items: lineItems,
    back_urls: {
      success: `${baseUrl}/pedido/${input.orderId}/confirmacion?provider=mercadopago&status=success`,
      failure: `${baseUrl}/pedido/${input.orderId}/confirmacion?provider=mercadopago&status=failure`,
      pending: `${baseUrl}/pedido/${input.orderId}/confirmacion?provider=mercadopago&status=pending`,
    },
    auto_return: 'approved',
    external_reference: input.orderId,
    statement_descriptor: 'TIEMPOBAKERY',
    metadata: {
      orderId: input.orderId,
      orderNumber: input.orderNumber,
    },
  };

  // Only add payer if we have valid data
  if (input.customerEmail) {
    (preferenceBody as any).payer = {
      name: name || undefined,
      surname: surname || undefined,
      email: input.customerEmail,
      ...(phone ? { phone } : {}),
      ...(input.shippingPostal || input.shippingAddress
        ? {
            address: {
              zip_code: input.shippingPostal ?? undefined,
              street_name: input.shippingAddress ?? undefined,
            },
          }
        : {}),
    };
  }

  // Add notification_url only if we have a real URL (not localhost)
  if (baseUrl.startsWith('https://')) {
    preferenceBody.notification_url = `${baseUrl}/api/webhooks/mercadopago`;
  }

  console.log('[MP] Creating preference:', JSON.stringify({
    items: lineItems.length,
    payer_email: input.customerEmail,
    total: lineItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    baseUrl,
  }));

  const response = await preference.create({
    body: preferenceBody as any,
  });

  console.log('[MP] Preference created:', response.id, 'init_point:', !!response.init_point, 'sandbox_init_point:', !!response.sandbox_init_point);

  return response;
}

export async function getMercadoPagoPayment(id: string | number, accessToken?: string) {
  const token = await resolveMercadoPagoAccessToken(accessToken);
  const client = getMercadoPagoClient(token);
  const payment = new Payment(client);

  return payment.get({ id: Number(id) });
}

/**
 * Search MP payments by external_reference (order id).
 * Returns the latest approved payment, else the latest one, or null if none found.
 */
export async function searchMercadoPagoPaymentByExternalReference(
  externalReference: string,
  accessToken?: string
) {
  const token = await resolveMercadoPagoAccessToken(accessToken);
  const client = getMercadoPagoClient(token);
  const payment = new Payment(client);

  const searchResult = await payment.search({
    options: {
      external_reference: externalReference,
      sort: 'date_created',
      criteria: 'desc',
    },
  });

  const results = searchResult?.results ?? [];
  if (results.length === 0) return null;

  const approved = results.find((r) => r.status === 'approved');
  return approved ?? results[0];
}