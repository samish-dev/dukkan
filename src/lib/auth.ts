import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { UnauthorizedError } from './errors'

const BCRYPT_ROUNDS = 10

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production')

export interface Session {
  userId: number
  role: string
  merchantId?: number
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function issueToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret())
}

/** Reads and verifies the bearer token. Throws when it is missing or invalid. */
export async function requireSession(request: Request): Promise<Session> {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing bearer token')

  try {
    const { payload } = await jwtVerify(header.slice(7), secret())
    return {
      userId: payload.userId as number,
      role: payload.role as string,
      merchantId: payload.merchantId as number | undefined,
    }
  } catch {
    throw new UnauthorizedError('Invalid token')
  }
}
