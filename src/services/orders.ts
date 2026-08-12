import * as ordersRepo from '@/src/repositories/orders'
import * as productsRepo from '@/src/repositories/products'
import * as merchantsRepo from '@/src/repositories/merchants'
import { priceOrder } from '@/src/lib/money'
import { NotFoundError, ValidationError, InsufficientStockError } from '@/src/lib/errors'
import type { Session } from '@/src/lib/auth'

export interface CreateOrderInput {
  merchantId: number
  items: { productId: number; quantity: number }[]
  discountCents?: number
}

export async function createOrder(session: Session, input: CreateOrderInput) {
  const merchant = await merchantsRepo.findById(input.merchantId)
  if (!merchant) throw new NotFoundError('Merchant not found')

  const products = await productsRepo.findManyByIds(input.items.map((i) => i.productId))

  const lines = input.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (!product) throw new ValidationError(`Unknown product ${item.productId}`)
    if (product.merchantId !== input.merchantId) {
      throw new ValidationError(`Product ${item.productId} does not belong to this merchant`)
    }
    if (product.stock < item.quantity) {
      throw new InsufficientStockError(`Product ${item.productId} has insufficient stock`)
    }
    return { productId: product.id, quantity: item.quantity, unitPriceCents: product.priceCents }
  })

  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0)
  const priced = priceOrder(subtotalCents, input.discountCents ?? 0)

  const order = await ordersRepo.create({
    customerId: session.userId,
    merchantId: input.merchantId,
    subtotalCents: priced.subtotalCents,
    discountCents: priced.discountCents,
    vatCents: priced.vatCents,
    totalCents: priced.totalCents,
    items: lines,
  })

  // Applied one at a time: SQLite takes a single writer, so firing these
  // concurrently just trades a clean queue for busy errors under load.
  for (const line of lines) {
    await productsRepo.decrementStock(line.productId, line.quantity)
  }

  return order
}

export async function getOrder(id: number) {
  const order = await ordersRepo.findById(id)
  if (!order) throw new NotFoundError('Order not found')

  const products = await productsRepo.findManyByIds(order.items.map((i) => i.productId))

  const subtotalCents = order.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    return sum + (product?.priceCents ?? item.unitPriceCents) * item.quantity
  }, 0)

  const priced = priceOrder(subtotalCents, order.discountCents)

  return { ...order, ...priced }
}

export async function listOrdersForMerchant(merchantId: number, page: number, pageSize: number) {
  const merchant = await merchantsRepo.findById(merchantId)
  if (!merchant) throw new NotFoundError('Merchant not found')

  const items = await ordersRepo.findManyForMerchant(merchantId, (page - 1) * pageSize, pageSize)
  const total = await ordersRepo.countForMerchant(merchantId)

  return { page, pageSize, total, items }
}
