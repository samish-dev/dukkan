import * as usersRepo from '@/src/repositories/users'
import * as merchantsRepo from '@/src/repositories/merchants'
import { hashPassword, verifyPassword, issueToken } from '@/src/lib/auth'
import { EmailTakenError, UnauthorizedError } from '@/src/lib/errors'

export async function register(email: string, password: string) {
  const existing = await usersRepo.findActiveByEmail(email)
  if (existing) throw new EmailTakenError('Email already registered')

  const user = await usersRepo.create({ email, passwordHash: await hashPassword(password) })

  return { id: user.id, email: user.email, role: user.role }
}

export async function login(email: string, password: string) {
  const user = await usersRepo.findActiveByEmail(email)
  if (!user) throw new UnauthorizedError('Invalid credentials')

  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid credentials')
  }

  const merchant = await merchantsRepo.findByOwnerUserId(user.id)
  const token = await issueToken({ userId: user.id, role: user.role, merchantId: merchant?.id })

  return { token, user: { id: user.id, email: user.email, role: user.role } }
}
