'use client'

import { useEffect, useState } from 'react'
import CommentFormSection from './CommentFormSection'
import CommentsSection from './CommentsSection'
import type { Comment as CommentType } from '@/libs/supabase/types'
import { useSupabase } from '@/components/supabase/provider'
import CommentService from '@/libs/supabase/services/comments'
import { createBrowserClient } from '@/libs/supabase/browser'

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string
    full_name: string
  }
}

export default ({ comments, slug }: { comments: CommentTypeProp[]; slug: string }) => {
  const { session } = useSupabase()
  const user = session && session.user
  const supabase = createBrowserClient()
  const commentService = new CommentService(supabase)

  const [commentsCollection, setCommentsCollection] = useState<CommentTypeProp[]>(comments)
  useEffect(() => {
    setCommentsCollection(comments)
  }, [comments])

  const handleCommentLike = async (comment: CommentTypeProp) => {
    if (user) {
      const res = await commentService.toggleVote(comment.id as number, user.id)
    }
  }

  return (
    <div className="container-custom-screen" id="comments">
      <h3 className="text-slate-50 font-medium">Support and give a Feedback</h3>
      <CommentFormSection comments={commentsCollection} setCommentsCollection={setCommentsCollection} slug={slug} />
      {/*TODO move comments in a separate component to make them laze loaded */}
      <div className="mt-6">
        <CommentsSection handleCommentLike={handleCommentLike} comments={commentsCollection as any} />
      </div>
    </div>
  )
}
