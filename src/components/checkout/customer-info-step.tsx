'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutCustomerData } from '@/types/checkout';

interface CustomerInfoStepProps {
  data: CheckoutCustomerData;
  onUpdate: (data: CheckoutCustomerData) => void;
  onNext: () => void;
}

export function CustomerInfoStep({ data, onUpdate, onNext }: CustomerInfoStepProps) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [autoAdvance, setAutoAdvance] = React.useState(false);

  const isValid =
    data.customerEmail.includes('@') &&
    data.customerName.length >= 2 &&
    data.customerPhone.length >= 9;

  React.useEffect(() => {
    if (!isValid) {
      setAutoAdvance(false);
      return;
    }
    const timer = setTimeout(() => setAutoAdvance(true), 1200);
    return () => clearTimeout(timer);
  }, [data.customerEmail, data.customerName, data.customerPhone, isValid]);

  React.useEffect(() => {
    if (autoAdvance && Object.keys(errors).length === 0) {
      onNext();
    }
  }, [autoAdvance, errors, onNext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!data.customerEmail || !data.customerEmail.includes('@')) {
      newErrors.customerEmail = 'Email inválido';
    }
    if (!data.customerName || data.customerName.length < 2) {
      newErrors.customerName = 'El nombre debe tener al menos 2 caracteres';
    }
    if (!data.customerPhone || data.customerPhone.length < 9) {
      newErrors.customerPhone = 'El teléfono debe tener al menos 9 dígitos';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de contacto</CardTitle>
        <CardDescription>
          Te enviaremos la confirmación de pedido a este email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-primary)' }}>
              Email *
            </label>
            <Input
              id="customerEmail"
              type="email"
              value={data.customerEmail}
              onChange={(e) => onUpdate({ ...data, customerEmail: e.target.value })}
              placeholder="tu@email.com"
              required
            />
            {errors.customerEmail && (
              <p className="text-sm text-red-600 mt-1">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerName" className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-primary)' }}>
              Nombre completo *
            </label>
            <Input
              id="customerName"
              type="text"
              value={data.customerName}
              onChange={(e) => onUpdate({ ...data, customerName: e.target.value })}
              placeholder="Juan Pérez"
              required
            />
            {errors.customerName && (
              <p className="text-sm text-red-600 mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerPhone" className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-primary)' }}>
              Teléfono *
            </label>
            <Input
              id="customerPhone"
              type="tel"
              value={data.customerPhone}
              onChange={(e) => onUpdate({ ...data, customerPhone: e.target.value })}
              placeholder="666 777 888"
              required
            />
            {errors.customerPhone && (
              <p className="text-sm text-red-600 mt-1">{errors.customerPhone}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg">
            Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
