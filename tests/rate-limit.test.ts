import { beforeEach, describe, expect, it } from 'vitest'
import { consumeRateLimit, resetRateLimitStore } from '@/lib/rate-limit'

describe('consumeRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  it('permite solicitudes hasta el límite y bloquea la siguiente', () => {
    const first = consumeRateLimit({ key: 'login:127.0.0.1', limit: 2, windowMs: 60_000, now: 1_000 })
    const second = consumeRateLimit({ key: 'login:127.0.0.1', limit: 2, windowMs: 60_000, now: 2_000 })
    const third = consumeRateLimit({ key: 'login:127.0.0.1', limit: 2, windowMs: 60_000, now: 3_000 })

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(1)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(0)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('reinicia la ventana cuando expira', () => {
    consumeRateLimit({ key: 'checkout:127.0.0.1', limit: 1, windowMs: 1_000, now: 1_000 })
    const nextWindow = consumeRateLimit({ key: 'checkout:127.0.0.1', limit: 1, windowMs: 1_000, now: 2_100 })

    expect(nextWindow.allowed).toBe(true)
    expect(nextWindow.remaining).toBe(0)
  })
})