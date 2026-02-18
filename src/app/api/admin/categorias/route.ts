import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
})

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET() {
  try {
    const categories = await db.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const name = parsed.data.name.trim()
    const slug = slugify(parsed.data.slug?.trim() || name)

    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese slug' }, { status: 409 })
    }

    const maxOrder = await db.category.aggregate({ _max: { order: true } })

    const category = await db.category.create({
      data: {
        name,
        slug,
        order: (maxOrder._max.order ?? 0) + 1,
      },
      select: { id: true, name: true, slug: true },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}
