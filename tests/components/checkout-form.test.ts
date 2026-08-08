import { describe, expect, it } from 'vitest'
import {
  checkoutSchema,
  checkoutCustomerSchema,
  checkoutDeliverySchema,
  DeliveryMethod,
  PaymentProvider,
} from '@/types/checkout'

describe('checkoutCustomerSchema', () => {
  it('acepta datos válidos', () => {
    const result = checkoutCustomerSchema.safeParse({
      customerEmail: 'test@example.com',
      customerName: 'Juan Pérez',
      customerPhone: '+54 11 1234 5678',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const result = checkoutCustomerSchema.safeParse({
      customerEmail: 'no-es-email',
      customerName: 'Juan',
      customerPhone: '+54 11 1234 5678',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('customerEmail'))
      expect(emailError).toBeTruthy()
    }
  })

  it('rechaza nombre muy corto', () => {
    const result = checkoutCustomerSchema.safeParse({
      customerEmail: 'test@example.com',
      customerName: 'J',
      customerPhone: '+54 11 1234 5678',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('customerName'))
      expect(nameError).toBeTruthy()
    }
  })

  it('rechaza teléfono muy corto', () => {
    const result = checkoutCustomerSchema.safeParse({
      customerEmail: 'test@example.com',
      customerName: 'Juan Pérez',
      customerPhone: '123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const phoneError = result.error.issues.find((i) => i.path.includes('customerPhone'))
      expect(phoneError).toBeTruthy()
    }
  })

  it('rechaza campos requeridos faltantes', () => {
    const result = checkoutCustomerSchema.safeParse({})

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('checkoutDeliverySchema', () => {
  it('acepta PICKUP_POINT válido', () => {
    const result = checkoutDeliverySchema.safeParse({
      deliveryMethod: DeliveryMethod.PICKUP_POINT,
      pickupLocationId: 'loc_1',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza PICKUP_POINT sin pickupLocationId', () => {
    const result = checkoutDeliverySchema.safeParse({
      deliveryMethod: DeliveryMethod.PICKUP_POINT,
    })

    expect(result.success).toBe(false)
  })

  it('acepta LOCAL_DELIVERY válido', () => {
    const result = checkoutDeliverySchema.safeParse({
      deliveryMethod: DeliveryMethod.LOCAL_DELIVERY,
      shippingAddress: 'Av. Corrientes 1234',
      shippingCity: 'Buenos Aires',
      shippingPostal: 'C1043',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza LOCAL_DELIVERY sin dirección', () => {
    const result = checkoutDeliverySchema.safeParse({
      deliveryMethod: DeliveryMethod.LOCAL_DELIVERY,
      shippingCity: 'Buenos Aires',
      shippingPostal: 'C1043',
    })

    expect(result.success).toBe(false)
  })

  it('acepta NATIONAL_COURIER válido', () => {
    const result = checkoutDeliverySchema.safeParse({
      deliveryMethod: DeliveryMethod.NATIONAL_COURIER,
      shippingAddress: 'Av. Corrientes 1234',
      shippingCity: 'Buenos Aires',
      shippingPostal: 'C1043',
    })

    expect(result.success).toBe(true)
  })

  it('rechaza método de envío inválido', () => {
    const result = checkoutDeliverySchema.safeParse({
      deliveryMethod: 'DRONE_DELIVERY',
    })

    expect(result.success).toBe(false)
  })
})

describe('checkoutSchema completo', () => {
  const validCheckout = {
    customerEmail: 'ada@example.com',
    customerName: 'Ada Lovelace',
    customerPhone: '+54 11 1234 5678',
    deliveryMethod: DeliveryMethod.PICKUP_POINT,
    pickupLocationId: 'loc_1',
    items: [{ productId: 'prod_1', quantity: 2, sliced: true }],
  }

  it('acepta un checkout completo válido', () => {
    const result = checkoutSchema.safeParse(validCheckout)
    expect(result.success).toBe(true)
  })

  it('acepta checkout con notas opcionales', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customerNotes: 'Sin frutas por favor',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza notas que exceden 500 caracteres', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customerNotes: 'x'.repeat(501),
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const notesError = result.error.issues.find((i) => i.path.includes('customerNotes'))
      expect(notesError).toBeTruthy()
    }
  })

  it('acepta items vacíos (schema no valida mínimos en items)', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      items: [],
    })

    // checkoutSchema.items no tiene .min(1), así que array vacío pasa validación Zod
    // La validación de stock vacío ocurre en la capa de servicio/route
    expect(result.success).toBe(true)
  })

  it('rechaza quantity menor a 1', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      items: [{ productId: 'prod_1', quantity: 0, sliced: true }],
    })

    expect(result.success).toBe(false)
  })

  it('rechaza email inválido en checkout completo', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      customerEmail: 'not-an-email',
    })

    expect(result.success).toBe(false)
  })

  it('rechaza deliveryMethod inválido', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      deliveryMethod: 'INVALID_METHOD',
    })

    expect(result.success).toBe(false)
  })

  it('acepta paymentProvider STRIPE', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      paymentProvider: PaymentProvider.STRIPE,
    })

    expect(result.success).toBe(true)
  })

  it('acepta paymentProvider MERCADO_PAGO', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      paymentProvider: PaymentProvider.MERCADO_PAGO,
    })

    expect(result.success).toBe(true)
  })

  it('acepta paymentProvider BANK_TRANSFER', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      paymentProvider: PaymentProvider.BANK_TRANSFER,
    })

    expect(result.success).toBe(true)
  })

  it('rechaza paymentProvider inválido', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      paymentProvider: 'PAYPAL',
    })

    expect(result.success).toBe(false)
  })
})
