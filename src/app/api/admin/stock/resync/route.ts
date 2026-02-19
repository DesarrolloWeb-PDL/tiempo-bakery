import { NextRequest, NextResponse } from 'next/server'
import { stockManager } from '@/lib/stock-manager'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  weekId: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await stockManager.resyncWeeklyStock(parsed.data.weekId)

    return NextResponse.json({
      success: true,
      weekId: result.weekId,
      updated: result.updated,
      created: result.created,
      total: result.updated + result.created,
    })
  } catch (error) {
    console.error('Error resyncing weekly stock:', error)
    return NextResponse.json({ error: 'Error al re-sincronizar stock' }, { status: 500 })
  }
}
