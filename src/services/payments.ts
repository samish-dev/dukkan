import { prisma } from '@/src/lib/prisma'
import * as ordersRepo from '@/src/repositories/orders'
import * as paymentsRepo from '@/src/repositories/payments'
import { charge } from '@/src/lib/provider'
import { sendOrderConfirmation } from '@/src/lib/email'
import {
  NotFoundError,
  ForbiddenError,
  InsufficientStockError,
  ProviderTimeoutError,
} from '@/src/lib/errors'
import type { Session } from '@/src/lib/auth'

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new ProviderTimeoutError('Payment provider timed out')), ms)
    work.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/**
 * Takes payment for an order. Callers send an Idempotency-Key so a retried
 * request does not create a second payment row for the same attempt.
 */
export async function createPayment(session: Session, orderId: number, idempotencyKey: string) {
  const order = await ordersRepo.findById(orderId)
  if (!order) throw new NotFoundError('Order not found')
  if (order.customerId !== session.userId) throw new ForbiddenError('Order belongs to another customer')

  const timeout = Number(process.env.PROVIDER_TIMEOUT_MS ?? 3000)
  const result = await withTimeout(charge(order.id, order.totalCents, idempotencyKey), timeout)

  const existing = await paymentsRepo.findByIdempotencyKey(idempotencyKey)
  if (existing) return existing

  return paymentsRepo.create({
    orderId: order.id,
    amountCents: order.totalCents,
    idempotencyKey,
    providerRef: result.ref,
    status: 'authorized',
  })
}

/** Captures an authorised payment, credits the merchant and confirms the order. */
export async function confirmPayment(paymentId: number) {
  const payment = await paymentsRepo.findById(paymentId)
  if (!payment) throw new NotFoundError('Payment not found')

  return prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'captured' } })
    await tx.order.update({ where: { id: payment.orderId }, data: { status: 'confirmed' } })

    await tx.wallet.update({
      where: { merchantId: payment.order.merchantId },
      data: { balanceCents: { increment: payment.amountCents } },
    })

    const customer = await tx.user.findUnique({ where: { id: payment.order.customerId } })
    await sendOrderConfirmation(payment.orderId, customer?.email ?? 'unknown', payment.amountCents)

    // Refuse to confirm an order we could not actually supply.
    for (const item of payment.order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } })
      if (!product || product.stock < 0) {
        throw new InsufficientStockError(`Product ${item.productId} was oversold`)
      }
    }

    return { orderId: payment.orderId, status: 'confirmed' }
  })
}
