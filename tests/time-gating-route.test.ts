import { beforeEach, describe, expect, it, vi } from 'vitest'

const getTimeGatingRuntimeMock = vi.fn()

vi.mock('@/lib/time-gating', () => ({
  getTimeGatingRuntime: getTimeGatingRuntimeMock,
}))

const routeModulePromise = import('@/app/api/time-gating/route')

describe('time-gating route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna abierto sin restricción cuando el time-gating está deshabilitado', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: false,
      service: {
        getCurrentWeekId: () => '2026-W23',
      },
    })

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      isOpen: true,
      currentWeekId: '2026-W23',
      message: 'Pedidos habilitados sin restricción horaria.',
    })
  })

  it('retorna próxima apertura y tiempo restante cuando está cerrado', async () => {
    getTimeGatingRuntimeMock.mockResolvedValue({
      enabled: true,
      service: {
        getCurrentWeekId: () => '2026-W23',
        getTimeUntilOpening: () => ({
          isOpen: false,
          nextOpening: { toISO: () => '2026-06-04T18:00:00.000+02:00' },
          remainingMs: 183_600_000,
        }),
        formatTimeRemaining: () => ({ days: 2, hours: 3, minutes: 0, seconds: 0 }),
      },
    })

    const { GET } = await routeModulePromise
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      isOpen: false,
      currentWeekId: '2026-W23',
      nextOpening: '2026-06-04T18:00:00.000+02:00',
      timeRemaining: { days: 2, hours: 3, minutes: 0, seconds: 0 },
      message: 'Abrimos en 2d 3h 0m',
    })
  })
})