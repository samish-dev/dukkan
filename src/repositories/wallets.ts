import { prisma } from '@/src/lib/prisma'

export function findByMerchantId(merchantId: number) {
  return prisma.wallet.findUnique({ where: { merchantId } })
}

export function decrementBalance(merchantId: number, amountCents: number) {
  return prisma.wallet.update({
    where: { merchantId },
    data: { balanceCents: { decrement: amountCents } },
  })
}
