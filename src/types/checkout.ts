import { z } from 'zod';

// Enums
export enum DeliveryMethod {
  PICKUP_POINT = 'PICKUP_POINT',
  LOCAL_DELIVERY = 'LOCAL_DELIVERY',
  NATIONAL_COURIER = 'NATIONAL_COURIER',
}

// Schemas de validación
export const checkoutCustomerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
});

export const checkoutDeliverySchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal(DeliveryMethod.PICKUP_POINT),
    pickupLocationId: z.string().min(1, 'Selecciona un punto de recogida'),
  }),
  z.object({
    method: z.literal(DeliveryMethod.LOCAL_DELIVERY),
    address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
    city: z.string().min(2, 'La ciudad es requerida'),
    postalCode: z.string().min(5, 'El código postal es requerido'),
  }),
  z.object({
    method: z.literal(DeliveryMethod.NATIONAL_COURIER),
    address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
    city: z.string().min(2, 'La ciudad es requerida'),
    postalCode: z.string().min(5, 'El código postal es requerido'),
  }),
]);

export const checkoutNotesSchema = z.object({
  customerNotes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

// Schema completo del checkout para validación en el servidor
export const checkoutSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  method: z.nativeEnum(DeliveryMethod),
  pickupLocationId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  customerNotes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

// Types derivados de los schemas
export type CheckoutCustomerData = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutDeliveryData = z.infer<typeof checkoutDeliverySchema>;
export type CheckoutNotesData = z.infer<typeof checkoutNotesSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export interface ShippingCosts {
  PICKUP_POINT: number;
  LOCAL_DELIVERY: number;
  NATIONAL_COURIER: number;
}

// Costos de envío por defecto (fallback frontend)
export const DEFAULT_SHIPPING_COSTS: ShippingCosts = {
  PICKUP_POINT: 0,
  LOCAL_DELIVERY: 3500,
  NATIONAL_COURIER: 5950,
} as const;

// Interfaz para el resumen del pedido
export interface OrderSummary {
  subtotal: number;
  shippingCost: number;
  total: number;
  itemCount: number;
}

// Interfaz para la respuesta del API de checkout
export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  checkoutUrl?: string;
  error?: string;
}
