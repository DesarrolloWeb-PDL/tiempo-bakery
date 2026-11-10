import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const recipeSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2).optional(),
  summary: z.string().min(5),
  content: z.string().min(5),
  ingredients: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  prepTime: z.number().int().positive().nullable().optional(),
  isTip: z.boolean().default(false),
  published: z.boolean().default(false),
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
    const recipes = await db.recipe.findMany({
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Error al obtener las recetas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = recipeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const title = parsed.data.title.trim()
    const slug = slugify(parsed.data.slug?.trim() || title)

    const existing = await db.recipe.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una receta con ese slug' }, { status: 409 })
    }

    const maxOrder = await db.recipe.aggregate({ _max: { order: true } })

    const recipe = await db.recipe.create({
      data: {
        title,
        slug,
        summary: parsed.data.summary.trim(),
        content: parsed.data.content.trim(),
        ingredients: parsed.data.ingredients?.trim() || null,
        coverImage: parsed.data.coverImage?.trim() || null,
        difficulty: parsed.data.difficulty?.trim() || null,
        prepTime: parsed.data.prepTime ?? null,
        isTip: parsed.data.isTip,
        published: parsed.data.published,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ error: 'Error al crear la receta' }, { status: 500 })
  }
}