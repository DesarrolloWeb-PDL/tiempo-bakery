// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  PreventaConfig,
  DEFAULT_PREVENTA_CONFIG,
} from '@/components/admin/delivery/preventa-config'
import { ShippingCostsConfig } from '@/components/admin/delivery/shipping-costs-config'
import {
  PickupPointsConfig,
  EMPTY_PICKUP_POINT,
  type PickupPoint,
} from '@/components/admin/delivery/pickup-points-config'
import {
  EMPTY_ZONE_DRAFT,
  type DeliveryZone,
} from '@/components/admin/delivery/delivery-zones-config'
import {
  EMPTY_SCHEDULE_DRAFT,
} from '@/components/admin/delivery/delivery-schedule-config'
import type { DeliveryScheduleWithAvailability } from '@/types/delivery'
import { DeliveryConfigAdmin } from '@/components/admin/delivery/delivery-config-tab'

describe('Entrega tab extraction', () => {
  beforeEach(() => {
    cleanup()
  })

  describe('PreventaConfig', () => {
    const baseProps = {
      preventa: DEFAULT_PREVENTA_CONFIG,
      setPreventa: vi.fn(),
      loadingPreventa: false,
      savingPreventa: false,
      preventaMsg: null,
      onRefreshPreventa: vi.fn(),
      onSavePreventa: vi.fn(),
      onResetPreventa: vi.fn(),
    }

    it('renderiza el título y el resumen de la ventana de preventa', () => {
      render(<PreventaConfig {...baseProps} />)
      expect(screen.getByText('Ventana semanal de preventa')).toBeDefined()
      expect(screen.getByText(/Miércoles 18:00/)).toBeDefined()
      expect(screen.getByText(/Domingo 20:00/)).toBeDefined()
    })

    it('alterna el checkbox de activación', async () => {
      const setPreventa = vi.fn()
      render(<PreventaConfig {...baseProps} setPreventa={setPreventa} />)
      const checkbox = screen.getByLabelText('Activar restricción de preventa')
      await userEvent.click(checkbox)
      expect(setPreventa).toHaveBeenCalledWith(expect.any(Function))
    })

    it('actualiza el día de apertura', async () => {
      const setPreventa = vi.fn()
      render(<PreventaConfig {...baseProps} setPreventa={setPreventa} />)
      const selects = screen.getAllByRole('combobox')
      // First select is opening day
      await userEvent.selectOptions(selects[0], '5')
      expect(setPreventa).toHaveBeenCalled()
    })

    it('deshabilita los controles mientras carga o guarda', () => {
      render(<PreventaConfig {...baseProps} loadingPreventa savingPreventa />)
      const checkbox = screen.getByLabelText(
        'Activar restricción de preventa'
      ) as HTMLInputElement
      expect(checkbox.disabled).toBe(true)
    })

    it('muestra el mensaje de error cuando existe', () => {
      render(<PreventaConfig {...baseProps} preventaMsg="Error de carga" />)
      expect(screen.getByText('Error de carga')).toBeDefined()
    })
  })

  describe('ShippingCostsConfig', () => {
    const baseProps = {
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
    }

    it('renderiza los costos y el texto de recogida gratis', () => {
      render(<ShippingCostsConfig {...baseProps} />)
      expect(screen.getByText('Costos de envío')).toBeDefined()
      expect(screen.getByDisplayValue('3500')).toBeDefined()
      expect(screen.getByDisplayValue('5950')).toBeDefined()
      expect(screen.getByText(/Recogida en punto siempre se mantiene/)).toBeDefined()
    })

    it('actualiza el costo de envío local', async () => {
      const setShippingCosts = vi.fn()
      render(<ShippingCostsConfig {...baseProps} setShippingCosts={setShippingCosts} />)
      const input = screen.getByDisplayValue('3500')
      await userEvent.clear(input)
      await userEvent.type(input, '4000')
      expect(setShippingCosts).toHaveBeenCalled()
    })

    it('dispara guardar y restablecer', async () => {
      const onSaveShipping = vi.fn()
      const onResetShipping = vi.fn()
      render(
        <ShippingCostsConfig
          {...baseProps}
          onSaveShipping={onSaveShipping}
          onResetShipping={onResetShipping}
        />
      )
      await userEvent.click(screen.getByText('Guardar costos'))
      await userEvent.click(screen.getByText('Restablecer'))
      expect(onSaveShipping).toHaveBeenCalled()
      expect(onResetShipping).toHaveBeenCalled()
    })
  })

  describe('PickupPointsConfig', () => {
    const points: PickupPoint[] = [
      {
        id: 'p1',
        name: 'Obrador Principal',
        address: 'Calle Falsa 123',
        city: 'Utrera',
        postalCode: '41710',
        schedule: 'Viernes 10:00 a 14:00',
        instructions: 'Tocar timbre',
        isActive: true,
        order: 1,
      },
      {
        id: 'p2',
        name: 'Punto Alternativo',
        address: 'Avenida Siempre Viva 742',
        city: 'Sevilla',
        postalCode: '41001',
        schedule: 'Sábados 09:00 a 13:00',
        instructions: '',
        isActive: false,
        order: 2,
      },
    ]

    const baseProps = {
      pickupPoints: points,
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
    }

    it('renderiza la lista de puntos con sus badges de estado', () => {
      render(<PickupPointsConfig {...baseProps} />)
      expect(screen.getByText('Obrador Principal')).toBeDefined()
      expect(screen.getByText('Punto Alternativo')).toBeDefined()
      expect(screen.getByText('Activo')).toBeDefined()
      expect(screen.getByText('Oculto')).toBeDefined()
    })

    it('dispara editar y eliminar', async () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <PickupPointsConfig
          {...baseProps}
          onEditPickupPoint={onEdit}
          onDeletePickupPoint={onDelete}
        />
      )
      const editButtons = screen.getAllByText('Editar')
      await userEvent.click(editButtons[0])
      expect(onEdit).toHaveBeenCalledWith(points[0])

      const deleteButtons = screen.getAllByRole('button', { name: '' })
      // Delete buttons contain only the Trash2 icon and have empty accessible name
      await userEvent.click(deleteButtons[deleteButtons.length - 1])
      expect(onDelete).toHaveBeenCalledWith(points[1].id)
    })

    it('renderiza estado vacío cuando no hay puntos', () => {
      render(<PickupPointsConfig {...baseProps} pickupPoints={[]} />)
      expect(
        screen.getByText('Todavía no hay puntos de recogida cargados.')
      ).toBeDefined()
    })

    it('actualiza el borrador del formulario', async () => {
      const setPickupDraft = vi.fn()
      render(<PickupPointsConfig {...baseProps} setPickupDraft={setPickupDraft} />)
      const nameInput = screen.getAllByRole('textbox')[0]
      await userEvent.type(nameInput, 'Nuevo Punto')
      expect(setPickupDraft).toHaveBeenCalled()
    })

    it('muestra modo edición con botón de cancelar', () => {
      render(
        <PickupPointsConfig
          {...baseProps}
          editingPickupId="p1"
          pickupDraft={{ ...EMPTY_PICKUP_POINT, name: 'Editando' }}
        />
      )
      expect(screen.getByText('Actualizar punto')).toBeDefined()
      expect(screen.getByText('Cancelar edición')).toBeDefined()
    })
  })

  describe('DeliveryConfigAdmin wrapper', () => {
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
      pickupPoints: [] as PickupPoint[],
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
})
