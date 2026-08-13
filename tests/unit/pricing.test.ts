import { describe, it, expect } from 'vitest'
import { priceOrder, VAT_RATE, DISCOUNT_CAP_RATE } from '@/src/lib/money'

describe('priceOrder', () => {
  it('adds VAT to the subtotal', () => {
    const priced = priceOrder(10000)
    expect(priced.vatCents).toBe(1100)
    expect(priced.totalCents).toBe(11100)
  })

  it('leaves the total alone when no discount is requested', () => {
    const priced = priceOrder(47350)
    expect(priced.discountCents).toBe(0)
    expect(priced.totalCents).toBe(47350 + 5209)
  })

  it('caps a promotional discount that is too large', () => {
    const priced = priceOrder(47350, 20000)

    expect(priced.subtotalCents).toBe(47350)
    expect(priced.vatCents).toBe(5209)
    expect(priced.discountCents).toBe(15768)
    expect(priced.totalCents).toBe(36791)
  })

  it('grants a discount that sits under the cap in full', () => {
    const priced = priceOrder(47350, 9000)
    expect(priced.discountCents).toBe(9000)
    expect(priced.totalCents).toBe(47350 + 5209 - 9000)
  })

  it('never returns a negative discount', () => {
    expect(priceOrder(10000, -500).discountCents).toBe(0)
  })

  it('uses the documented rates', () => {
    expect(VAT_RATE).toBe(0.11)
    expect(DISCOUNT_CAP_RATE).toBe(0.3)
  })
})
