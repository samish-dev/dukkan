export const VAT_RATE = 0.11
export const DISCOUNT_CAP_RATE = 0.3

export interface PricedOrder {
  subtotalCents: number
  vatCents: number
  discountCents: number
  totalCents: number
}

/**
 * Prices an order from its line subtotal. Merchants may attach a promotional
 * discount, which is capped so a promotion can never wipe out a whole order.
 */
export function priceOrder(subtotalCents: number, requestedDiscountCents = 0): PricedOrder {
  const vatCents = Math.round(subtotalCents * VAT_RATE)
  const cap = Math.round((subtotalCents + vatCents) * DISCOUNT_CAP_RATE)
  const discountCents = Math.min(Math.max(requestedDiscountCents, 0), cap)

  return {
    subtotalCents,
    vatCents,
    discountCents,
    totalCents: subtotalCents + vatCents - discountCents,
  }
}
