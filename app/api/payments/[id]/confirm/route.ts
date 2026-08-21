import { NextResponse } from 'next/server'
import * as paymentsService from '@/src/services/payments'
import { requireSession } from '@/src/lib/auth'
import { toHttpResponse } from '@/src/lib/errors'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession(request)
    const { id } = await params

    return NextResponse.json(await paymentsService.confirmPayment(Number(id)))
  } catch (error) {
    return toHttpResponse(error)
  }
}
