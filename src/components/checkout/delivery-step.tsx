'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Package } from 'lucide-react';
import { DeliveryMethod, type ShippingCosts } from '@/types/checkout';
import { formatCurrency } from '@/lib/format';

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  schedule: string;
  instructions?: string;
}

interface DeliveryStepProps {
  pickupPoints: PickupPoint[];
  selectedMethod: DeliveryMethod;
  shippingCosts: ShippingCosts;
  pickupLocationId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  onUpdate: (data: {
    deliveryMethod?: DeliveryMethod;
    pickupLocationId?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingPostal?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DeliveryStep({
  pickupPoints,
  selectedMethod,
  shippingCosts,
  pickupLocationId,
  address,
  city,
  postalCode,
  onUpdate,
  onNext,
  onBack,
}: DeliveryStepProps) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [autoAdvance, setAutoAdvance] = React.useState(false);

  const isDeliveryValid =
    selectedMethod === DeliveryMethod.PICKUP_POINT
      ? !!pickupLocationId
      : !!(address && city && postalCode);

  React.useEffect(() => {
    if (!isDeliveryValid) {
      setAutoAdvance(false);
      return;
    }
    const timer = setTimeout(() => setAutoAdvance(true), 1000);
    return () => clearTimeout(timer);
  }, [selectedMethod, pickupLocationId, address, city, postalCode, isDeliveryValid]);

  React.useEffect(() => {
    if (autoAdvance && Object.keys(errors).length === 0) {
      onNext();
    }
  }, [autoAdvance, errors, onNext]);

  const handleMethodChange = (method: DeliveryMethod) => {
    onUpdate({ deliveryMethod: method, pickupLocationId: undefined, shippingAddress: '', shippingCity: '', shippingPostal: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (selectedMethod === DeliveryMethod.PICKUP_POINT && !pickupLocationId) {
      newErrors.pickup = 'Selecciona un punto de recogida';
    }

    if (
      (selectedMethod === DeliveryMethod.LOCAL_DELIVERY ||
        selectedMethod === DeliveryMethod.NATIONAL_COURIER) &&
      (!address || !city || !postalCode)
    ) {
      if (!address) newErrors.address = 'La dirección es requerida';
      if (!city) newErrors.city = 'La ciudad es requerida';
      if (!postalCode) newErrors.postalCode = 'El código postal es requerido';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  const deliveryOptions = [
    {
      method: DeliveryMethod.PICKUP_POINT,
      icon: MapPin,
      title: 'Recogida en punto',
      description: 'Gratis - Recoge en uno de nuestros puntos de venta',
      cost: shippingCosts.PICKUP_POINT,
    },
    {
      method: DeliveryMethod.LOCAL_DELIVERY,
      icon: Truck,
      title: 'Envío local (Utrera)',
      description: 'Entrega a domicilio en Utrera',
      cost: shippingCosts.LOCAL_DELIVERY,
    },
    {
      method: DeliveryMethod.NATIONAL_COURIER,
      icon: Package,
      title: 'Mensajería nacional',
      description: 'Envío a toda España',
      cost: shippingCosts.NATIONAL_COURIER,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Método de entrega</CardTitle>
        <CardDescription>
          Selecciona cómo quieres recibir tu pedido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Opciones de entrega */}
          <div className="space-y-3">
            {deliveryOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedMethod === option.method;

              return (
                <button
                  key={option.method}
                  type="button"
                  onClick={() => handleMethodChange(option.method)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'hover:opacity-80'
                  }`}
                  style={!isSelected ? { borderColor: 'var(--brand-border)' } : undefined}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Icon
                        className={`h-5 w-5 mt-1 ${
                          isSelected ? 'text-brand-gold' : ''
                        }`}
                        style={!isSelected ? { color: 'var(--brand-text-muted)' } : undefined}
                      />
                      <div>
                        <h3
                          className={`font-semibold ${
                            isSelected ? 'text-brand-gold-dark' : ''
                          }`}
                          style={!isSelected ? { color: 'var(--brand-text-primary)' } : undefined}
                        >
                          {option.title}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isSelected ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {option.cost === 0 ? 'Gratis' : formatCurrency(option.cost)}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Formulario según método seleccionado */}
          {selectedMethod === DeliveryMethod.PICKUP_POINT && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--brand-text-primary)' }}>
                Selecciona punto de recogida *
              </label>
              {pickupPoints.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => onUpdate({ deliveryMethod: DeliveryMethod.PICKUP_POINT, pickupLocationId: point.id })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    pickupLocationId === point.id
                      ? 'border-brand-gold bg-brand-gold/5'
                      : 'hover:opacity-80'
                  }`}
                  style={pickupLocationId !== point.id ? { borderColor: 'var(--brand-border)' } : undefined}
                >
                  <h4 className="font-semibold" style={{ color: 'var(--brand-text-primary)' }}>{point.name}</h4>
                  <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                    {point.address}, {point.city}
                  </p>
                  <p className="text-sm text-brand-gold-dark mt-1">{point.schedule}</p>
                  {point.instructions && (
                    <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{point.instructions}</p>
                  )}
                </button>
              ))}
              {errors.pickup && (
                <p className="text-sm text-red-600">{errors.pickup}</p>
              )}
            </div>
          )}

          {(selectedMethod === DeliveryMethod.LOCAL_DELIVERY ||
            selectedMethod === DeliveryMethod.NATIONAL_COURIER) && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--brand-text-primary)' }}
                >
                  Dirección *
                </label>
                <Input
                  id="address"
                  type="text"
                  value={address || ''}
                  onChange={(e) => onUpdate({ shippingAddress: e.target.value })}
                  placeholder="Calle, número, piso..."
                  required
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--brand-text-primary)' }}
                  >
                    Ciudad *
                  </label>
                  <Input
                    id="city"
                    type="text"
                    value={city || ''}
                    onChange={(e) => onUpdate({ shippingCity: e.target.value })}
                    placeholder="Utrera"
                    required
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--brand-text-primary)' }}
                  >
                    Código Postal *
                  </label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={postalCode || ''}
                    onChange={(e) => onUpdate({ shippingPostal: e.target.value })}
                    placeholder="41710"
                    required
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.postalCode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Atrás
            </Button>
            <Button type="submit" className="flex-1">
              Continuar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
