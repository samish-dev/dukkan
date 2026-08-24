import { appendFileSync } from 'node:fs'

const LOG_PATH = process.env.EMAIL_LOG_PATH ?? 'emails.log'

function write(line: string) {
  appendFileSync(LOG_PATH, `${new Date().toISOString()} ${line}\n`)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function deliver(line: string) {
  await sleep(Number(process.env.EMAIL_LATENCY_MS ?? 15))
  write(line)
}

export async function sendOrderConfirmation(orderId: number, to: string, totalCents: number) {
  await deliver(`EMAIL order_confirmation order=${orderId} to=${to} total=${totalCents}`)
}

export async function sendPayoutNotification(merchantId: number, amountCents: number) {
  await deliver(`EMAIL payout_requested merchant=${merchantId} amount=${amountCents}`)
}

export async function sendDailySalesReport(merchantId: number, to: string, totalCents: number, orderCount: number) {
  await deliver(`EMAIL daily_report merchant=${merchantId} to=${to} total=${totalCents} orders=${orderCount}`)
}
