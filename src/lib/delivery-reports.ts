import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type OrderForReport = {
  id: string
  orderNumber: string
  status: string
  deliveryMethod: string
  deliveryDate: Date | string | null
  deliveredAt: Date | string | null
  deliveryZoneId: string | null
  deliveryZone?: { id: string; name: string } | null
  assignment?: {
    assignedAt?: Date | string | null
    deliveredAt?: Date | string | null
    deliveryPersonId?: string | null
    deliveryPerson?: { id: string; name: string } | null
    attempts?: unknown[]
  } | null
}

export type ReportSummary = {
  total: number
  delivered: number
  failed: number
  outForDelivery: number
  successRate: number
  avgMinutes: number | null
}

export type DayMetrics = {
  date: string
  delivered: number
  failed: number
  total: number
}

export type PersonMetrics = {
  personId: string
  personName: string
  delivered: number
  failed: number
  total: number
}

export type ZoneMetrics = {
  zoneId: string
  zoneName: string
  delivered: number
  failed: number
  total: number
}

export type StatusMetrics = {
  status: string
  count: number
}

export type ReportFilters = {
  dateFrom?: Date
  dateTo?: Date
  personId?: string
  zoneId?: string
  status?: string
}

const EXCLUDED_STATUSES = new Set(['CANCELLED', 'REFUNDED'])

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null
  if (value instanceof Date) return value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function isExcludedStatus(status: string): boolean {
  return EXCLUDED_STATUSES.has(status)
}

function formatDateKey(date: Date | string | null | undefined): string | null {
  const d = toDate(date)
  if (!d) return null
  return d.toISOString().slice(0, 10)
}

export function calculateSuccessRate(orders: OrderForReport[]): number {
  const relevant = orders.filter((order) => !isExcludedStatus(order.status))
  const delivered = relevant.filter((order) => order.status === 'DELIVERED').length
  const failed = relevant.filter((order) => order.status === 'DELIVERY_FAILED').length
  if (delivered + failed === 0) return 0
  return Math.round((delivered / (delivered + failed)) * 100 * 100) / 100
}

export function calculateAverageMinutes(orders: OrderForReport[]): number | null {
  const delivered = orders.filter((order) => order.status === 'DELIVERED')
  const minutes: number[] = []

  for (const order of delivered) {
    if (!order.assignment) continue
    const assignedAt = toDate(order.assignment.assignedAt)
    const deliveredAt = toDate(order.deliveredAt ?? order.assignment.deliveredAt)
    if (!assignedAt || !deliveredAt) continue
    minutes.push((deliveredAt.getTime() - assignedAt.getTime()) / 60000)
  }

  if (minutes.length === 0) return null
  return Math.round((minutes.reduce((a, b) => a + b, 0) / minutes.length) * 100) / 100
}

export function groupByDay(orders: OrderForReport[]): DayMetrics[] {
  const map = new Map<string, DayMetrics>()

  for (const order of orders) {
    if (isExcludedStatus(order.status)) continue
    const dateKey = formatDateKey(order.deliveryDate) ?? 'sin-fecha'
    const entry = map.get(dateKey) ?? { date: dateKey, delivered: 0, failed: 0, total: 0 }
    entry.total++
    if (order.status === 'DELIVERED') entry.delivered++
    if (order.status === 'DELIVERY_FAILED') entry.failed++
    map.set(dateKey, entry)
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export function groupByPerson(orders: OrderForReport[]): PersonMetrics[] {
  const map = new Map<string, PersonMetrics>()

  for (const order of orders) {
    if (isExcludedStatus(order.status)) continue
    const personId = order.assignment?.deliveryPersonId ?? 'unassigned'
    const personName = order.assignment?.deliveryPerson?.name ?? 'Sin asignar'
    const entry = map.get(personId) ?? { personId, personName, delivered: 0, failed: 0, total: 0 }
    entry.total++
    if (order.status === 'DELIVERED') entry.delivered++
    if (order.status === 'DELIVERY_FAILED') entry.failed++
    map.set(personId, entry)
  }

  return Array.from(map.values()).sort((a, b) => a.personName.localeCompare(b.personName))
}

export function groupByZone(orders: OrderForReport[]): ZoneMetrics[] {
  const map = new Map<string, ZoneMetrics>()

  for (const order of orders) {
    if (isExcludedStatus(order.status)) continue
    const zoneId = order.deliveryZoneId ?? 'unassigned'
    const zoneName = order.deliveryZone?.name ?? 'Sin zona'
    const entry = map.get(zoneId) ?? { zoneId, zoneName, delivered: 0, failed: 0, total: 0 }
    entry.total++
    if (order.status === 'DELIVERED') entry.delivered++
    if (order.status === 'DELIVERY_FAILED') entry.failed++
    map.set(zoneId, entry)
  }

  return Array.from(map.values()).sort((a, b) => a.zoneName.localeCompare(b.zoneName))
}

export function groupByStatus(orders: OrderForReport[]): StatusMetrics[] {
  const map = new Map<string, StatusMetrics>()

  for (const order of orders) {
    if (isExcludedStatus(order.status)) continue
    const entry = map.get(order.status) ?? { status: order.status, count: 0 }
    entry.count++
    map.set(order.status, entry)
  }

  return Array.from(map.values()).sort((a, b) => a.status.localeCompare(b.status))
}

export type ReportResult = {
  summary: ReportSummary
  perDay: DayMetrics[]
  byPerson: PersonMetrics[]
  byZone: ZoneMetrics[]
  byStatus: StatusMetrics[]
  orders: Array<OrderForReport & { attemptsCount: number }>
}

export function buildReport(orders: OrderForReport[]): ReportResult {
  const relevant = orders.filter((order) => !isExcludedStatus(order.status))
  const delivered = relevant.filter((order) => order.status === 'DELIVERED').length
  const failed = relevant.filter((order) => order.status === 'DELIVERY_FAILED').length
  const outForDelivery = relevant.filter((order) => order.status === 'OUT_FOR_DELIVERY').length

  return {
    summary: {
      total: relevant.length,
      delivered,
      failed,
      outForDelivery,
      successRate: calculateSuccessRate(orders),
      avgMinutes: calculateAverageMinutes(orders),
    },
    perDay: groupByDay(orders),
    byPerson: groupByPerson(orders),
    byZone: groupByZone(orders),
    byStatus: groupByStatus(orders),
    orders: relevant.map((order) => ({
      ...order,
      attemptsCount: order.assignment?.attempts?.length ?? 0,
    })),
  }
}

export function buildReportWhere(filters: ReportFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
    deliveryMethod: 'LOCAL_DELIVERY',
  }

  if (filters.dateFrom || filters.dateTo) {
    where.deliveryDate = {}
    if (filters.dateFrom) where.deliveryDate.gte = filters.dateFrom
    if (filters.dateTo) where.deliveryDate.lte = filters.dateTo
  }

  if (filters.zoneId) where.deliveryZoneId = filters.zoneId
  if (filters.status) where.status = filters.status
  if (filters.personId) {
    where.assignment = { deliveryPersonId: filters.personId }
  }

  return where
}

export async function getDeliveryReportData(filters: ReportFilters) {
  const orders = await prisma.order.findMany({
    where: buildReportWhere(filters),
    include: {
      deliveryZone: { select: { id: true, name: true } },
      assignment: {
        include: {
          deliveryPerson: { select: { id: true, name: true } },
          attempts: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return orders
}

export async function getActiveDeliveryPersons() {
  return prisma.deliveryPerson.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export async function getActiveDeliveryZones() {
  return prisma.deliveryZone.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}
