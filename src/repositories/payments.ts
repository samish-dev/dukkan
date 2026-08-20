import { prisma } from '@/src/lib/prisma'

export function findByIdempotencyKey(idempotencyKey: string) {
  return prisma.payment.findUnique({ where: { idempotencyKey } })
}

export function findById(id: number) {
  return prisma.payment.findUnique({ where: { id }, include: { order: { include: { items: true } } } })
}

export function create(data: {
  orderId: number
  amountCents: number
  idempotencyKey: string
  providerRef: string
  status: string
}) {
  return prisma.payment.create({ data })
}
