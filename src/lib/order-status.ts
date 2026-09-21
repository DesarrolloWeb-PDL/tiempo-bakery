export const ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'BAKING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type DeliveryMethod = 'PICKUP_POINT' | 'LOCAL_DELIVERY' | 'NATIONAL_COURIER'

const BASE_FLOW: OrderStatus[] = [
  'PENDING',
  'PAID',
  'BAKING',
  'READY',
  'DELIVERED',
]

export const FLOW_BY_METHOD: Record<DeliveryMethod, OrderStatus[]> = {
  PICKUP_POINT: BASE_FLOW,
  NATIONAL_COURIER: BASE_FLOW,
  LOCAL_DELIVERY: [
    'PENDING',
    'PAID',
    'BAKING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ],
}

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['BAKING', 'CANCELLED'],
  BAKING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'CANCELLED'],
  DELIVERED: [],
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  CANCELLED: [],
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  BAKING: 'En horno',
  READY: 'Listo',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  DELIVERY_FAILED: 'Entrega fallida',
  CANCELLED: 'Cancelado',
}

export function canTransition(
  current: OrderStatus,
  next: OrderStatus,
  deliveryMethod: DeliveryMethod
): boolean {
  if (!TRANSITIONS[current].includes(next)) return false

  if (next === 'OUT_FOR_DELIVERY') {
    return deliveryMethod === 'LOCAL_DELIVERY'
  }

  return true
}

export function getNextStatuses(
  current: OrderStatus,
  deliveryMethod: DeliveryMethod
): OrderStatus[] {
  return TRANSITIONS[current].filter((status) =>
    canTransition(current, status, deliveryMethod)
  )
}

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status]
}

export function isValidStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus)
}

export function isValidDeliveryMethod(value: string): value is DeliveryMethod {
  return ['PICKUP_POINT', 'LOCAL_DELIVERY', 'NATIONAL_COURIER'].includes(value)
}
