import { NextResponse } from 'next/server'
import * as authService from '@/src/services/auth'
import { parseBody, registerSchema } from '@/src/lib/validation'
import { toHttpResponse } from '@/src/lib/errors'

export async function POST(request: Request) {
  try {
    const input = parseBody(registerSchema, await request.json())

    return NextResponse.json(await authService.login(input.email, input.password))
  } catch (error) {
    return toHttpResponse(error)
  }
}
