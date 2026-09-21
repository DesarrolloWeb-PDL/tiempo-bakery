// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  DeliveryScheduleConfig,
  EMPTY_SCHEDULE_DRAFT,
  type ScheduleDraft,
} from '@/components/admin/delivery/delivery-schedule-config'
import type { DeliveryScheduleWithAvailability } from '@/types/delivery'
import { DeliveryConfigAdmin } from '@/components/admin/delivery/delivery-config-tab'
import { DEFAULT_PREVENTA_CONFIG } from '@/components/admin/delivery/preventa-config'
import { EMPTY_PICKUP_POINT } from '@/components/admin/delivery/pickup-points-config'
import { EMPTY_ZONE_DRAFT } from '@/components/admin/delivery/delivery-zones-config'

const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

describe('DeliveryScheduleConfig', () => {
  beforeEach(() => {
    cleanup()
  })

  const schedules: DeliveryScheduleWithAvailability[] = [
    {
      id: 's1',
      dayOfWeek: 5,
      startTime: '09:00',
      endTime: '14:00',
      maxOrders: 10,
      cutoffDay: 3,
      cutoffTime: '18:00',
      isActive: true,
      currentOrders: 3,
      remaining: 7,
    },
    {
      id: 's2',
      dayOfWeek: 6,
      startTime: '10:00',
      endTime: '13:00',
      maxOrders: null,
      cutoffDay: null,
      cutoffTime: null,
      isActive: false,
      currentOrders: 0,
      remaining: Infinity,
    },
  ]

  const baseProps = {
    schedules,
    scheduleDraft: EMPTY_SCHEDULE_DRAFT,
    setScheduleDraft: vi.fn(),
    editingScheduleId: null as string | null,
    loadingSchedules: false,
    savingSchedule: false,
    schedulesMsg: null as string | null,
    onRefreshSchedules: vi.fn(),
    onEditSchedule: vi.fn(),
    onCancelEditSchedule: vi.fn(),
    onSaveSchedule: vi.fn(),
    onDeleteSchedule: vi.fn(),
  }

  it('renderiza el título y el estado vacío', () => {
    render(<DeliveryScheduleConfig {...baseProps} schedules={[]} />)
    expect(screen.getByText('Horarios de entrega')).toBeDefined()
    expect(
      screen.getByText('Todavía no hay horarios de entrega cargados.')
    ).toBeDefined()
  })

  it('renderiza la grilla semanal con ventana, corte y capacidad', () => {
    render(<DeliveryScheduleConfig {...baseProps} />)

    expect(screen.getAllByText(DAY_LABELS[5]).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('09:00 - 14:00')).toBeDefined()
    expect(screen.getByText('Corte: Miércoles 18:00')).toBeDefined()
    expect(screen.getByText('3 / 10 pedidos')).toBeDefined()
  })

  it('dispara editar y eliminar', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <DeliveryScheduleConfig
        {...baseProps}
        onEditSchedule={onEdit}
        onDeleteSchedule={onDelete}
      />
    )

    const editButtons = screen.getAllByText('Editar')
    await userEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(schedules[0])

    const deleteButtons = screen.getAllByRole('button', { name: '' })
    await userEvent.click(deleteButtons[deleteButtons.length - 1])
    expect(onDelete).toHaveBeenCalledWith(schedules[0].id)
  })

  it('actualiza el borrador del formulario', async () => {
    const setScheduleDraft = vi.fn()
    render(
      <DeliveryScheduleConfig
        {...baseProps}
        setScheduleDraft={setScheduleDraft}
      />
    )

    const startInput = screen.getByLabelText('Inicio')
    await userEvent.clear(startInput)
    await userEvent.type(startInput, '08:00')
    expect(setScheduleDraft).toHaveBeenCalled()
  })

  it('actualiza el máximo de pedidos', async () => {
    const setScheduleDraft = vi.fn()
    render(
      <DeliveryScheduleConfig
        {...baseProps}
        setScheduleDraft={setScheduleDraft}
      />
    )

    const maxInput = screen.getByLabelText('Máximo de pedidos')
    await userEvent.clear(maxInput)
    await userEvent.type(maxInput, '20')
    expect(setScheduleDraft).toHaveBeenCalled()
  })

  it('actualiza el día de corte', async () => {
    const setScheduleDraft = vi.fn()
    render(
      <DeliveryScheduleConfig
        {...baseProps}
        setScheduleDraft={setScheduleDraft}
      />
    )

    const cutoffDaySelect = screen.getByLabelText('Día de corte')
    await userEvent.selectOptions(cutoffDaySelect, '3')
    expect(setScheduleDraft).toHaveBeenCalled()
  })

  it('alterna el toggle de activo', async () => {
    const setScheduleDraft = vi.fn()
    render(
      <DeliveryScheduleConfig
        {...baseProps}
        setScheduleDraft={setScheduleDraft}
      />
    )

    const toggle = screen.getByLabelText('Slot activo')
    await userEvent.click(toggle)
    expect(setScheduleDraft).toHaveBeenCalled()
  })

  it('muestra mensaje de éxito', () => {
    render(
      <DeliveryScheduleConfig {...baseProps} schedulesMsg="Horario guardado" />
    )
    expect(screen.getByText('Horario guardado')).toBeDefined()
  })

  it('muestra mensaje de error', () => {
    render(
      <DeliveryScheduleConfig {...baseProps} schedulesMsg="Error al guardar" />
    )
    expect(screen.getByText('Error al guardar')).toBeDefined()
  })

  it('renderiza modo edición con botón de cancelar', () => {
    render(
      <DeliveryScheduleConfig
        {...baseProps}
        editingScheduleId="s1"
        scheduleDraft={{
          ...EMPTY_SCHEDULE_DRAFT,
          dayOfWeek: 5,
          startTime: '09:00',
          endTime: '14:00',
        }}
      />
    )
    expect(screen.getByText('Actualizar horario')).toBeDefined()
    expect(screen.getByText('Cancelar edición')).toBeDefined()
  })
})

