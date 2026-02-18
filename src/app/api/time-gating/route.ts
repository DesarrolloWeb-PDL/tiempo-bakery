import { NextResponse } from 'next/server';
import { timeGating } from '@/lib/time-gating';

/**
 * GET /api/time-gating
 * Retorna el estado actual del sistema de time-gating
 */
export async function GET() {
  try {
    const status = timeGating.getTimeUntilOpening();
    const currentWeekId = timeGating.getCurrentWeekId();

    if (status.isOpen) {
      return NextResponse.json({
        isOpen: true,
        currentWeekId,
        message: '¡Estamos abiertos! Realiza tu pedido ahora.',
      });
    }

    const timeRemaining = timeGating.formatTimeRemaining(status.remainingMs!);

    return NextResponse.json({
      isOpen: false,
      currentWeekId,
      nextOpening: status.nextOpening?.toISO(),
      timeRemaining,
      message: `Abrimos en ${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`,
    });
  } catch (error) {
    console.error('Time-gating API error:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado del sitio' },
      { status: 500 }
    );
  }
}
