import { NextResponse } from 'next/server'
import * as authService from '@/src/services/auth'
import { parseBody, registerSchema } from '@/src/lib/validation'
import { toHttpResponse } from '@/src/lib/errors'

export async function POST(request: Request) {
  try {
    const input = parseBody(registerSchema, await request.json())

    return NextResponse.json(await authService.register(input.email, input.password), { status: 201 })
  } catch (error) {
    return toHttpResponse(error)
  }
}
