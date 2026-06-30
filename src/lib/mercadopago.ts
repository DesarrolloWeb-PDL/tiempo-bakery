import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

let mercadopagoClient: MercadoPagoConfig | null = null;

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

export function getMercadoPagoClient(accessToken?: string) {
  const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');
  }

  if (!mercadopagoClient || mercadopagoClient.accessToken !== token) {
    mercadopagoClient = new MercadoPagoConfig({
      accessToken: token,
      options: { timeout: 5000 },
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
  const baseUrl = process.env.NEXT_PUBLIC_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  if (!baseUrl) {
    throw new Error('Falta NEXT_PUBLIC_URL o VERCEL_URL para generar los retornos de pago');
  }

  const client = getMercadoPagoClient(input.accessToken);
  const preference = new Preference(client);
  const { name, surname } = splitCustomerName(input.customerName);
  const phone = sanitizePhone(input.customerPhone);
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

  const response = await preference.create({
    body: {
      items: lineItems,
      payer: {
        name,
        surname,
        email: input.customerEmail,
        phone: phone
          ? {
              area_code: phone.length > 10 ? phone.slice(0, 3) : phone.slice(0, 2),
              number: phone.length > 10 ? phone.slice(3) : phone.slice(2),
            }
          : undefined,
        address: input.shippingPostal || input.shippingAddress
          ? {
              zip_code: input.shippingPostal ?? undefined,
              street_name: input.shippingAddress ?? undefined,
            }
          : undefined,
      },
      back_urls: {
        success: `${baseUrl}/pedido/${input.orderId}/confirmacion?provider=mercadopago&status=success`,
        failure: `${baseUrl}/pedido/${input.orderId}/confirmacion?provider=mercadopago&status=failure`,
        pending: `${baseUrl}/pedido/${input.orderId}/confirmacion?provider=mercadopago&status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      external_reference: input.orderId,
      statement_descriptor: 'TIEMPOBAKERY',
      metadata: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
      },
    },
  });

  return response;
}

export async function getMercadoPagoPayment(id: string | number, accessToken?: string) {
  const client = getMercadoPagoClient(accessToken);
  const payment = new Payment(client);

  return payment.get({ id: Number(id) });
}