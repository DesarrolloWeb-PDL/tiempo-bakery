import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: sendMock,
    },
  })),
}))

vi.mock('@/lib/site-content', () => ({
  getSiteContent: vi.fn(async () => ({
    contactEmail: 'contacto@tiempobakery.com',
  })),
}))

const sampleOrder = {
  orderNumber: 'TBK-2026-0009',
  customerName: 'Ada Lovelace',
  customerEmail: 'ada@example.com',
  customerPhone: '+54 11 1234 5678',
  deliveryMethod: 'PICKUP_POINT',
  pickupLocation: 'Obrador central',
  pickupAddress: 'Calle 123',
  pickupSchedule: 'Viernes 16 a 20h',
  shippingAddress: null,
  shippingCity: null,
  shippingPostal: null,
  subtotal: 12000,
  shippingCost: 0,
  total: 12000,
  customerNotes: 'Sin apuro',
  items: [
    {
      productName: 'Pan de campo',
      quantity: 2,
      unitPrice: 6000,
      subtotal: 12000,
      sliced: true,
    },
  ],
}

describe('sendOrderPaidEmails', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('omite el envío si Resend no está configurado', async () => {
    const { sendOrderPaidEmails } = await import('@/lib/order-email')

    await expect(sendOrderPaidEmails(sampleOrder)).resolves.toEqual({
      skipped: true,
      customerSent: false,
      adminSent: false,
    })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('envía email al cliente y al admin cuando hay configuración válida', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('ORDER_EMAIL_FROM', 'Tiempo Bakery <pedidos@tiempobakery.com>')
    vi.stubEnv('ORDER_NOTIFICATION_EMAILS', 'pedidos@tiempobakery.com')
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null })

    const { sendOrderPaidEmails } = await import('@/lib/order-email')

    await expect(sendOrderPaidEmails(sampleOrder)).resolves.toEqual({
      skipped: false,
      customerSent: true,
      adminSent: true,
    })
    expect(sendMock).toHaveBeenCalledTimes(2)
    expect(sendMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      to: ['ada@example.com'],
      subject: expect.stringContaining('TBK-2026-0009'),
    }))
    expect(sendMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      to: ['pedidos@tiempobakery.com'],
      subject: expect.stringContaining('Nuevo pedido pagado'),
    }))
  })
})