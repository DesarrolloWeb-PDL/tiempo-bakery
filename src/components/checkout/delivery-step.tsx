'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Package } from 'lucide-react';
import { DeliveryMethod, type ShippingCosts, type CheckoutFormData } from '@/types/checkout';
import { formatCurrency } from '@/lib/format';
import { useLanguage } from '@/components/language-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DeliveryZone, AvailableSlot } from '@/types/delivery';


interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  schedule: string;
  instructions?: string;
}

interface DeliveryDayOption {
  date: Date;
  slot: AvailableSlot;
}

interface DeliveryStepProps {
  pickupPoints: PickupPoint[];
  selectedMethod: DeliveryMethod;
  shippingCosts: ShippingCosts;
  zones?: DeliveryZone[];
  availableDays?: DeliveryDayOption[];
  pickupLocationId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  zoneId?: string;
  scheduleId?: string;
  deliveryDate?: Date | string;
  onUpdate: (data: Partial<CheckoutFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function formatDayLabel(date: Date, startTime: string, endTime: string) {
  const formatter = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
  });
  const day = formatter.format(date);
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${startTime} - ${endTime}`;
}

export function DeliveryStep({
  pickupPoints,
  selectedMethod,
  shippingCosts,
  zones = [],
  availableDays = [],
  pickupLocationId,
  address,
  city,
  postalCode,
  zoneId,
  scheduleId,
  deliveryDate,
  onUpdate,
  onNext,
  onBack,
}: DeliveryStepProps) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { t } = useLanguage();

  const selectedZone = zones.find((z) => z.id === zoneId);
  const localDeliveryCost =
    selectedMethod === DeliveryMethod.LOCAL_DELIVERY && selectedZone
      ? selectedZone.shippingCost
      : shippingCosts.LOCAL_DELIVERY;

  const isDeliveryValid =
    selectedMethod === DeliveryMethod.PICKUP_POINT
      ? !!pickupLocationId
      : selectedMethod === DeliveryMethod.LOCAL_DELIVERY
        ? !!(address && city && postalCode)
        : !!(address && city && postalCode);

  const handleMethodChange = (method: DeliveryMethod) => {
    onUpdate({
      deliveryMethod: method,
      pickupLocationId: undefined,
      shippingAddress: '',
      shippingCity: '',
      shippingPostal: '',
      zoneId: undefined,
      scheduleId: undefined,
      deliveryDate: undefined,
    });
  };

  const handleZoneChange = (value: string) => {
    onUpdate({
      zoneId: value === '__none__' ? undefined : value,
      scheduleId: undefined,
      deliveryDate: undefined,
    });
  };

  const handleDayChange = (value: string) => {
    const [scheduleId, date] = value.split(':');
    onUpdate({ scheduleId, deliveryDate: new Date(date) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (selectedMethod === DeliveryMethod.PICKUP_POINT && !pickupLocationId) {
      newErrors.pickup = t.deliveryErrorPickup;
    }

    if (
      (selectedMethod === DeliveryMethod.LOCAL_DELIVERY ||
        selectedMethod === DeliveryMethod.NATIONAL_COURIER) &&
      (!address || !city || !postalCode)
    ) {
      if (!address) newErrors.address = t.deliveryErrorAddress;
      if (!city) newErrors.city = t.deliveryErrorCity;
      if (!postalCode) newErrors.postalCode = t.deliveryErrorPostal;
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
      title: t.deliveryPickup,
      description: t.deliveryPickupDesc,
      cost: shippingCosts.PICKUP_POINT,
    },
    {
      method: DeliveryMethod.LOCAL_DELIVERY,
      icon: Truck,
      title: t.deliveryLocal,
      description: t.deliveryLocalDesc,
      cost: localDeliveryCost,
    },
    ...(shippingCosts.nationalCourierEnabled
      ? [
          {
            method: DeliveryMethod.NATIONAL_COURIER,
            icon: Package,
            title: t.deliveryCourier,
            description: t.deliveryCourierDesc,
            cost: shippingCosts.NATIONAL_COURIER,
          },
        ]
      : []),
  ];

  const deliveryDateString = deliveryDate
    ? typeof deliveryDate === 'string'
      ? deliveryDate
      : deliveryDate.toISOString()
    : undefined;
  const selectedDayValue = scheduleId && deliveryDateString
    ? `${scheduleId}:${deliveryDateString.split('T')[0]}`
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.deliveryTitle}</CardTitle>
        <CardDescription>
          {t.deliveryDesc}
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
                      {option.cost === 0 ? t.checkoutFree : formatCurrency(option.cost)}
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
                {t.deliverySelectPickup}
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

          {selectedMethod === DeliveryMethod.LOCAL_DELIVERY && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--brand-text-primary)' }}
                >
                  {t.deliveryAddress}
                </label>
                <Input
                  id="address"
                  type="text"
                  value={address || ''}
                  onChange={(e) => onUpdate({ shippingAddress: e.target.value })}
                  placeholder="Casa N° - Manzana - Barrio - Calle N°"
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
                    {t.deliveryCity}
                  </label>
                  <Input
                    id="city"
                    type="text"
                    value={city || ''}
                    onChange={(e) => onUpdate({ shippingCity: e.target.value })}
                    placeholder="Ciudad"
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
                    {t.deliveryPostal}
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

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--brand-text-primary)' }}
                >
                  {t.deliveryZoneLabel}
                </label>
                <Select value={zoneId ?? ''} onValueChange={handleZoneChange}>
                  <SelectTrigger aria-label={t.deliveryZoneLabel}>
                    <SelectValue placeholder={t.deliveryZonePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t.deliveryZonePlaceholder}</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedZone && availableDays.length > 0 && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--brand-text-primary)' }}
                  >
                    {t.deliveryDayLabel}
                  </label>
                  <Select value={selectedDayValue ?? ''} onValueChange={handleDayChange}>
                    <SelectTrigger aria-label={t.deliveryDayLabel}>
                      <SelectValue placeholder={t.deliveryDayPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDays.map((day) => {
                        const value = `${day.slot.id}:${day.date.toISOString().split('T')[0]}`;
                        return (
                          <SelectItem key={value} value={value}>
                            {formatDayLabel(day.date, day.slot.startTime, day.slot.endTime)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {selectedMethod === DeliveryMethod.NATIONAL_COURIER && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--brand-text-primary)' }}
                >
                  {t.deliveryAddress}
                </label>
                <Input
                  id="address"
                  type="text"
                  value={address || ''}
                  onChange={(e) => onUpdate({ shippingAddress: e.target.value })}
                  placeholder="Casa N° - Manzana - Barrio - Calle N°"
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
                    {t.deliveryCity}
                  </label>
                  <Input
                    id="city"
                    type="text"
                    value={city || ''}
                    onChange={(e) => onUpdate({ shippingCity: e.target.value })}
                    placeholder="Ciudad"
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
                    {t.deliveryPostal}
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
              {t.deliveryBack}
            </Button>
            <Button type="submit" className="flex-1">
              {t.deliveryContinue}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
