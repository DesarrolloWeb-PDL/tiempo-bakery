// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'

import AdminDashboard from '@/app/admin/page'

const fetchMock = vi.fn()

function mockMetricsResponse(overrides: {
  recentOrders?: Array<{
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    total: number
    status: string
    paymentStatus: string
    deliveryMethod: string
    createdAt: string
    items: Array<{ quantity: number }>
  }>
} = {}) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      summary: {
        totalOrders: 1,
        paidOrders: 1,
        pendingOrders: 0,
        weekOrders: 1,
        totalCustomers: 1,
        monthRevenue: 1000,
        monthOrders: 1,
        revenueGrowth: null,
        ordersGrowth: null,
      },
      recentOrders: overrides.recentOrders ?? [],
      weekStock: [],
      currentWeekId: '2026-W38',
    }),
  })
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
    global.fetch = fetchMock
  })

  it('usa etiquetas compartidas para estados de reparto extendidos', async () => {
    mockMetricsResponse({
      recentOrders: [
        {
          id: 'ord1',
          orderNumber: 'TBK-0001',
          customerName: 'Laura Pérez',
          customerEmail: 'laura@example.com',
          total: 2500,
          status: 'OUT_FOR_DELIVERY',
          paymentStatus: 'PAID',
          deliveryMethod: 'LOCAL_DELIVERY',
          createdAt: '2026-09-21T10:00:00Z',
          items: [{ quantity: 1 }],
        },
        {
          id: 'ord2',
          orderNumber: 'TBK-0002',
          customerName: 'Juan Díaz',
          customerEmail: 'juan@example.com',
          total: 1800,
          status: 'DELIVERY_FAILED',
          paymentStatus: 'PAID',
          deliveryMethod: 'LOCAL_DELIVERY',
          createdAt: '2026-09-21T10:00:00Z',
          items: [{ quantity: 1 }],
        },
      ],
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('En camino')).toBeDefined()
      expect(screen.getByText('Entrega fallida')).toBeDefined()
    })
  })
})
