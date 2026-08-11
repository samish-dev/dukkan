import { prisma } from '@/src/lib/prisma'

export function findById(id: number) {
  return prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: { items: true },
  })
}

export function findManyForCustomer(customerId: number) {
  return prisma.order.findMany({
    where: { customerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

/** Merchant-facing order list, newest first. */
export function findManyForMerchant(merchantId: number, offset: number, limit: number) {
  return prisma.order.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    include: { items: true },
  })
}

export function countForMerchant(merchantId: number) {
  return prisma.order.count({ where: { merchantId, deletedAt: null } })
}

export function create(data: {
  customerId: number
  merchantId: number
  subtotalCents: number
  discountCents: number
  vatCents: number
  totalCents: number
  items: { productId: number; quantity: number; unitPriceCents: number }[]
}) {
  const { items, ...order } = data
  return prisma.order.create({
    data: { ...order, items: { create: items } },
    include: { items: true },
  })
}

export function setStatus(id: number, status: string) {
  return prisma.order.update({ where: { id }, data: { status } })
}
