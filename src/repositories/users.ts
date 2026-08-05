import { prisma } from '@/src/lib/prisma'

export function findActiveByEmail(email: string) {
  return prisma.user.findFirst({ where: { email, deletedAt: null } })
}

export function findById(id: number) {
  return prisma.user.findFirst({ where: { id, deletedAt: null } })
}

export function create(data: { email: string; passwordHash: string; role?: string }) {
  return prisma.user.create({ data })
}

export function softDelete(id: number) {
  return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } })
}
