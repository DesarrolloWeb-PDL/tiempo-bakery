// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ReportsSection } from '@/components/admin/reparto/reports-section'

const fetchMock = vi.fn()

describe('ReportsSection', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    global.fetch = fetchMock
  })

  function mockReportResponse(overrides: {
    summary?: { total: number; delivered: number; failed: number; successRate: number; avgMinutes: number | null }
    perDay?: unknown[]
    byPerson?: unknown[]
    byZone?: unknown[]
    byStatus?: unknown[]
    orders?: unknown[]
    persons?: unknown[]
    zones?: unknown[]
  } = {}) {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        summary: overrides.summary ?? { total: 0, delivered: 0, failed: 0, successRate: 0, avgMinutes: null },
        perDay: overrides.perDay ?? [],
        byPerson: overrides.byPerson ?? [],
        byZone: overrides.byZone ?? [],
        byStatus: overrides.byStatus ?? [],
        orders: overrides.orders ?? [],
        persons: overrides.persons ?? [],
        zones: overrides.zones ?? [],
      }),
    })
  }

  it('muestra el estado de carga inicialmente', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    render(<ReportsSection />)
    expect(screen.getByText('Cargando reportes...')).toBeDefined()
  })

  it('renderiza las métricas principales después de cargar', async () => {
    mockReportResponse({
      summary: { total: 10, delivered: 7, failed: 2, successRate: 77.78, avgMinutes: 45.5 },
      persons: [{ id: 'p1', name: 'Ana García' }],
      zones: [{ id: 'z1', name: 'Centro' }],
    })

    render(<ReportsSection />)

    await waitFor(() => {
      expect(screen.getByText('10')).toBeDefined()
      expect(screen.getByText('7')).toBeDefined()
      expect(screen.getByText('2')).toBeDefined()
      expect(screen.getByText('77.78%')).toBeDefined()
      expect(screen.getByText('46 min')).toBeDefined()
    })
  })

  it('muestra estado vacío cuando no hay entregas', async () => {
    mockReportResponse()

    render(<ReportsSection />)

    await waitFor(() => {
      expect(screen.getByText('No se encontraron entregas')).toBeDefined()
    })
  })

  it('actualiza la URL de fetch al cambiar filtros', async () => {
    mockReportResponse({ zones: [{ id: 'z1', name: 'Centro' }] })

    render(<ReportsSection />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const zoneSelect = screen.getByLabelText('Zona')
    await userEvent.selectOptions(zoneSelect, 'z1')

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('zoneId=z1')
      )
    })
  })

  it('aplica un rango de fechas por defecto de la semana actual en la carga inicial', async () => {
    mockReportResponse()

    render(<ReportsSection />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('dateFrom=')
    expect(url).toContain('dateTo=')
  })

  it('dispara fetch al hacer clic en actualizar', async () => {
    mockReportResponse()

    render(<ReportsSection />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const refreshButton = screen.getByRole('button', { name: 'Actualizar reportes' })
    await userEvent.click(refreshButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
