'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutCustomerData } from '@/types/checkout';
import { useLanguage } from '@/components/language-provider';

interface CustomerInfoStepProps {
  data: CheckoutCustomerData;
  onUpdate: (data: CheckoutCustomerData) => void;
  onNext: () => void;
}

export function CustomerInfoStep({ data, onUpdate, onNext }: CustomerInfoStepProps) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!data.customerEmail || !data.customerEmail.includes('@')) {
      newErrors.customerEmail = t.customerErrorEmail;
    }
    if (!data.customerName || data.customerName.length < 2) {
      newErrors.customerName = t.customerErrorName;
    }
    if (!data.customerPhone || data.customerPhone.length < 9) {
      newErrors.customerPhone = t.customerErrorPhone;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.customerInfoTitle}</CardTitle>
        <CardDescription>
          {t.customerInfoDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-primary)' }}>
              {t.customerEmail}
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
              {t.customerName}
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
              {t.customerPhone}
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
            {t.customerContinue}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
