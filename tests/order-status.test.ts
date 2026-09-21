import { describe, expect, it } from 'vitest'
import {
  ORDER_STATUSES,
  FLOW_BY_METHOD,
  TRANSITIONS,
  canTransition,
  getNextStatuses,
  getStatusLabel,
} from '@/lib/order-status'

describe('ORDER_STATUSES', () => {
  it('includes all expected statuses in order', () => {
    expect(ORDER_STATUSES).toEqual([
      'PENDING',
      'PAID',
      'BAKING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'DELIVERY_FAILED',
      'CANCELLED',
    ])
  })
})

describe('FLOW_BY_METHOD', () => {
  it('pickup and national skip OUT_FOR_DELIVERY', () => {
    expect(FLOW_BY_METHOD.PICKUP_POINT).not.toContain('OUT_FOR_DELIVERY')
    expect(FLOW_BY_METHOD.NATIONAL_COURIER).not.toContain('OUT_FOR_DELIVERY')
    expect(FLOW_BY_METHOD.PICKUP_POINT).toEqual([
      'PENDING',
      'PAID',
      'BAKING',
      'READY',
      'DELIVERED',
    ])
  })

  it('local delivery includes OUT_FOR_DELIVERY', () => {
    expect(FLOW_BY_METHOD.LOCAL_DELIVERY).toContain('OUT_FOR_DELIVERY')
    expect(FLOW_BY_METHOD.LOCAL_DELIVERY).toEqual([
      'PENDING',
      'PAID',
      'BAKING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ])
  })
})

describe('TRANSITIONS', () => {
  it('allows linear progression and cancellation from every status', () => {
    expect(TRANSITIONS.PENDING).toContain('PAID')
    expect(TRANSITIONS.PENDING).toContain('CANCELLED')
    expect(TRANSITIONS.PAID).toContain('BAKING')
    expect(TRANSITIONS.BAKING).toContain('READY')
    expect(TRANSITIONS.READY).toContain('DELIVERED')
    expect(TRANSITIONS.READY).toContain('OUT_FOR_DELIVERY')
    expect(TRANSITIONS.OUT_FOR_DELIVERY).toContain('DELIVERED')
    expect(TRANSITIONS.OUT_FOR_DELIVERY).toContain('DELIVERY_FAILED')
    expect(TRANSITIONS.DELIVERY_FAILED).toContain('OUT_FOR_DELIVERY')
  })

  it('does not allow reverting to previous statuses', () => {
    expect(TRANSITIONS.PAID).not.toContain('PENDING')
    expect(TRANSITIONS.READY).not.toContain('BAKING')
    expect(TRANSITIONS.DELIVERED).toHaveLength(0)
  })
})

describe('canTransition', () => {
  it('rejects READY -> OUT_FOR_DELIVERY for pickup', () => {
    expect(canTransition('READY', 'OUT_FOR_DELIVERY', 'PICKUP_POINT')).toBe(false)
  })

  it('rejects READY -> OUT_FOR_DELIVERY for national courier', () => {
    expect(canTransition('READY', 'OUT_FOR_DELIVERY', 'NATIONAL_COURIER')).toBe(false)
  })

  it('allows READY -> OUT_FOR_DELIVERY for local delivery', () => {
    expect(canTransition('READY', 'OUT_FOR_DELIVERY', 'LOCAL_DELIVERY')).toBe(true)
  })

  it('allows FAILED -> OUT_FOR_DELIVERY retry for local delivery', () => {
    expect(canTransition('DELIVERY_FAILED', 'OUT_FOR_DELIVERY', 'LOCAL_DELIVERY')).toBe(true)
  })

  it('rejects FAILED -> DELIVERED direct jump for local delivery', () => {
    expect(canTransition('DELIVERY_FAILED', 'DELIVERED', 'LOCAL_DELIVERY')).toBe(false)
  })

  it('allows READY -> DELIVERED for pickup', () => {
    expect(canTransition('READY', 'DELIVERED', 'PICKUP_POINT')).toBe(true)
  })

  it('rejects PAID -> DELIVERED skip', () => {
    expect(canTransition('PAID', 'DELIVERED', 'PICKUP_POINT')).toBe(false)
  })
})

describe('getNextStatuses', () => {
  it('excludes OUT_FOR_DELIVERY for pickup when at READY', () => {
    expect(getNextStatuses('READY', 'PICKUP_POINT')).toContain('DELIVERED')
    expect(getNextStatuses('READY', 'PICKUP_POINT')).not.toContain('OUT_FOR_DELIVERY')
  })

  it('includes OUT_FOR_DELIVERY and DELIVERY_FAILED for local at OUT_FOR_DELIVERY', () => {
    expect(getNextStatuses('OUT_FOR_DELIVERY', 'LOCAL_DELIVERY')).toContain('DELIVERED')
    expect(getNextStatuses('OUT_FOR_DELIVERY', 'LOCAL_DELIVERY')).toContain('DELIVERY_FAILED')
  })
})

describe('getStatusLabel', () => {
  it('returns Spanish labels for all statuses', () => {
    expect(getStatusLabel('PENDING')).toBe('Pendiente')
    expect(getStatusLabel('OUT_FOR_DELIVERY')).toBe('En camino')
    expect(getStatusLabel('DELIVERY_FAILED')).toBe('Entrega fallida')
  })
})
