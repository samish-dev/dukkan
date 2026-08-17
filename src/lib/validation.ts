import { z } from 'zod'
import { ValidationError } from './errors'

/**
 * Request bodies are strict: an unknown key is a client that disagrees with us
 * about the contract, and we would rather say so than silently drop it.
 */
export const createOrderSchema = z
  .object({
    merchantId: z.number().int().positive(),
    items: z
      .array(
        z
          .object({
            productId: z.number().int().positive(),
            quantity: z.number().int().positive().max(100),
          })
          .strict(),
      )
      .min(1),
    discountCents: z.number().int().min(0).optional(),
  })
  .strict()

export const createPaymentSchema = z
  .object({
    orderId: z.number().int().positive(),
  })
  .strict()

export const requestPayoutSchema = z
  .object({
    amountCents: z.number().int().positive(),
  })
  .strict()

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict()

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ValidationError(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '))
  }
  return result.data
}
