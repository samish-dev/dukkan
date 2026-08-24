import { prisma } from '@/src/lib/prisma'

export function create(data: { merchantId: number; amountCents: number }) {
  return prisma.payout.create({ data })
}

export function findManyForMerchant(merchantId: number) {
  return prisma.payout.findMany({ where: { merchantId }, orderBy: { createdAt: 'desc' } })
}
