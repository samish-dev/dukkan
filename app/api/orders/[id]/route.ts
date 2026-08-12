import { NextResponse } from 'next/server'
import * as ordersService from '@/src/services/orders'
import { toHttpResponse } from '@/src/lib/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    return NextResponse.json(await ordersService.getOrder(Number(id)))
  } catch (error) {
    return toHttpResponse(error)
  }
}
