import CommentService from '@/libs/supabase/services/comments'
import { NextResponse } from 'next/server'
import ProductsService from '@/libs/supabase/services/products'
import { createServerClient } from '@/libs/supabase/server'

export async function POST(request: Request) {
  const { user_id, comment, slug } = await request.json()
  const supabase = createServerClient()
  const productsService = new ProductsService(supabase)
  const product = await productsService.getBySlug(slug)
  const commentService = new CommentService(supabase)
  const res = await commentService.insert({
    content: comment,
    user_id,
    product_id: product?.id as number,
  })
  const commentRes = await commentService.getById(res?.id as number)
  return NextResponse.json({ res: commentRes })
}
