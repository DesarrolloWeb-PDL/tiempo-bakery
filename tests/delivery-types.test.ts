import { describe, expect, it } from 'vitest'
import {
  deliveryZoneSchema,
  deliveryScheduleSchema,
  deliveryPersonSchema,
} from '@/types/delivery'

describe('deliveryZoneSchema', () => {
  it('accepts a valid zone', () => {
    const result = deliveryZoneSchema.safeParse({
      name: 'Centro',
      neighborhoods: ['Palermo', 'Belgrano'],
      shippingCost: 2500,
      isActive: true,
      order: 1,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = deliveryZoneSchema.safeParse({
      name: '',
      neighborhoods: ['Palermo'],
      shippingCost: 2500,
      isActive: true,
      order: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a negative shipping cost', () => {
    const result = deliveryZoneSchema.safeParse({
      name: 'Centro',
      neighborhoods: ['Palermo'],
      shippingCost: -1,
      isActive: true,
      order: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty neighborhood entries', () => {
    const result = deliveryZoneSchema.safeParse({
      name: 'Centro',
      neighborhoods: [''],
      shippingCost: 2500,
      isActive: true,
      order: 1,
    })
    expect(result.success).toBe(false)
  })
})

describe('deliveryScheduleSchema', () => {
  it('accepts a valid schedule', () => {
    const result = deliveryScheduleSchema.safeParse({
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      maxOrders: 10,
      cutoffDay: 3,
      cutoffTime: '18:00',
      isActive: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects endTime before startTime', () => {
    const result = deliveryScheduleSchema.safeParse({
      dayOfWeek: 5,
      startTime: '14:00',
      endTime: '09:00',
      isActive: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects only cutoffDay without cutoffTime', () => {
    const result = deliveryScheduleSchema.safeParse({
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      cutoffDay: 3,
      isActive: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects only cutoffTime without cutoffDay', () => {
    const result = deliveryScheduleSchema.safeParse({
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      cutoffTime: '18:00',
      isActive: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid HH:mm time format', () => {
    const result = deliveryScheduleSchema.safeParse({
      dayOfWeek: 5,
      startTime: '9:00',
      endTime: '14:00',
      isActive: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects dayOfWeek outside 0-6', () => {
    const result = deliveryScheduleSchema.safeParse({
      dayOfWeek: 7,
      startTime: '09:00',
      endTime: '14:00',
      isActive: true,
    })
    expect(result.success).toBe(false)
  })
})

describe('deliveryPersonSchema', () => {
  it('accepts a valid person', () => {
    const result = deliveryPersonSchema.safeParse({
      name: 'Juan Pérez',
      phone: '12345678',
      email: 'juan@example.com',
      isActive: true,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a person without email', () => {
    const result = deliveryPersonSchema.safeParse({
      name: 'Juan Pérez',
      phone: '12345678',
      isActive: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a phone shorter than 8 digits', () => {
    const result = deliveryPersonSchema.safeParse({
      name: 'Juan Pérez',
      phone: '1234567',
      isActive: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email', () => {
    const result = deliveryPersonSchema.safeParse({
      name: 'Juan Pérez',
      phone: '12345678',
      email: 'not-an-email',
      isActive: true,
    })
    expect(result.success).toBe(false)
  })
})
