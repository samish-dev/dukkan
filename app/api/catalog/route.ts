import { NextResponse } from 'next/server'
import * as productsRepo from '@/src/repositories/products'
import { toHttpResponse, ValidationError } from '@/src/lib/errors'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)

    const merchantId = Number(url.searchParams.get('merchantId'))
    if (!merchantId) throw new ValidationError('merchantId is required')

    const q = url.searchParams.get('q') ?? ''
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Math.min(Number(url.searchParams.get('pageSize') ?? 20), 100)

    const result = await productsRepo.searchForMerchant(merchantId, q, (page - 1) * pageSize, pageSize)

    return NextResponse.json({ merchantId, q, page, pageSize, ...result })
  } catch (error) {
    return toHttpResponse(error)
  }
}
