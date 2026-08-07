import { NextResponse } from 'next/server'
import * as productsRepo from '@/src/repositories/products'
import { requireSession } from '@/src/lib/auth'
import { toHttpResponse, NotFoundError } from '@/src/lib/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await productsRepo.findByIdWithMerchant(Number(id))
    if (!product) throw new NotFoundError('Product not found')

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      stock: product.stock,
      merchant: product.merchant,
    })
  } catch (error) {
    return toHttpResponse(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession(request)

    const { id } = await params
    const existing = await productsRepo.findById(Number(id))
    if (!existing) throw new NotFoundError('Product not found')

    const body = await request.json()
    const updated = await productsRepo.update(Number(id), {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      priceCents: body.priceCents ?? existing.priceCents,
      stock: body.stock ?? existing.stock,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return toHttpResponse(error)
  }
}
