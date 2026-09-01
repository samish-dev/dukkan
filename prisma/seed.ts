import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/** Deterministic PRNG so every run produces the same database. */
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260926)
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))

const CHUNK = 5000
async function insertMany<T>(rows: T[], insert: (batch: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await insert(rows.slice(i, i + CHUNK))
  }
}

// Beirut runs three hours ahead of UTC through the season this data covers.
const BEIRUT_OFFSET_HOURS = 3
const DAYS = 90
// The generated history stops here. It stays behind the present so the newest
// row in the database is always older than anything created while working.
const END = Date.UTC(2026, 8, 15, 0, 0, 0)

/** Orders land on quarter hours, and the shop trades well past midnight. */
const HOUR_WEIGHTS: [number, number][] = [
  [0, 5], [1, 4], [2, 3], [9, 3], [10, 5], [11, 6], [12, 8], [13, 8],
  [14, 6], [15, 5], [16, 6], [17, 8], [18, 10], [19, 11], [20, 10], [21, 8], [22, 6], [23, 5],
]
const HOUR_POOL: number[] = HOUR_WEIGHTS.flatMap(([hour, weight]) => Array(weight).fill(hour))

function orderCreatedAt(): Date {
  const dayOffset = between(0, DAYS - 1)
  const beirutHour = pick(HOUR_POOL)
  const quarter = pick([0, 15, 30, 45])

  // Chosen in Beirut local time, then stored as the UTC instant it maps to.
  const beirutMidnight = END - dayOffset * 24 * 3600 * 1000
  return new Date(beirutMidnight + (beirutHour - BEIRUT_OFFSET_HOURS) * 3600 * 1000 + quarter * 60 * 1000)
}

const MERCHANT_NAMES = [
  'Beirut Electronics', 'Hamra Grocers', 'Mar Mikhael Bakery', 'Gemmayze Coffee Roasters',
  'Achrafieh Pharmacy', 'Verdun Textiles', 'Badaro Books', 'Zokak el-Blat Hardware Supply',
  'Ras Beirut Fishmonger', 'Sodeco Flowers', 'Clemenceau Stationery', 'Manara Sportswear',
  'Koraytem Cheese House', 'Sanayeh Toys', 'Tallet el-Khayat Butcher', 'Raouche Souvenirs',
  'Furn el-Chebbak Tools', 'Sin el-Fil Auto Parts', 'Dekwaneh Packaging', 'Jdeideh Lighting',
  'Antelias Olive Press', 'Jounieh Swimwear', 'Zalka Mobile Accessories', 'Dbayeh Home Goods',
  'Bourj Hammoud Jewellers', 'Karantina Cold Storage', 'Mazraa Spices', 'Tariq el-Jdideh Fabrics',
  'Ain el-Remmaneh Bicycles', 'Hazmieh Garden Centre',
]

const PRODUCT_WORDS = ['Cable', 'Adapter', 'Charger', 'Mount', 'Case', 'Filter', 'Blend', 'Kit', 'Pack', 'Set']
const DESCRIPTION =
  'Genuine replacement part compatible with a wide range of devices. Includes a one year limited warranty and full technical documentation. Shipped from our Beirut warehouse within one business day. Quality control sign off and anti static packaging for safe transit.'

