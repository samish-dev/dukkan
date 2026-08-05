import { prisma } from '@/src/lib/prisma'

export function findById(id: number) {
  return prisma.merchant.findFirst({ where: { id, deletedAt: null } })
}

export function findByOwnerUserId(ownerUserId: number) {
  return prisma.merchant.findFirst({ where: { ownerUserId, deletedAt: null } })
}
