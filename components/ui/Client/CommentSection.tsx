'use client'

import { useEffect, useState } from 'react'
import CommentFormSection from './CommentFormSection'
import CommentsSection from './CommentsSection'
import type { Comment as CommentType } from '@/libs/supabase/types'
import { useSupabase } from '@/components/supabase/provider'
import axios from 'axios'

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string
    full_name: string
  }
}

export default ({ comments, slug }: { comments: CommentTypeProp[]; slug: string }) => {
  const { session } = useSupabase()
  const user = session && session.user

  const [commentsCollection, setCommentsCollection] = useState<CommentTypeProp[]>(comments)
  useEffect(() => {
    setCommentsCollection(comments)
  }, [comments])

  const handleCommentLike = (comment: CommentTypeProp) => {
    if (user) {
      axios.post('/api/comment/upvote', { comment_id: comment.id, user_id: user.id }).then(res => {
        console.log(res.data)
      })
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
