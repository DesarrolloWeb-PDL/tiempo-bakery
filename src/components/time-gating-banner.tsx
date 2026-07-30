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
  openingDayLabel?: string;
  openingHour?: number;
  openingMinute?: number;
  closingDayLabel?: string;
  closingHour?: number;
  closingMinute?: number;
}

export function TimeGatingBanner({
  isOpen,
  timeRemaining,
  nextOpening,
  openingDayLabel,
  openingHour,
  openingMinute,
  closingDayLabel,
  closingHour,
  closingMinute,
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
              Realiza tu pedido entre {openingDayLabel} {String(openingHour).padStart(2, '0')}:{String(openingMinute).padStart(2, '0')} y {closingDayLabel} {String(closingHour).padStart(2, '0')}:{String(closingMinute).padStart(2, '0')}
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
    <Card className="bg-red-900/80 border-red-700">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-red-800/60 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-300" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-100">
            Temporalmente cerrado
          </h3>
          {timeRemaining && (
            <p className="text-sm text-red-200">
              Abrimos en: {timeRemaining.days}d {timeRemaining.hours}h{' '}
              {timeRemaining.minutes}m
            </p>
          )}
          <p className="text-xs text-red-300 mt-2">
            Horario de pedidos: {openingDayLabel} {String(openingHour).padStart(2, '0')}:{String(openingMinute).padStart(2, '0')} a {closingDayLabel} {String(closingHour).padStart(2, '0')}:{String(closingMinute).padStart(2, '0')}
          </p>
        </div>
        <Badge variant="destructive" className="shrink-0">
          Cerrado
        </Badge>
      </CardContent>
    </Card>
  );
}
