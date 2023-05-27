'use client'

import {
  CommentUserAvatar,
  Comments,
  Comment,
  CommentUserName,
  CommentDate,
  CommentContext,
  CommentLike,
} from '@/components/ui/Comment'

import type { Comment as CommentType } from '@/libs/supabase/types'
import moment from 'moment'

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string
    full_name: string
  }
}

export default ({
  comments,
  handleCommentLike,
}: {
  comments: CommentTypeProp[]
  handleCommentLike: (val: CommentTypeProp) => void
}) => {
  return (
    <Comments>
      {comments.map((comment: CommentTypeProp, idx) => (
        <Comment key={idx}>
          {/*TODO add First Letters Like avatars if there is no avatar */}
          <CommentUserAvatar src={comment.profiles.avatar_url} />
          <div>
            <CommentUserName>{comment.profiles.full_name}</CommentUserName>
            <CommentDate>Commented {moment(comment.created_at).format('LL')}</CommentDate>
            <CommentContext className="mt-3">{comment.content}</CommentContext>
            <CommentLike onClick={() => handleCommentLike(comment)} className="mt-2" count={comment.votes_count} />
          </div>
        </Comment>
      ))}
    </Comments>
  )
}
