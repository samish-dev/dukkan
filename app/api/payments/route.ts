import { NextResponse } from 'next/server'
import * as paymentsService from '@/src/services/payments'
import { requireSession } from '@/src/lib/auth'
import { parseBody, createPaymentSchema } from '@/src/lib/validation'
import { toHttpResponse, ValidationError } from '@/src/lib/errors'

export async function POST(request: Request) {
  try {
    const session = await requireSession(request)

    const idempotencyKey = request.headers.get('idempotency-key')
    if (!idempotencyKey) throw new ValidationError('Idempotency-Key header is required')

    const input = parseBody(createPaymentSchema, await request.json())
    const payment = await paymentsService.createPayment(session, input.orderId, idempotencyKey)

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return toHttpResponse(error)
  }
}
