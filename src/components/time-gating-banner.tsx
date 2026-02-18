'use client';

import * as React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimeGatingBannerProps {
  isOpen: boolean;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  nextOpening?: string;
}

export function TimeGatingBanner({
  isOpen,
  timeRemaining,
  nextOpening,
}: TimeGatingBannerProps) {
  if (isOpen) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">
              ¡Estamos abiertos!
            </h3>
            <p className="text-sm text-green-700">
              Realiza tu pedido antes del domingo a las 20:00
            </p>
          </div>
          <Badge variant="success" className="shrink-0">
            Abierto
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">
            Temporalmente cerrado
          </h3>
          {timeRemaining && (
            <p className="text-sm text-amber-700">
              Abrimos en: {timeRemaining.days}d {timeRemaining.hours}h{' '}
              {timeRemaining.minutes}m
            </p>
          )}
        </div>
        <Badge variant="warning" className="shrink-0">
          Cerrado
        </Badge>
      </CardContent>
    </Card>
  );
}
