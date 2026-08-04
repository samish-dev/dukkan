import { NextResponse } from 'next/server'

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends DomainError {}
export class ForbiddenError extends DomainError {}
export class UnauthorizedError extends DomainError {}
export class ValidationError extends DomainError {}
export class InsufficientStockError extends DomainError {}
export class InsufficientFundsError extends DomainError {}
export class EmailTakenError extends DomainError {}
export class ProviderTimeoutError extends DomainError {}

const STATUS: Record<string, number> = {
  NotFoundError: 404,
  ForbiddenError: 403,
  UnauthorizedError: 401,
  ValidationError: 400,
  InsufficientStockError: 409,
  InsufficientFundsError: 409,
  EmailTakenError: 409,
  ProviderTimeoutError: 504,
}

/**
 * Single place where domain errors become transport concerns. Route handlers
 * call this instead of each one deciding its own status codes. See ADR-0004.
 */
export function toHttpResponse(error: unknown) {
  if (error instanceof DomainError) {
    const status = STATUS[error.name] ?? 500
    return NextResponse.json({ error: error.message }, { status })
  }
  console.error(error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
