import { NextResponse } from 'next/server'
import * as productsRepo from '@/src/repositories/products'
import { requireSession } from '@/src/lib/auth'
import { toHttpResponse, ForbiddenError } from '@/src/lib/errors'

export async function GET(request: Request) {
  try {
    const session = await requireSession(request)
    if (!session.merchantId) throw new ForbiddenError('Not a merchant account')

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Math.min(Number(url.searchParams.get('pageSize') ?? 50), 200)

    return NextResponse.json(await productsRepo.listForMerchant(session.merchantId, (page - 1) * pageSize, pageSize))
  } catch (error) {
    return toHttpResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request)
    if (!session.merchantId) throw new ForbiddenError('Not a merchant account')

    const body = await request.json()

    const product = await productsRepo.create({
      merchantId: session.merchantId,
      name: body.name,
      description: body.description ?? '',
      priceCents: body.priceCents,
      stock: body.stock ?? 0,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return toHttpResponse(error)
  }
}
