import { appendFileSync } from 'node:fs'

const LOG_PATH = process.env.PROVIDER_LOG_PATH ?? 'provider.log'

let sequence = 0

function log(line: string) {
  appendFileSync(LOG_PATH, `${new Date().toISOString()} ${line}\n`)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface ChargeResult {
  ref: string
}

/**
 * Card processor. Runs in-process for now; the real one is an HTTP call to the
 * acquirer and is slower, so latency is configurable to match what we see there.
 */
export async function charge(orderId: number, amountCents: number, key: string): Promise<ChargeResult> {
  const latency = Number(process.env.PROVIDER_LATENCY_MS ?? 120)

  log(`provider.charge started order=${orderId} amount=${amountCents} key=${key}`)
  await sleep(latency)

  const ref = `ch_${Date.now().toString(36)}_${(sequence += 1)}`
  log(`charge.created order=${orderId} amount=${amountCents} key=${key} ref=${ref}`)

  return { ref }
}

export interface TransferResult {
  ref: string
}

/** Instructs the bank to send a merchant payout to their registered account. */
export async function initiateTransfer(payoutId: number, amountCents: number): Promise<TransferResult> {
  const latency = Number(process.env.PROVIDER_LATENCY_MS ?? 120)

  log(`provider.transfer started payout=${payoutId} amount=${amountCents}`)
  await sleep(latency)

  const ref = `tr_${Date.now().toString(36)}_${(sequence += 1)}`
  log(`transfer.created payout=${payoutId} amount=${amountCents} ref=${ref}`)

  return { ref }
}
