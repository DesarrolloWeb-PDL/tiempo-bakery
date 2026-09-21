'use client'

import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  PreventaConfig,
  type PreventaConfig as PreventaConfigType,
} from './preventa-config'
import {
  ShippingCostsConfig,
  type ShippingCosts,
} from './shipping-costs-config'
import {
  PickupPointsConfig,
  type PickupPoint,
  type PickupPointDraft,
} from './pickup-points-config'
import {
  DeliveryZonesConfig,
  type ZoneDraft,
} from './delivery-zones-config'
import {
  DeliveryScheduleConfig,
  type ScheduleDraft,
} from './delivery-schedule-config'
import type { DeliveryScheduleWithAvailability, DeliveryZone } from '@/types/delivery'

export type DeliveryConfigAdminProps = {
  preventa: PreventaConfigType
  setPreventa: Dispatch<SetStateAction<PreventaConfigType>>
  loadingPreventa: boolean
  savingPreventa: boolean
  preventaMsg: string | null
  onRefreshPreventa: () => void
  onSavePreventa: () => void
  onResetPreventa: () => void
  shippingCosts: ShippingCosts
  setShippingCosts: Dispatch<SetStateAction<ShippingCosts>>
  loadingShipping: boolean
  savingShipping: boolean
  shippingMsg: string | null
  onSaveShipping: () => void
  onResetShipping: () => void
  pickupPoints: PickupPoint[]
  pickupDraft: PickupPointDraft
  setPickupDraft: Dispatch<SetStateAction<PickupPointDraft>>
  editingPickupId: string | null
  loadingPickupPoints: boolean
  savingPickupPoint: boolean
  pickupPointsMsg: string | null
  onRefreshPickupPoints: () => void
  onEditPickupPoint: (point: PickupPoint) => void
  onCancelEditPickupPoint: () => void
  onSavePickupPoint: () => void
  onDeletePickupPoint: (id: string) => void
  zones: DeliveryZone[]
  zoneDraft: ZoneDraft
  setZoneDraft: Dispatch<SetStateAction<ZoneDraft>>
  editingZoneId: string | null
  loadingZones: boolean
  savingZone: boolean
  zonesMsg: string | null
  onRefreshZones: () => void
  onEditZone: (zone: DeliveryZone) => void
  onCancelEditZone: () => void
  onSaveZone: () => void
  onDeleteZone: (id: string) => void
  schedules: DeliveryScheduleWithAvailability[]
  scheduleDraft: ScheduleDraft
  setScheduleDraft: Dispatch<SetStateAction<ScheduleDraft>>
  editingScheduleId: string | null
  loadingSchedules: boolean
  savingSchedule: boolean
  schedulesMsg: string | null
  onRefreshSchedules: () => void
  onEditSchedule: (schedule: DeliveryScheduleWithAvailability) => void
  onCancelEditSchedule: () => void
  onSaveSchedule: () => void
  onDeleteSchedule: (id: string) => void
}

export function DeliveryConfigAdmin(props: DeliveryConfigAdminProps) {
  return (
    <div className="space-y-6">
      <PreventaConfig
        preventa={props.preventa}
        setPreventa={props.setPreventa}
        loadingPreventa={props.loadingPreventa}
        savingPreventa={props.savingPreventa}
        preventaMsg={props.preventaMsg}
        onRefreshPreventa={props.onRefreshPreventa}
        onSavePreventa={props.onSavePreventa}
        onResetPreventa={props.onResetPreventa}
      />
      <ShippingCostsConfig
        shippingCosts={props.shippingCosts}
        setShippingCosts={props.setShippingCosts}
        loadingShipping={props.loadingShipping}
        savingShipping={props.savingShipping}
        shippingMsg={props.shippingMsg}
        onSaveShipping={props.onSaveShipping}
        onResetShipping={props.onResetShipping}
      />
      <PickupPointsConfig
        pickupPoints={props.pickupPoints}
        pickupDraft={props.pickupDraft}
        setPickupDraft={props.setPickupDraft}
        editingPickupId={props.editingPickupId}
        loadingPickupPoints={props.loadingPickupPoints}
        savingPickupPoint={props.savingPickupPoint}
        pickupPointsMsg={props.pickupPointsMsg}
        onRefreshPickupPoints={props.onRefreshPickupPoints}
        onEditPickupPoint={props.onEditPickupPoint}
        onCancelEditPickupPoint={props.onCancelEditPickupPoint}
        onSavePickupPoint={props.onSavePickupPoint}
        onDeletePickupPoint={props.onDeletePickupPoint}
      />
      <DeliveryZonesConfig
        zones={props.zones}
        zoneDraft={props.zoneDraft}
        setZoneDraft={props.setZoneDraft}
        editingZoneId={props.editingZoneId}
        loadingZones={props.loadingZones}
        savingZone={props.savingZone}
        zonesMsg={props.zonesMsg}
        onRefreshZones={props.onRefreshZones}
        onEditZone={props.onEditZone}
        onCancelEditZone={props.onCancelEditZone}
        onSaveZone={props.onSaveZone}
        onDeleteZone={props.onDeleteZone}
      />
      <DeliveryScheduleConfig
        schedules={props.schedules}
        scheduleDraft={props.scheduleDraft}
        setScheduleDraft={props.setScheduleDraft}
        editingScheduleId={props.editingScheduleId}
        loadingSchedules={props.loadingSchedules}
        savingSchedule={props.savingSchedule}
        schedulesMsg={props.schedulesMsg}
        onRefreshSchedules={props.onRefreshSchedules}
        onEditSchedule={props.onEditSchedule}
        onCancelEditSchedule={props.onCancelEditSchedule}
        onSaveSchedule={props.onSaveSchedule}
        onDeleteSchedule={props.onDeleteSchedule}
      />
    </div>
  )
}
