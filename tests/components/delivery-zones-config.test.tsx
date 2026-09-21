// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  DeliveryZonesConfig,
  EMPTY_ZONE_DRAFT,
  type DeliveryZone,
} from '@/components/admin/delivery/delivery-zones-config'
import { DeliveryConfigAdmin } from '@/components/admin/delivery/delivery-config-tab'
import { DEFAULT_PREVENTA_CONFIG } from '@/components/admin/delivery/preventa-config'
import { EMPTY_PICKUP_POINT } from '@/components/admin/delivery/pickup-points-config'
import { EMPTY_SCHEDULE_DRAFT } from '@/components/admin/delivery/delivery-schedule-config'
import type { DeliveryScheduleWithAvailability } from '@/types/delivery'

describe('DeliveryZonesConfig', () => {
  beforeEach(() => {
    cleanup()
  })

  const zones: DeliveryZone[] = [
    {
      id: 'z1',
      name: 'Centro',
      neighborhoods: ['Palermo', 'Belgrano'],
      shippingCost: 2500,
      isActive: true,
      order: 1,
    },
    {
      id: 'z2',
      name: 'Norte',
      neighborhoods: ['Alameda'],
      shippingCost: 3000,
      isActive: false,
      order: 2,
    },
  ]

  const baseProps = {
    zones,
    zoneDraft: EMPTY_ZONE_DRAFT,
    setZoneDraft: vi.fn(),
    editingZoneId: null as string | null,
    loadingZones: false,
    savingZone: false,
    zonesMsg: null as string | null,
    onRefreshZones: vi.fn(),
    onEditZone: vi.fn(),
    onCancelEditZone: vi.fn(),
    onSaveZone: vi.fn(),
    onDeleteZone: vi.fn(),
  }

  it('renderiza el título y el estado vacío', () => {
    render(<DeliveryZonesConfig {...baseProps} zones={[]} />)
    expect(screen.getByText('Zonas de entrega')).toBeDefined()
    expect(
      screen.getByText('Todavía no hay zonas de entrega cargadas.')
    ).toBeDefined()
  })

  it('renderiza la lista con barrios, costo y badges de estado', () => {
    render(<DeliveryZonesConfig {...baseProps} />)
    expect(screen.getByText('Centro')).toBeDefined()
    expect(screen.getByText('Norte')).toBeDefined()
    expect(screen.getByText('Palermo, Belgrano')).toBeDefined()
    expect(screen.getByText('Alameda')).toBeDefined()
    expect(screen.getByText('Activo')).toBeDefined()
    expect(screen.getByText('Oculto')).toBeDefined()
  })

  it('dispara editar y eliminar', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <DeliveryZonesConfig
        {...baseProps}
        onEditZone={onEdit}
        onDeleteZone={onDelete}
      />
    )

    const editButtons = screen.getAllByText('Editar')
    await userEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(zones[0])

    const deleteButtons = screen.getAllByRole('button', { name: '' })
    await userEvent.click(deleteButtons[deleteButtons.length - 1])
    expect(onDelete).toHaveBeenCalledWith(zones[1].id)
  })

  it('actualiza el borrador del formulario', async () => {
    const setZoneDraft = vi.fn()
    render(
      <DeliveryZonesConfig {...baseProps} setZoneDraft={setZoneDraft} />
    )

    const nameInput = screen.getAllByRole('textbox')[0]
    await userEvent.type(nameInput, 'Sur')
    expect(setZoneDraft).toHaveBeenCalled()

    const neighborhoodInput = screen.getByPlaceholderText(
      'Ej: Palermo, Belgrano, Villa Crespo'
    )
    await userEvent.type(neighborhoodInput, 'Almagro')
    expect(setZoneDraft).toHaveBeenCalled()
  })

  it('actualiza el costo de envío', async () => {
    const setZoneDraft = vi.fn()
    render(
      <DeliveryZonesConfig {...baseProps} setZoneDraft={setZoneDraft} />
    )

    const costInput = screen.getByLabelText('Costo de envío')
    await userEvent.clear(costInput)
    await userEvent.type(costInput, '3200')
    expect(setZoneDraft).toHaveBeenCalled()
  })

  it('actualiza el orden', async () => {
    const setZoneDraft = vi.fn()
    render(
      <DeliveryZonesConfig {...baseProps} setZoneDraft={setZoneDraft} />
    )

    const orderInput = screen.getByLabelText('Orden')
    await userEvent.clear(orderInput)
    await userEvent.type(orderInput, '3')
    expect(setZoneDraft).toHaveBeenCalled()
  })

  it('alterna el toggle de activo', async () => {
    const setZoneDraft = vi.fn()
    render(
      <DeliveryZonesConfig {...baseProps} setZoneDraft={setZoneDraft} />
    )

    const toggle = screen.getByLabelText('Zona activa')
    await userEvent.click(toggle)
    expect(setZoneDraft).toHaveBeenCalled()
  })

  it('muestra mensaje de éxito', () => {
    render(
      <DeliveryZonesConfig {...baseProps} zonesMsg="Zona guardada" />
    )
    expect(screen.getByText('Zona guardada')).toBeDefined()
  })

  it('muestra mensaje de error', () => {
    render(
      <DeliveryZonesConfig {...baseProps} zonesMsg="Error al guardar" />
    )
    expect(screen.getByText('Error al guardar')).toBeDefined()
  })

  it('renderiza modo edición con botón de cancelar', () => {
    render(
      <DeliveryZonesConfig
        {...baseProps}
        editingZoneId="z1"
        zoneDraft={{
          ...EMPTY_ZONE_DRAFT,
          name: 'Editando',
          neighborhoods: 'Palermo',
        }}
      />
    )
    expect(screen.getByText('Actualizar zona')).toBeDefined()
    expect(screen.getByText('Cancelar edición')).toBeDefined()
  })
})

describe('DeliveryConfigAdmin wrapper with zones', () => {
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
    zones: [] as DeliveryZone[],
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

  it('renderiza las cuatro secciones incluyendo zonas', () => {
    render(<DeliveryConfigAdmin {...baseWrapperProps} />)
    expect(screen.getByText('Ventana semanal de preventa')).toBeDefined()
    expect(screen.getByText('Costos de envío')).toBeDefined()
    expect(screen.getByText('Puntos de recogida')).toBeDefined()
    expect(screen.getByText('Zonas de entrega')).toBeDefined()
  })
})
