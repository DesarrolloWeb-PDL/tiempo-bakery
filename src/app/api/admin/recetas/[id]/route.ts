import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const recipeSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  summary: z.string().min(5),
  content: z.string().min(5),
  ingredients: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  prepTime: z.number().int().positive().nullable().optional(),
  isTip: z.boolean(),
  published: z.boolean(),
  order: z.number().int(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const parsed = recipeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const slugConflict = await db.recipe.findFirst({
      where: { slug: parsed.data.slug, NOT: { id: params.id } },
    })
    if (slugConflict) {
      return NextResponse.json({ error: 'Ya existe una receta con ese slug' }, { status: 409 })
    }

    const recipe = await db.recipe.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        ingredients: parsed.data.ingredients?.trim() || null,
        coverImage: parsed.data.coverImage?.trim() || null,
        difficulty: parsed.data.difficulty?.trim() || null,
        prepTime: parsed.data.prepTime ?? null,
      },
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error('Error updating recipe:', error)
    return NextResponse.json({ error: 'Error al actualizar la receta' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.recipe.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    return NextResponse.json({ error: 'Error al eliminar la receta' }, { status: 500 })
  }
}