// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AssignmentSection } from '@/components/admin/reparto/assignment-section'
import type { AssignableOrder, DeliveryAssignment, DeliveryPerson } from '@/types/delivery'

const persons: DeliveryPerson[] = [
  { id: 'p1', name: 'Ana García', phone: '1199998888', email: 'ana@example.com', isActive: true },
  { id: 'p2', name: 'Carlos López', phone: '1155556666', email: null, isActive: false },
]

const assignableOrders: AssignableOrder[] = [
  { id: 'ord1', orderNumber: 'TBK-0001', customerName: 'Laura Pérez', status: 'READY', deliveryMethod: 'LOCAL_DELIVERY' },
  { id: 'ord2', orderNumber: 'TBK-0002', customerName: 'Juan Díaz', status: 'OUT_FOR_DELIVERY', deliveryMethod: 'LOCAL_DELIVERY' },
]

const assignments: DeliveryAssignment[] = [
  {
    id: 'as1',
    orderId: 'ord2',
    deliveryPersonId: 'p1',
    status: 'OUT_FOR_DELIVERY',
    assignedAt: '2026-09-21T10:00:00Z',
    deliveredAt: null,
    failedReason: null,
    deliveryPerson: persons[0],
  },
]

describe('AssignmentSection', () => {
  beforeEach(() => {
    cleanup()
  })

  const baseProps = {
    orders: assignableOrders,
    assignments,
    persons,
    loading: false,
    onRefresh: vi.fn(),
    onAssign: vi.fn(),
  }

  it('renderiza las cuatro columnas del tablero', () => {
    render(<AssignmentSection {...baseProps} />)
    expect(screen.getByText('Listos para asignar')).toBeDefined()
    expect(screen.getAllByText('En camino').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Fallidos')).toBeDefined()
    expect(screen.getByText('Entregados')).toBeDefined()
  })

  it('muestra el pedido READY con selector de repartidor activo', () => {
    render(<AssignmentSection {...baseProps} />)
    expect(screen.getByText('TBK-0001')).toBeDefined()
    expect(screen.getByText('Laura Pérez')).toBeDefined()
    expect(screen.getAllByText('Ana García').length).toBeGreaterThanOrEqual(2)
  })

  it('muestra el repartidor asignado en la columna En camino', () => {
    render(<AssignmentSection {...baseProps} />)
    expect(screen.getByText('TBK-0002')).toBeDefined()
    expect(screen.getByText('Juan Díaz')).toBeDefined()
    expect(screen.getAllByText('Ana García').length).toBeGreaterThanOrEqual(2)
  })

  it('no muestra repartidores inactivos en el selector', () => {
    render(<AssignmentSection {...baseProps} />)
    const options = screen.getAllByRole('option')
    const optionTexts = options.map((o) => o.textContent)
    expect(optionTexts).toContain('Ana García')
    expect(optionTexts).not.toContain('Carlos López')
  })

  it('dispara onAssign al seleccionar repartidor y hacer clic', async () => {
    const onAssign = vi.fn()
    render(<AssignmentSection {...baseProps} onAssign={onAssign} />)

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'p1')

    const assignButton = screen.getByRole('button', { name: 'Asignar' })
    await userEvent.click(assignButton)

    expect(onAssign).toHaveBeenCalledWith('ord1', 'p1')
  })

  it('muestra estado vacío cuando no hay pedidos en una columna', () => {
    render(<AssignmentSection {...baseProps} orders={[]} assignments={[]} />)
    expect(screen.getAllByText('No hay pedidos en este estado.')).toHaveLength(4)
  })

  it('dispara onRefresh al hacer clic en el botón de actualizar', async () => {
    const onRefresh = vi.fn()
    render(<AssignmentSection {...baseProps} onRefresh={onRefresh} />)

    const refreshButton = screen.getByRole('button', { name: 'Actualizar asignaciones' })
    await userEvent.click(refreshButton)

    expect(onRefresh).toHaveBeenCalled()
  })
})
