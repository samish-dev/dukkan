import * as walletsRepo from '@/src/repositories/wallets'
import * as payoutsRepo from '@/src/repositories/payouts'
import * as merchantsRepo from '@/src/repositories/merchants'
import { sendPayoutNotification } from '@/src/lib/email'
import { initiateTransfer } from '@/src/lib/provider'
import { NotFoundError, ForbiddenError, InsufficientFundsError } from '@/src/lib/errors'
import type { Session } from '@/src/lib/auth'

/**
 * Early payout. Merchants draw against their wallet whenever they like rather
 * than waiting for the weekly run.
 */
export async function requestPayout(session: Session, merchantId: number, amountCents: number) {
  if (session.merchantId !== merchantId) throw new ForbiddenError('Not your merchant')

  const wallet = await walletsRepo.findByMerchantId(merchantId)
  if (!wallet) throw new NotFoundError('Wallet not found')

  if (wallet.balanceCents < amountCents) {
    throw new InsufficientFundsError('Payout exceeds available balance')
  }

  const payout = await payoutsRepo.create({ merchantId, amountCents })
  await initiateTransfer(payout.id, amountCents)
  await walletsRepo.decrementBalance(merchantId, amountCents)
  await sendPayoutNotification(merchantId, amountCents)

  return payout
}

export async function listPayouts(session: Session, merchantId: number) {
  const merchant = await merchantsRepo.findById(merchantId)
  if (!merchant) throw new NotFoundError('Merchant not found')
  if (merchant.ownerUserId !== session.userId) throw new ForbiddenError('Not your merchant')

  return payoutsRepo.findManyForMerchant(merchantId)
}
