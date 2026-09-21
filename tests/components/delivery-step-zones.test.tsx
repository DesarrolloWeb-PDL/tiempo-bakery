// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DeliveryStep } from '@/components/checkout/delivery-step'
import { DeliveryMethod } from '@/types/checkout'
import type { DeliveryZone, AvailableSlot } from '@/types/delivery'

// jsdom does not implement APIs used by Radix Select; mock to native selects for reliable tests
vi.mock('@/components/ui/select', () => {
  return {
    Select: ({ children, value, onValueChange }: any) =>
      React.createElement(
        'select',
        {
          value: value ?? '',
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value),
          'data-testid': 'native-select',
        },
        children
      ),
    SelectTrigger: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SelectValue: ({ placeholder }: any) => React.createElement('option', { value: '' }, placeholder),
    SelectContent: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SelectItem: ({ value, children }: any) => React.createElement('option', { value }, children),
    SelectGroup: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SelectLabel: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SelectSeparator: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SelectScrollUpButton: () => null,
    SelectScrollDownButton: () => null,
  }
})

describe('DeliveryStep zones and day picker', () => {
  beforeEach(() => {
    cleanup()
  })

  const zones: DeliveryZone[] = [
    {
      id: 'z1',
      name: 'Centro',
      neighborhoods: ['Palermo'],
      shippingCost: 2500,
      minOrderFree: 15000,
      isActive: true,
      order: 1,
    },
    {
      id: 'z2',
      name: 'Norte',
      neighborhoods: ['Alameda'],
      shippingCost: 3000,
      minOrderFree: null,
      isActive: true,
      order: 2,
    },
  ]

  const slot: AvailableSlot = {
    id: 'slot-fri',
    dayOfWeek: 5,
    startTime: '09:00',
    endTime: '14:00',
    maxOrders: 10,
    cutoffDay: null,
    cutoffTime: null,
    isActive: true,
    currentOrders: 0,
    remaining: 10,
    available: true,
  }

  const availableDays = [
    { date: new Date('2026-09-25T00:00:00.000Z'), slot },
  ]

  const baseProps = {
    pickupPoints: [],
    selectedMethod: DeliveryMethod.LOCAL_DELIVERY,
    shippingCosts: {
      PICKUP_POINT: 0,
      LOCAL_DELIVERY: 3500,
      NATIONAL_COURIER: 5950,
    },
    zones,
    availableDays,
    onUpdate: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  }

  it('shows zone selector when local delivery is selected', () => {
    render(<DeliveryStep {...baseProps} />)
    expect(screen.getByText('Zona de entrega')).toBeDefined()
    const zoneSelect = screen.getAllByRole('combobox')[0]
    expect(zoneSelect).toBeDefined()
    const options = Array.from(zoneSelect.querySelectorAll('option'))
    expect(options.some((o) => o.value === 'z1')).toBe(true)
    expect(options.some((o) => o.value === 'z2')).toBe(true)
  })

  it('updates selected zone and shows day picker', async () => {
    const onUpdate = vi.fn()
    const { rerender } = render(<DeliveryStep {...baseProps} onUpdate={onUpdate} />)

    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
    await userEvent.selectOptions(selects[0], 'z1')

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ zoneId: 'z1' }))

    rerender(<DeliveryStep {...baseProps} zoneId="z1" onUpdate={onUpdate} />)
    expect(screen.getByText('Dia y horario de entrega')).toBeDefined()
  })

  it('updates selected day and delivery date', async () => {
    const onUpdate = vi.fn()
    render(<DeliveryStep {...baseProps} zoneId="z1" onUpdate={onUpdate} />)

    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(2)
    await userEvent.selectOptions(selects[1], 'slot-fri:2026-09-25')

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleId: 'slot-fri',
        deliveryDate: new Date('2026-09-25T00:00:00.000Z'),
      })
    )
  })

  it('shows zone price in the local delivery option badge', () => {
    render(<DeliveryStep {...baseProps} zoneId="z1" />)
    expect(screen.getByText('$ 2.500,00')).toBeDefined()
  })

  it('shows flat-rate price when no zone is selected', () => {
    render(<DeliveryStep {...baseProps} />)
    expect(screen.getByText('$ 3.500,00')).toBeDefined()
  })
})
