import { prisma } from '@/src/lib/prisma'

export function findById(id: number) {
  return prisma.product.findFirst({ where: { id, deletedAt: null } })
}

export function findManyByIds(ids: number[]) {
  return prisma.product.findMany({ where: { id: { in: ids }, deletedAt: null } })
}

export function listForMerchant(merchantId: number, offset = 0, limit = 50) {
  return prisma.product.findMany({
    where: { merchantId, deletedAt: null },
    orderBy: { id: 'asc' },
    skip: offset,
    take: limit,
  })
}

/**
 * Catalog search for the merchant storefront. Catalogs are small (ADR-0003), so
 * we pull the merchant's products and narrow them in the application rather than
 * maintaining a search index for a few hundred rows.
 */
export async function searchForMerchant(merchantId: number, query: string, offset: number, limit: number) {
  const all = await prisma.product.findMany({
    where: { merchantId, deletedAt: null },
    orderBy: { id: 'asc' },
  })

  const needle = query.trim().toLowerCase()
  const matches = needle ? all.filter((p) => p.name.toLowerCase().includes(needle)) : all

  return { total: matches.length, items: matches.slice(offset, offset + limit) }
}

export function decrementStock(id: number, quantity: number) {
  return prisma.product.update({ where: { id }, data: { stock: { decrement: quantity } } })
}

export function create(data: { merchantId: number; name: string; description?: string; priceCents: number; stock: number }) {
  return prisma.product.create({ data })
}

export function update(id: number, data: { name?: string; description?: string; priceCents?: number; stock?: number }) {
  return prisma.product.update({ where: { id }, data })
}

export function findByIdWithMerchant(id: number) {
  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: { merchant: { include: { owner: true } } },
  })
}
