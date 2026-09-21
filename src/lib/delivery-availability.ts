import { DateTime } from 'luxon'
import { prisma } from '@/lib/db'
import type { DeliverySchedule } from '@/types/delivery'

export type AvailableSlot = DeliverySchedule & {
  currentOrders: number
  remaining: number
  available: boolean
}

export function toUtcMidnight(date: Date): DateTime {
  return DateTime.fromJSDate(date, { zone: 'utc' }).startOf('day')
}

function luxonWeekdayToJsDay(weekday: number): number {
  // Luxon: Monday=1 ... Sunday=7. JS Date: Sunday=0 ... Saturday=6.
  return weekday % 7
}

export function getCutoffDateTime(
  slot: Pick<DeliverySchedule, 'cutoffDay' | 'cutoffTime'>,
  deliveryDate: Date
): DateTime | null {
  if (slot.cutoffDay == null || slot.cutoffTime == null) {
    return null
  }

  const [hours, minutes] = slot.cutoffTime.split(':').map(Number)
  const deliveryStart = toUtcMidnight(deliveryDate)

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = deliveryStart.minus({ days: offset }).set({
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0,
    })

    if (luxonWeekdayToJsDay(candidate.weekday) === slot.cutoffDay) {
      return candidate
    }
  }

  return null
}

export function isCutoffPassed(
  slot: Pick<DeliverySchedule, 'cutoffDay' | 'cutoffTime'>,
  deliveryDate: Date,
  now: Date
): boolean {
  const cutoff = getCutoffDateTime(slot, deliveryDate)
  if (!cutoff) return false
  return DateTime.fromJSDate(now) >= cutoff
}

function countQueryForSlot(
  slotId: string,
  deliveryDate: Date
): Parameters<typeof prisma.order.count>[0] {
  const start = toUtcMidnight(deliveryDate)
  const end = start.endOf('day')

  return {
    where: {
      deliveryScheduleId: slotId,
      deliveryDate: {
        gte: start.toJSDate(),
        lte: end.toJSDate(),
      },
      status: { not: 'CANCELLED' },
      deletedAt: null,
    },
  }
}

export async function getAvailableSlots(
  deliveryDate: Date,
  now = new Date()
): Promise<AvailableSlot[]> {
  const dayOfWeek = luxonWeekdayToJsDay(toUtcMidnight(deliveryDate).weekday)

  const slots = await prisma.deliverySchedule.findMany({
    where: { isActive: true, dayOfWeek },
    orderBy: { startTime: 'asc' },
  })

  const counts = await Promise.all(
    slots.map((slot) => prisma.order.count(countQueryForSlot(slot.id, deliveryDate)))
  )

  return slots.map((slot, index) => {
    const currentOrders = counts[index]
    const remaining =
      slot.maxOrders == null ? Infinity : Math.max(0, slot.maxOrders - currentOrders)
    const available = remaining > 0 && !isCutoffPassed(slot, deliveryDate, now)

    return { ...slot, currentOrders, remaining, available }
  })
}

export async function isSlotAvailable(
  slotId: string,
  deliveryDate: Date,
  now = new Date()
): Promise<boolean> {
  const slot = await prisma.deliverySchedule.findUnique({ where: { id: slotId } })

  if (!slot || !slot.isActive) return false

  const currentOrders = await prisma.order.count(countQueryForSlot(slot.id, deliveryDate))
  const remaining =
    slot.maxOrders == null ? Infinity : Math.max(0, slot.maxOrders - currentOrders)

  if (remaining <= 0) return false

  return !isCutoffPassed(slot, deliveryDate, now)
}

function buildAvailableSlot(
  slot: DeliverySchedule,
  deliveryDate: Date,
  now: Date,
  currentOrders: number
): AvailableSlot {
  const remaining =
    slot.maxOrders == null ? Infinity : Math.max(0, slot.maxOrders - currentOrders)
  const available = remaining > 0 && !isCutoffPassed(slot, deliveryDate, now)

  return { ...slot, currentOrders, remaining, available }
}

export async function getSlotsForCheckout(
  now = new Date(),
  horizonDays = 14
): Promise<Array<{ date: Date; slot: AvailableSlot }>> {
  const allActive = await prisma.deliverySchedule.findMany({
    where: { isActive: true },
    orderBy: { startTime: 'asc' },
  })

  const start = toUtcMidnight(now)
  const result: Array<{ date: Date; slot: AvailableSlot }> = []

  for (let offset = 0; offset < horizonDays; offset++) {
    const date = start.plus({ days: offset }).toJSDate()
    const dayOfWeek = luxonWeekdayToJsDay(toUtcMidnight(date).weekday)
    const slots = allActive.filter((slot) => slot.dayOfWeek === dayOfWeek)

    const counts = await Promise.all(
      slots.map((slot) => prisma.order.count(countQueryForSlot(slot.id, date)))
    )

    for (let i = 0; i < slots.length; i++) {
      const slot = buildAvailableSlot(slots[i], date, now, counts[i])
      if (slot.available) {
        result.push({ date, slot })
      }
    }
  }

  return result
}
