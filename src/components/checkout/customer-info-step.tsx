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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validación básica
    if (!data.email || !data.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }
    if (!data.name || data.name.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    if (!data.phone || data.phone.length < 9) {
      newErrors.phone = 'El teléfono debe tener al menos 9 dígitos';
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onUpdate({ ...data, email: e.target.value })}
              placeholder="tu@email.com"
              required
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <Input
              id="name"
              type="text"
              value={data.name}
              onChange={(e) => onUpdate({ ...data, name: e.target.value })}
              placeholder="Juan Pérez"
              required
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <Input
              id="phone"
              type="tel"
              value={data.phone}
              onChange={(e) => onUpdate({ ...data, phone: e.target.value })}
              placeholder="666 777 888"
              required
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
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
