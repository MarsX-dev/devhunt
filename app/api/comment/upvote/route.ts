import CommentService from '@/libs/supabase/services/comments'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/libs/supabase/server'

export async function POST(request: Request) {
  const { comment_id, user_id } = await request.json()
  const supabase = createServerClient()
  const commentService = new CommentService(supabase)
  const res = await commentService.toggleVote(comment_id as number, user_id)
  return NextResponse.json({ res })
}
