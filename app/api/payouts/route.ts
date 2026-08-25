import { NextResponse } from 'next/server'
import * as payoutsService from '@/src/services/payouts'
import { requireSession } from '@/src/lib/auth'
import { parseBody, requestPayoutSchema } from '@/src/lib/validation'
import { toHttpResponse, ForbiddenError } from '@/src/lib/errors'

export async function POST(request: Request) {
  try {
    const session = await requireSession(request)
    if (!session.merchantId) throw new ForbiddenError('Not a merchant account')

    const input = parseBody(requestPayoutSchema, await request.json())
    const payout = await payoutsService.requestPayout(session, session.merchantId, input.amountCents)

    return NextResponse.json(payout, { status: 201 })
  } catch (error) {
    return toHttpResponse(error)
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request)
    if (!session.merchantId) throw new ForbiddenError('Not a merchant account')

    return NextResponse.json(await payoutsService.listPayouts(session, session.merchantId))
  } catch (error) {
    return toHttpResponse(error)
  }
}
