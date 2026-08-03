'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { DeliveryMethod, PaymentProvider, type PaymentMethodOption, type ShippingCosts } from '@/types/checkout';
import type { CartItem } from '@/types/cart';
import { normalizePublicAssetUrl } from '@/lib/url-normalizer';

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
  paymentOptions: PaymentMethodOption[];
  selectedPaymentProvider: PaymentProvider;
  onPaymentProviderChange: (provider: PaymentProvider) => void;
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
  paymentOptions,
  selectedPaymentProvider,
  onPaymentProviderChange,
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
          <h3 className="font-semibold mb-3" style={{ color: 'var(--brand-text-primary)' }}>Productos ({items.length})</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
                <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--brand-secondary)' }}>
                  <Image
                    src={normalizePublicAssetUrl(item.imageUrl) || '/img/espiga.png'}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.weight && (
                    <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{item.weight}g</p>
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
                  <p className="font-semibold text-brand-gold-dark">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información del cliente */}
        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--brand-text-primary)' }}>Información de contacto</h3>
          <div className="rounded-lg p-4 space-y-1" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
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
          <h3 className="font-semibold mb-3" style={{ color: 'var(--brand-text-primary)' }}>Método de entrega</h3>
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
            <p className="font-medium text-sm mb-2">
              {deliveryMethodNames[deliveryData.method]}
            </p>
            {deliveryData.method === DeliveryMethod.PICKUP_POINT && selectedPickupPoint && (
              <div className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
                <p className="font-medium">{selectedPickupPoint.name}</p>
                <p>
                  {selectedPickupPoint.address}, {selectedPickupPoint.city}
                </p>
                <p className="text-brand-gold-dark mt-1">{selectedPickupPoint.schedule}</p>
              </div>
            )}
            {(deliveryData.method === DeliveryMethod.LOCAL_DELIVERY ||
              deliveryData.method === DeliveryMethod.NATIONAL_COURIER) && (
              <div className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
                <p>{deliveryData.address}</p>
                <p>
                  {deliveryData.city}, {deliveryData.postalCode}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--brand-text-primary)' }}>Pago</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentOptions.map((option) => {
              const selected = option.value === selectedPaymentProvider;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onPaymentProviderChange(option.value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? 'border-brand-gold bg-brand-gold/5 ring-1 ring-brand-gold/20'
                      : 'hover:border-brand-gold/40'
                  }`}
                  style={!selected ? { borderColor: 'var(--brand-border)' } : undefined}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--brand-text-primary)' }}>{option.label}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                      {option.description ?? (option.value === PaymentProvider.MERCADO_PAGO
                        ? 'Checkout Pro con billetera, tarjetas y medios locales.'
                        : option.value === PaymentProvider.BANK_TRANSFER
                          ? 'Transferencia manual con los datos configurados en el panel.'
                          : 'Pago con tarjeta redirigido a Stripe Checkout.')}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notas adicionales */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--brand-text-primary)' }}
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
          <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            {customerNotes.length}/500 caracteres
          </p>
        </div>

        {/* Resumen de costos */}
        <div className="border-t pt-4" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--brand-text-muted)' }}>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--brand-text-muted)' }}>Gastos de envío</span>
              <span className="font-medium">
                {shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2" style={{ borderColor: 'var(--brand-border)' }}>
              <span>Total</span>
              <span className="text-brand-gold-dark">{formatCurrency(total)}</span>
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
