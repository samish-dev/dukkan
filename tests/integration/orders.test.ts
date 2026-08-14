import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// Every request in these paths arrives with a signed token, so the session is
// stubbed and the assertions stay on the order behaviour itself.
vi.mock('@/src/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/src/lib/auth')>('@/src/lib/auth')
  return { ...actual, requireSession: vi.fn(async () => ({ userId: fixture.customerId, role: 'customer', merchantId: fixture.merchantId })) }
})

import { prisma } from '@/src/lib/prisma'
import { GET as getOrder } from '@/app/api/orders/[id]/route'
import { POST as createOrder } from '@/app/api/orders/route'

const fixture = { customerId: 0, ownerId: 0, merchantId: 0, productId: 0, orderId: 0 }

beforeAll(async () => {
  const owner = await prisma.user.create({
    data: { email: `it-owner-${Date.now()}@example.com`, passwordHash: 'x', role: 'merchant_admin' },
  })
  const customer = await prisma.user.create({
    data: { email: `it-customer-${Date.now()}@example.com`, passwordHash: 'x', role: 'customer' },
  })
  const merchant = await prisma.merchant.create({ data: { name: 'Test Shop', ownerUserId: owner.id } })
  const product = await prisma.product.create({
    data: { merchantId: merchant.id, name: 'Test Widget', priceCents: 47350, stock: 50 },
  })

  fixture.customerId = customer.id
  fixture.ownerId = owner.id
  fixture.merchantId = merchant.id
  fixture.productId = product.id
})

afterAll(async () => {
  await prisma.orderItem.deleteMany({ where: { order: { merchantId: fixture.merchantId } } })
  await prisma.order.deleteMany({ where: { merchantId: fixture.merchantId } })
  await prisma.product.deleteMany({ where: { merchantId: fixture.merchantId } })
  await prisma.merchant.deleteMany({ where: { id: fixture.merchantId } })
  await prisma.user.deleteMany({ where: { id: { in: [fixture.customerId, fixture.ownerId] } } })
  await prisma.$disconnect()
})

function post(body: unknown) {
  return new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test' },
    body: JSON.stringify(body),
  })
}

describe('orders API', () => {
  it('creates an order and prices it', async () => {
    const response = await createOrder(post({ merchantId: fixture.merchantId, items: [{ productId: fixture.productId, quantity: 1 }] }))
    expect(response.status).toBe(201)

    const order = await response.json()
    fixture.orderId = order.id
    expect(order.subtotalCents).toBe(47350)
    expect(order.vatCents).toBe(5209)
    expect(order.items).toHaveLength(1)
  })

  it('rejects a body with unknown keys', async () => {
    const response = await createOrder(post({ merchantId: fixture.merchantId, items: [{ productId: fixture.productId, quantity: 1 }], notAField: true }))
    expect(response.status).toBe(400)
  })

  it('rejects an order for a product the merchant does not own', async () => {
    const response = await createOrder(post({ merchantId: fixture.merchantId, items: [{ productId: 1, quantity: 1 }] }))
    expect(response.status).toBe(400)
  })

  it('returns a single order to the caller', async () => {
    const request = new Request(`http://localhost/api/orders/${fixture.orderId}`, {
      headers: { authorization: 'Bearer test' },
    })
    const response = await getOrder(request, { params: Promise.resolve({ id: String(fixture.orderId) }) })

    expect(response.status).toBe(200)
    expect((await response.json()).id).toBe(fixture.orderId)
  })

  it('404s for an order that does not exist', async () => {
    const request = new Request('http://localhost/api/orders/99999999', { headers: { authorization: 'Bearer test' } })
    const response = await getOrder(request, { params: Promise.resolve({ id: '99999999' }) })

    expect(response.status).toBe(404)
  })
})
