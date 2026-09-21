import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiDbError } from '@/lib/api-response'
import {
  buildReport,
  getDeliveryReportData,
  getActiveDeliveryPersons,
  getActiveDeliveryZones,
  type ReportFilters,
} from '@/lib/delivery-reports'

export const dynamic = 'force-dynamic'

const reportsQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  personId: z.string().optional(),
  zoneId: z.string().optional(),
  status: z.string().optional(),
})

type ParsedQuery =
  | { ok: false; response: NextResponse }
  | { ok: true; filters: ReportFilters }

function parseQuery(searchParams: URLSearchParams): ParsedQuery {
  const raw = {
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    personId: searchParams.get('personId') ?? undefined,
    zoneId: searchParams.get('zoneId') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  }

  const parsed = reportsQuerySchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Parámetros inválidos', details: parsed.error.flatten() },
        { status: 400 }
      ),
    }
  }

  return {
    ok: true,
    filters: {
      dateFrom: parsed.data.dateFrom ? new Date(parsed.data.dateFrom) : undefined,
      dateTo: parsed.data.dateTo ? new Date(parsed.data.dateTo) : undefined,
      personId: parsed.data.personId,
      zoneId: parsed.data.zoneId,
      status: parsed.data.status,
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    const parsed = parseQuery(req.nextUrl.searchParams)
    if (!parsed.ok) {
      return parsed.response
    }

    const [orders, persons, zones] = await Promise.all([
      getDeliveryReportData(parsed.filters),
      getActiveDeliveryPersons(),
      getActiveDeliveryZones(),
    ])

    return NextResponse.json({
      ...buildReport(orders),
      persons,
      zones,
    })
  } catch (error) {
    console.error('Error fetching delivery reports:', error)
    return apiDbError(error, 'Error al obtener reportes de entrega')
  }
}
