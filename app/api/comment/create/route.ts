import CommentService from '@/libs/supabase/services/comments'
import { NextResponse } from 'next/server'
import ProductsService from '@/libs/supabase/services/products'

export async function POST(request: Request) {
  const { user_id, comment, slug } = await request.json()
  const productsService = new ProductsService(true)
  const product = await productsService.getBySlug(slug)
  const commentService = new CommentService(true)
  const res = await commentService.insert({
    content: comment,
    user_id,
    product_id: product?.id as number,
  })
  const commentRes = await commentService.getById(res?.id as number)
  return NextResponse.json({ res: commentRes })
}
