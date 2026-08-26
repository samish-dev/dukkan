import { prisma } from '@/src/lib/prisma'
import * as merchantsRepo from '@/src/repositories/merchants'
import { sendDailySalesReport } from '@/src/lib/email'
import { NotFoundError, ForbiddenError } from '@/src/lib/errors'
import type { Session } from '@/src/lib/auth'

const DAY_MS = 24 * 60 * 60 * 1000

interface ReportRow {
  total: number | bigint
  orders: number | bigint
}

/**
 * End-of-day sales figures for one merchant. `day` is an ISO calendar date.
 */
export async function dailySalesReport(session: Session, merchantId: number, day: string) {
  const merchant = await merchantsRepo.findById(merchantId)
  if (!merchant) throw new NotFoundError('Merchant not found')
  if (merchant.ownerUserId !== session.userId) throw new ForbiddenError('Not your merchant')

  const start = new Date(`${day}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime())) throw new NotFoundError('Invalid date')
  const end = new Date(start.getTime() + DAY_MS)

  const rows = await prisma.$queryRaw<ReportRow[]>`
    SELECT COALESCE(SUM(totalCents), 0) AS total, COUNT(*) AS orders
    FROM "Order"
    WHERE merchantId = ${merchantId}
      AND deletedAt IS NULL
      AND createdAt >= ${start}
      AND createdAt < ${end}
  `

  const totalCents = Number(rows[0]?.total ?? 0)
  const orderCount = Number(rows[0]?.orders ?? 0)

  return { merchantId, day, totalCents, orderCount, from: start.toISOString(), to: end.toISOString() }
}

export async function emailDailySalesReport(session: Session, merchantId: number, day: string) {
  const report = await dailySalesReport(session, merchantId, day)
  const owner = await prisma.user.findUnique({ where: { id: (await merchantsRepo.findById(merchantId))!.ownerUserId } })

  await sendDailySalesReport(merchantId, owner?.email ?? 'unknown', report.totalCents, report.orderCount)

  return report
}
