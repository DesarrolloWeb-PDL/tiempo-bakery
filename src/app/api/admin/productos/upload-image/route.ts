import { NextRequest, NextResponse } from 'next/server'
import { POST as uploadAssetPost, dynamic } from '../../uploads/route'

export { dynamic }
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const clonedRequest = req.clone()
  const response = await uploadAssetPost(req)

  if (!response.ok) {
    return response
  }

  const data = await response.json()
  const formData = await clonedRequest.formData()
  const productId = formData.get('productId')

  return NextResponse.json({
    ...data,
    imageUrl: typeof data?.url === 'string' ? data.url : data?.imageUrl,
    ...(typeof productId === 'string' && productId.trim() ? { productId } : {}),
  })
}