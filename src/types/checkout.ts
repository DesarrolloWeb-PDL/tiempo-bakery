import { z } from 'zod';

// Enums
export enum DeliveryMethod {
  PICKUP_POINT = 'PICKUP_POINT',
  LOCAL_DELIVERY = 'LOCAL_DELIVERY',
  NATIONAL_COURIER = 'NATIONAL_COURIER',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  MERCADO_PAGO = 'MERCADO_PAGO',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// Schemas de validación
export const checkoutCustomerSchema = z.object({
  customerEmail: z.string().email('Email inválido'),
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerPhone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
});

export const checkoutDeliverySchema = z.discriminatedUnion('deliveryMethod', [
  z.object({
    deliveryMethod: z.literal(DeliveryMethod.PICKUP_POINT),
    pickupLocationId: z.string().min(1, 'Selecciona un punto de recogida'),
  }),
  z.object({
    deliveryMethod: z.literal(DeliveryMethod.LOCAL_DELIVERY),
    shippingAddress: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
    shippingCity: z.string().min(2, 'La ciudad es requerida'),
    shippingPostal: z.string().min(5, 'El código postal es requerido'),
  }),
  z.object({
    deliveryMethod: z.literal(DeliveryMethod.NATIONAL_COURIER),
    shippingAddress: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
    shippingCity: z.string().min(2, 'La ciudad es requerida'),
    shippingPostal: z.string().min(5, 'El código postal es requerido'),
  }),
]);

export const checkoutNotesSchema = z.object({
  customerNotes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

// Schema completo del checkout para validación en el servidor
export const checkoutSchema = z.object({
  customerEmail: z.string().email('Email inválido'),
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerPhone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  paymentProvider: z.nativeEnum(PaymentProvider).optional(),
  pickupLocationId: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingPostal: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      sliced: z.boolean().default(true),
    })
  ),
  customerNotes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
});

// Tipos derivados de los schemas
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
  paymentProvider?: PaymentProvider;
  error?: string;
}

export interface PaymentMethodOption {
  value: PaymentProvider;
  label: string;
  description?: string;
}
