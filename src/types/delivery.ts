import { z } from 'zod'

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const deliveryZoneSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  neighborhoods: z.array(z.string().min(1, 'El barrio no puede estar vacío')).min(1, 'Al menos un barrio es requerido'),
  shippingCost: z.number().min(0, 'El costo de envío no puede ser negativo'),
  minOrderFree: z.number().min(0, 'El mínimo para envío gratis no puede ser negativo').optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0, 'El orden no puede ser negativo').default(0),
})

export const deliveryScheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0, 'Día inválido').max(6, 'Día inválido'),
    startTime: z.string().regex(hhmmRegex, 'El horario debe tener formato HH:mm'),
    endTime: z.string().regex(hhmmRegex, 'El horario debe tener formato HH:mm'),
    maxOrders: z.number().int().min(1, 'El máximo de pedidos debe ser positivo').optional(),
    cutoffDay: z.number().int().min(0, 'Día de corte inválido').max(6, 'Día de corte inválido').optional(),
    cutoffTime: z.string().regex(hhmmRegex, 'El horario de corte debe tener formato HH:mm').optional(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'El horario de fin debe ser posterior al de inicio',
    path: ['endTime'],
  })
  .refine(
    (data) => {
      const hasCutoffDay = data.cutoffDay !== undefined && data.cutoffDay !== null
      const hasCutoffTime = data.cutoffTime !== undefined && data.cutoffTime !== null
      return hasCutoffDay === hasCutoffTime
    },
    {
      message: 'Día y hora de corte deben estar ambos presentes o ambos ausentes',
      path: ['cutoffTime'],
    }
  )

export const deliveryPersonSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

export const deliveryAssignmentSchema = z.object({
  orderId: z.string().min(1, 'El pedido es requerido'),
  deliveryPersonId: z.string().min(1, 'El repartidor es requerido'),
})

export const deliveryAttemptSchema = z.object({
  status: z.string().min(1, 'El estado es requerido'),
  success: z.boolean(),
  reason: z.string().optional(),
  deliveryPersonId: z.string().optional(),
})

export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>
export type DeliveryScheduleInput = z.infer<typeof deliveryScheduleSchema>
export type DeliveryPersonInput = z.infer<typeof deliveryPersonSchema>
export type DeliveryAssignmentInput = z.infer<typeof deliveryAssignmentSchema>
export type DeliveryAttemptInput = z.infer<typeof deliveryAttemptSchema>

export type DeliveryZone = {
  id: string
  name: string
  neighborhoods: string[]
  shippingCost: number
  minOrderFree?: number | null
  isActive: boolean
  order: number
}

export type DeliveryZoneDraft = Omit<DeliveryZone, 'id'>

export type DeliverySchedule = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  maxOrders: number | null
  cutoffDay: number | null
  cutoffTime: string | null
  isActive: boolean
}

export type DeliveryScheduleWithAvailability = DeliverySchedule & {
  currentOrders?: number
  remaining?: number
  available?: boolean
}

export type AvailableSlot = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  maxOrders: number | null
  cutoffDay: number | null
  cutoffTime: string | null
  isActive: boolean
  currentOrders?: number
  remaining?: number
  available?: boolean
}

export type DeliveryScheduleDraft = Omit<DeliverySchedule, 'id'>

export type DeliveryPerson = {
  id: string
  name: string
  phone: string
  email: string | null
  isActive: boolean
}

export type DeliveryPersonDraft = Omit<DeliveryPerson, 'id'>

export type DeliveryAssignment = {
  id: string
  orderId: string
  deliveryPersonId: string
  status: string
  assignedAt: Date | string
  deliveredAt: Date | string | null
  failedReason: string | null
  deliveryPerson?: DeliveryPerson
  order?: {
    id: string
    orderNumber: string
    customerName: string
    status: string
  }
}

export type DeliveryAttempt = {
  id: string
  assignmentId: string
  deliveryPersonId: string | null
  status: string | null
  attemptedAt: Date | string
  success: boolean
  reason: string | null
}

export type AssignableOrder = {
  id: string
  orderNumber: string
  customerName: string
  status: string
  deliveryMethod: string
}
