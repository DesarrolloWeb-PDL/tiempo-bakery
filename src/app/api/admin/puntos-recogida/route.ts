import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Listar todos los puntos de recogida
export async function GET() {
  try {
    const puntos = await prisma.pickupPoint.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ puntos });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener puntos de recogida' }, { status: 500 });
  }
}

// POST: Crear nuevo punto de recogida
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const punto = await prisma.pickupPoint.create({ data });
    return NextResponse.json({ punto });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear punto de recogida' }, { status: 500 });
  }
}

// PUT: Editar punto de recogida
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...rest } = data;
    const punto = await prisma.pickupPoint.update({ where: { id }, data: rest });
    return NextResponse.json({ punto });
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar punto de recogida' }, { status: 500 });
  }
}

// DELETE: Eliminar punto de recogida
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.pickupPoint.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar punto de recogida' }, { status: 500 });
  }
}