describe('DeliveryConfigAdmin wrapper with schedule', () => {
  beforeEach(() => {
    cleanup()
  })

  const baseWrapperProps = {
    preventa: DEFAULT_PREVENTA_CONFIG,
    setPreventa: vi.fn(),
    loadingPreventa: false,
    savingPreventa: false,
    preventaMsg: null,
    onRefreshPreventa: vi.fn(),
    onSavePreventa: vi.fn(),
    onResetPreventa: vi.fn(),
    shippingCosts: {
      pickupPoint: 0,
      localDelivery: 3500,
      nationalCourier: 5950,
    },
    setShippingCosts: vi.fn(),
    loadingShipping: false,
    savingShipping: false,
    shippingMsg: null,
    onSaveShipping: vi.fn(),
    onResetShipping: vi.fn(),
    pickupPoints: [] as { id: string; name: string; address: string; city: string; postalCode: string; schedule: string; instructions: string; isActive: boolean; order: number }[],
    pickupDraft: EMPTY_PICKUP_POINT,
    setPickupDraft: vi.fn(),
    editingPickupId: null as string | null,
    loadingPickupPoints: false,
    savingPickupPoint: false,
    pickupPointsMsg: null,
    onRefreshPickupPoints: vi.fn(),
    onEditPickupPoint: vi.fn(),
    onCancelEditPickupPoint: vi.fn(),
    onSavePickupPoint: vi.fn(),
    onDeletePickupPoint: vi.fn(),
    zones: [] as { id: string; name: string; neighborhoods: string[]; shippingCost: number; isActive: boolean; order: number }[],
    zoneDraft: EMPTY_ZONE_DRAFT,
    setZoneDraft: vi.fn(),
    editingZoneId: null as string | null,
    loadingZones: false,
    savingZone: false,
    zonesMsg: null,
    onRefreshZones: vi.fn(),
    onEditZone: vi.fn(),
    onCancelEditZone: vi.fn(),
    onSaveZone: vi.fn(),
    onDeleteZone: vi.fn(),
    schedules: [] as DeliveryScheduleWithAvailability[],
    scheduleDraft: EMPTY_SCHEDULE_DRAFT,
    setScheduleDraft: vi.fn(),
    editingScheduleId: null as string | null,
    loadingSchedules: false,
    savingSchedule: false,
    schedulesMsg: null,
    onRefreshSchedules: vi.fn(),
    onEditSchedule: vi.fn(),
    onCancelEditSchedule: vi.fn(),
    onSaveSchedule: vi.fn(),
    onDeleteSchedule: vi.fn(),
  }

  it('renderiza las cinco secciones incluyendo horarios', () => {
    render(<DeliveryConfigAdmin {...baseWrapperProps} />)
    expect(screen.getByText('Ventana semanal de preventa')).toBeDefined()
    expect(screen.getByText('Costos de envío')).toBeDefined()
    expect(screen.getByText('Puntos de recogida')).toBeDefined()
    expect(screen.getByText('Zonas de entrega')).toBeDefined()
    expect(screen.getByText('Horarios de entrega')).toBeDefined()
  })
})
