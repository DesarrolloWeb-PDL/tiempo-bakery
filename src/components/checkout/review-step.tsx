'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { DeliveryMethod, type ShippingCosts } from '@/types/checkout';
import type { CartItem } from '@/types/cart';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

interface ReviewStepProps {
  items: CartItem[];
  shippingCosts: ShippingCosts;
  customerData: {
    email: string;
    name: string;
    phone: string;
  };
  deliveryData: {
    method: DeliveryMethod;
    pickupLocationId?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  pickupPoints: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    schedule: string;
  }>;
  customerNotes: string;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({
  items,
  shippingCosts,
  customerData,
  deliveryData,
  pickupPoints,
  customerNotes,
  onNotesChange,
  onBack,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = shippingCosts[deliveryData.method];
  const total = subtotal + shippingCost;

  const selectedPickupPoint = deliveryData.pickupLocationId
    ? pickupPoints.find((p) => p.id === deliveryData.pickupLocationId)
    : null;

  const deliveryMethodNames = {
    PICKUP_POINT: 'Recogida en punto',
    LOCAL_DELIVERY: 'Envío local',
    NATIONAL_COURIER: 'Mensajería nacional',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisa tu pedido</CardTitle>
        <CardDescription>
          Verifica que todo es correcto antes de proceder al pago
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Productos */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Productos ({items.length})</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-white">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.weight && (
                    <p className="text-xs text-gray-500">{item.weight}g</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      x{item.quantity}
                    </Badge>
                    {item.sliced && (
                      <Badge variant="outline" className="text-xs">
                        Rebanado
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-amber-700">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información del cliente */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Información de contacto</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm">
              <span className="font-medium">Nombre:</span> {customerData.name}
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span> {customerData.email}
            </p>
            <p className="text-sm">
              <span className="font-medium">Teléfono:</span> {customerData.phone}
            </p>
          </div>
        </div>

        {/* Método de entrega */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Método de entrega</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-sm mb-2">
              {deliveryMethodNames[deliveryData.method]}
            </p>
            {deliveryData.method === DeliveryMethod.PICKUP_POINT && selectedPickupPoint && (
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedPickupPoint.name}</p>
                <p>
                  {selectedPickupPoint.address}, {selectedPickupPoint.city}
                </p>
                <p className="text-amber-700 mt-1">{selectedPickupPoint.schedule}</p>
              </div>
            )}
            {(deliveryData.method === DeliveryMethod.LOCAL_DELIVERY ||
              deliveryData.method === DeliveryMethod.NATIONAL_COURIER) && (
              <div className="text-sm text-gray-600">
                <p>{deliveryData.address}</p>
                <p>
                  {deliveryData.city}, {deliveryData.postalCode}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notas adicionales */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Notas adicionales (opcional)
          </label>
          <Textarea
            id="notes"
            value={customerNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="¿Alguna petición especial? Déjanos tus comentarios aquí..."
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {customerNotes.length}/500 caracteres
          </p>
        </div>

        {/* Resumen de costos */}
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gastos de envío</span>
              <span className="font-medium">
                {shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total</span>
              <span className="text-amber-700">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            Atrás
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Proceder al pago'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
