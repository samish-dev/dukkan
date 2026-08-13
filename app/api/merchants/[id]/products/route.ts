import { NextResponse } from 'next/server'
import * as productsRepo from '@/src/repositories/products'
import * as merchantsRepo from '@/src/repositories/merchants'
import { requireSession } from '@/src/lib/auth'
import { toHttpResponse } from '@/src/lib/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    const merchantId = Number((await params).id)

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Math.min(Number(url.searchParams.get('pageSize') ?? 50), 200)

    const merchant = await merchantsRepo.findById(merchantId)
    const products =
      session.merchantId === merchantId
        ? await productsRepo.listForMerchant(merchantId, (page - 1) * pageSize, pageSize)
        : []

    const items = []
    for (const product of products) {
      const owner = await merchantsRepo.findById(product.merchantId)
      items.push({
        id: product.id,
        name: product.name,
        priceCents: product.priceCents,
        stock: product.stock,
        merchantName: owner!.name,
      })
    }

    return NextResponse.json({ merchant: merchant!.name, items })
  } catch (error) {
    return toHttpResponse(error)
  }
}
