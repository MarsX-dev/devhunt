import CommentService from '@/libs/supabase/services/comments'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { comment_id, user_id } = await request.json()
  const commentService = new CommentService(true)
  const res = await commentService.toggleVote(comment_id as number, user_id)
  return NextResponse.json({ res })
}
