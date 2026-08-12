import { NextResponse } from 'next/server'
import * as ordersService from '@/src/services/orders'
import { requireSession } from '@/src/lib/auth'
import { parseBody, createOrderSchema } from '@/src/lib/validation'
import { toHttpResponse, ForbiddenError } from '@/src/lib/errors'

export async function POST(request: Request) {
  try {
    const session = await requireSession(request)
    const input = parseBody(createOrderSchema, await request.json())

    return NextResponse.json(await ordersService.createOrder(session, input), { status: 201 })
  } catch (error) {
    return toHttpResponse(error)
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request)
    if (!session.merchantId) throw new ForbiddenError('Not a merchant account')

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20)

    return NextResponse.json(await ordersService.listOrdersForMerchant(session.merchantId, page, pageSize))
  } catch (error) {
    return toHttpResponse(error)
  }
}