async function main() {
  console.log('resetting tables')
  await prisma.orderItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.order.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.product.deleteMany()
  await prisma.merchant.deleteMany()
  await prisma.user.deleteMany()

  // Identity counters survive a plain delete, so clear them too: ids must be
  // the same on every run for the documented accounts to stay correct.
  try {
    await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence')
  } catch {
    // No sequence table yet on a fresh database.
  }

  // One hash reused for every account: hashing two thousand of them would add
  // minutes to this script and prove nothing.
  const passwordHash = await bcrypt.hash('password123', 10)

  console.log('creating users')
  const owners = MERCHANT_NAMES.map((name, i) => ({
    email: `owner${i + 1}@${name.toLowerCase().replace(/[^a-z]+/g, '-')}.example`,
    passwordHash,
    role: 'merchant_admin',
    deletedAt: null as Date | null,
  }))

  const customers = Array.from({ length: 1970 }, (_, i) => ({
    email: `customer${i + 1}@example.com`,
    passwordHash,
    role: 'customer',
    deletedAt: i % 70 === 0 && i > 0 ? new Date(END - between(1, 60) * 24 * 3600 * 1000) : null,
  }))

  // Closed their account last month and will come back for it.
  customers.push({ email: 'rania.khoury@example.com', passwordHash, role: 'customer', deletedAt: new Date(END - 30 * 24 * 3600 * 1000) })

  await insertMany([...owners, ...customers], (batch) => prisma.user.createMany({ data: batch }))

  const ownerRows = await prisma.user.findMany({ where: { role: 'merchant_admin' }, orderBy: { id: 'asc' } })
  const customerRows = await prisma.user.findMany({ where: { role: 'customer', deletedAt: null }, orderBy: { id: 'asc' }, select: { id: true } })

  console.log('creating merchants')
  await prisma.merchant.createMany({
    data: MERCHANT_NAMES.map((name, i) => ({ name, ownerUserId: ownerRows[i].id })),
  })
  const merchants = await prisma.merchant.findMany({ orderBy: { id: 'asc' } })

  console.log('creating products')
  const products: { merchantId: number; name: string; description: string; priceCents: number; stock: number; deletedAt: Date | null }[] = []

  for (const merchant of merchants) {
    const count = merchant.name === 'Beirut Electronics' ? 40000 : between(20, 300)
    for (let i = 1; i <= count; i += 1) {
      products.push({
        merchantId: merchant.id,
        name: `${pick(PRODUCT_WORDS)} ${pick(PRODUCT_WORDS)} Model ${i} Rev ${i % 7}`,
        description: DESCRIPTION,
        priceCents: between(150, 89000),
        stock: between(0, 60),
        deletedAt: i % 400 === 0 ? new Date(END - between(1, 90) * 24 * 3600 * 1000) : null,
      })
    }
  }
  await insertMany(products, (batch) => prisma.product.createMany({ data: batch }))

  console.log('creating wallets')
  await prisma.wallet.createMany({
    data: merchants.map((m) => ({
      merchantId: m.id,
      balanceCents: m.name === 'Beirut Electronics' ? 10000 : between(5000, 500000),
    })),
  })

  console.log('creating orders')
  const bigMerchant = merchants.find((m) => m.name === 'Beirut Electronics')!
  const otherMerchants = merchants.filter((m) => m.id !== bigMerchant.id)

  const orders: { customerId: number; merchantId: number; status: string; subtotalCents: number; discountCents: number; vatCents: number; totalCents: number; createdAt: Date; deletedAt: Date | null }[] = []

  for (let i = 0; i < 20000; i += 1) {
    const merchantId = rand() < 0.6 ? bigMerchant.id : pick(otherMerchants).id
    const subtotalCents = between(500, 120000)
    const vatCents = Math.round(subtotalCents * 0.11)

    orders.push({
      customerId: pick(customerRows).id,
      merchantId,
      status: pick(['confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled']),
      subtotalCents,
      discountCents: 0,
      vatCents,
      totalCents: subtotalCents + vatCents,
      createdAt: orderCreatedAt(),
      deletedAt: i % 250 === 0 && i > 0 ? new Date(END) : null,
    })
  }
  await insertMany(orders, (batch) => prisma.order.createMany({ data: batch }))

  console.log('creating order items')
  const orderRows = await prisma.order.findMany({ select: { id: true, merchantId: true, subtotalCents: true }, orderBy: { id: 'asc' } })
  const productsByMerchant = new Map<number, { id: number; priceCents: number }[]>()
  for (const m of merchants) {
    productsByMerchant.set(
      m.id,
      await prisma.product.findMany({ where: { merchantId: m.id }, select: { id: true, priceCents: true }, take: 400 }),
    )
  }

  const items: { orderId: number; productId: number; quantity: number; unitPriceCents: number }[] = []
  for (const order of orderRows) {
    const pool = productsByMerchant.get(order.merchantId)!
    const lineCount = between(1, 3)
    for (let i = 0; i < lineCount; i += 1) {
      const product = pick(pool)
      items.push({ orderId: order.id, productId: product.id, quantity: between(1, 4), unitPriceCents: product.priceCents })
    }
  }
  await insertMany(items, (batch) => prisma.orderItem.createMany({ data: batch }))

  console.log(
    `done: ${await prisma.user.count()} users, ${await prisma.merchant.count()} merchants, ` +
      `${await prisma.product.count()} products, ${await prisma.order.count()} orders, ${await prisma.orderItem.count()} items`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
