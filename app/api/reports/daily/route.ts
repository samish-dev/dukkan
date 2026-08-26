import { NextResponse } from 'next/server'
import * as reportsService from '@/src/services/reports'
import { requireSession } from '@/src/lib/auth'
import { toHttpResponse, ForbiddenError, ValidationError } from '@/src/lib/errors'

export async function GET(request: Request) {
  try {
    const session = await requireSession(request)
    if (!session.merchantId) throw new ForbiddenError('Not a merchant account')

    const day = new URL(request.url).searchParams.get('day')
    if (!day) throw new ValidationError('day is required, as YYYY-MM-DD')

    return NextResponse.json(await reportsService.dailySalesReport(session, session.merchantId, day))
  } catch (error) {
    return toHttpResponse(error)
  }
}
