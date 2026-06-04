import { Resend } from 'resend'
import { getSiteContent } from '@/lib/site-content'

type OrderEmailItem = {
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  sliced: boolean
}

type OrderEmailPayload = {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryMethod: string
  pickupLocation?: string | null
  pickupAddress?: string | null
  pickupSchedule?: string | null
  shippingAddress?: string | null
  shippingCity?: string | null
  shippingPostal?: string | null
  subtotal: number
  shippingCost: number
  total: number
  customerNotes?: string | null
  items: OrderEmailItem[]
}

type SendOrderPaidEmailsResult = {
  skipped: boolean
  customerSent: boolean
  adminSent: boolean
}

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP_POINT: 'Recogida en punto',
  LOCAL_DELIVERY: 'Envío local',
  NATIONAL_COURIER: 'Mensajería nacional',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    return null
  }

  return new Resend(apiKey)
}

function getFromAddress() {
  return process.env.ORDER_EMAIL_FROM?.trim() || 'Tiempo Bakery <onboarding@resend.dev>'
}

function getNotificationRecipients(contactEmail: string) {
  const configured = process.env.ORDER_NOTIFICATION_EMAILS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (configured?.length) {
    return configured
  }

  return contactEmail ? [contactEmail] : []
}

function renderItems(order: OrderEmailPayload) {
  return order.items
    .map((item) => {
      const slicedText = item.sliced ? 'Rebanado' : 'Sin rebanar'
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${item.productName}<br /><span style="color:#6b7280;font-size:12px;">${slicedText}</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.subtotal)}</td>
        </tr>
      `
    })
    .join('')
}

function renderDeliveryDetails(order: OrderEmailPayload) {
  const deliveryLabel = DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod

  if (order.deliveryMethod === 'PICKUP_POINT') {
    return `
      <p style="margin:0 0 4px;"><strong>Método:</strong> ${deliveryLabel}</p>
      <p style="margin:0 0 4px;"><strong>Punto:</strong> ${order.pickupLocation ?? '-'}</p>
      <p style="margin:0 0 4px;"><strong>Dirección:</strong> ${order.pickupAddress ?? '-'}</p>
      <p style="margin:0;"><strong>Horario:</strong> ${order.pickupSchedule ?? '-'}</p>
    `
  }

  return `
    <p style="margin:0 0 4px;"><strong>Método:</strong> ${deliveryLabel}</p>
    <p style="margin:0 0 4px;"><strong>Dirección:</strong> ${order.shippingAddress ?? '-'}</p>
    <p style="margin:0 0 4px;"><strong>Ciudad:</strong> ${order.shippingCity ?? '-'}</p>
    <p style="margin:0;"><strong>Código postal:</strong> ${order.shippingPostal ?? '-'}</p>
  `
}

function renderCustomerEmailHtml(order: OrderEmailPayload, contactEmail: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
      <h1 style="margin:0 0 16px;font-size:28px;color:#92400e;">Tiempo Bakery</h1>
      <p style="margin:0 0 16px;">Hola ${order.customerName}, recibimos tu pedido <strong>${order.orderNumber}</strong> y el pago quedó confirmado.</p>
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:16px;margin:0 0 20px;">
        ${renderDeliveryDetails(order)}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #d1d5db;">Producto</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #d1d5db;">Cant.</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #d1d5db;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${renderItems(order)}</tbody>
      </table>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 4px;"><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
        <p style="margin:0 0 4px;"><strong>Envío:</strong> ${formatCurrency(order.shippingCost)}</p>
        <p style="margin:0;font-size:18px;"><strong>Total:</strong> ${formatCurrency(order.total)}</p>
      </div>
      ${order.customerNotes ? `<p style="margin:0 0 16px;"><strong>Notas:</strong> ${order.customerNotes}</p>` : ''}
      <p style="margin:0;color:#4b5563;">Si necesitás ayuda con tu pedido, respondé este email o escribinos a ${contactEmail}.</p>
    </div>
  `
}

function renderAdminEmailHtml(order: OrderEmailPayload) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
      <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Nuevo pedido pagado</h1>
      <p style="margin:0 0 12px;"><strong>${order.orderNumber}</strong> de ${order.customerName} (${order.customerEmail})</p>
      <p style="margin:0 0 4px;"><strong>Teléfono:</strong> ${order.customerPhone}</p>
      <p style="margin:0 0 16px;"><strong>Total:</strong> ${formatCurrency(order.total)}</p>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:0 0 16px;">
        ${renderDeliveryDetails(order)}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #d1d5db;">Producto</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #d1d5db;">Cant.</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #d1d5db;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${renderItems(order)}</tbody>
      </table>
      ${order.customerNotes ? `<p style="margin:0;"><strong>Notas del cliente:</strong> ${order.customerNotes}</p>` : ''}
    </div>
  `
}

export async function sendOrderPaidEmails(order: OrderEmailPayload): Promise<SendOrderPaidEmailsResult> {
  const resend = getResendClient()

  if (!resend) {
    return {
      skipped: true,
      customerSent: false,
      adminSent: false,
    }
  }

  const siteContent = await getSiteContent()
  const from = getFromAddress()
  const notificationRecipients = getNotificationRecipients(siteContent.contactEmail)

  const customerResponse = await resend.emails.send({
    from,
    to: [order.customerEmail],
    subject: `Pedido confirmado ${order.orderNumber} | Tiempo Bakery`,
    html: renderCustomerEmailHtml(order, siteContent.contactEmail),
  })

  if (customerResponse.error) {
    throw new Error(`No se pudo enviar el email al cliente: ${customerResponse.error.message}`)
  }

  let adminSent = false

  if (notificationRecipients.length > 0) {
    const adminResponse = await resend.emails.send({
      from,
      to: notificationRecipients,
      subject: `Nuevo pedido pagado ${order.orderNumber}`,
      html: renderAdminEmailHtml(order),
    })

    if (adminResponse.error) {
      throw new Error(`No se pudo enviar el email interno: ${adminResponse.error.message}`)
    }

    adminSent = true
  }

  return {
    skipped: false,
    customerSent: true,
    adminSent,
  }
}