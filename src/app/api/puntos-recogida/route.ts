import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/puntos-recogida
 * Lista todos los puntos de recogida activos
 */
export async function GET() {
  try {
    const puntos = await prisma.pickupPoint.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({
      puntos,
      total: puntos.length,
    });
  } catch (error) {
    console.error('Error fetching pickup points:', error);
    return NextResponse.json(
      { error: 'Error al obtener los puntos de recogida' },
      { status: 500 }
    );
  }
}
