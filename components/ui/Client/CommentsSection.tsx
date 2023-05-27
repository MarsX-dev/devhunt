'use client'

import { IconEllipsisVertical } from '@/components/Icons'
import {
  CommentUserAvatar,
  Comments,
  Comment,
  CommentUserName,
  CommentDate,
  CommentContext,
  CommentLike,
  CommentActionMenu,
} from '@/components/ui/Comment'

import type { Comment as CommentType } from '@/libs/supabase/types'
import { useSupabase } from '@/components/supabase/provider'
import moment from 'moment'
import Button from '../Button/Button'

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
  const { session } = useSupabase()
  const user = session && session.user

  return (
    <Comments>
      {comments.map((comment: CommentTypeProp, idx) => (
        <Comment key={idx} className="items-start gap-x-2">
          {/*TODO add First Letters Like avatars if there is no avatar */}
          <CommentUserAvatar src={comment.profiles.avatar_url} />
          <div className="flex-1">
            <CommentUserName>{comment.profiles.full_name}</CommentUserName>
            <CommentDate>Commented {moment(comment.created_at).format('LL')}</CommentDate>
            <CommentContext className="mt-3">{comment.content}</CommentContext>
            <CommentLike onClick={() => handleCommentLike(comment)} className="mt-2" count={comment.votes_count} />
          </div>
          {user ? (
            <CommentActionMenu>
              <li>
                <Button className="block w-full py-1 px-3 font-normal text-xs text-slate-300 text-left rounded-none border-t border-slate-700 bg-transparent hover:bg-slate-700">
                  Edit
                </Button>
              </li>
              <li>
                <Button className="block w-full py-1 px-3 font-normal text-xs text-red-500 text-left rounded-none border-t border-slate-700 bg-transparent hover:text-red-50 hover:bg-red-500">
                  Delete
                </Button>
              </li>
            </CommentActionMenu>
          ) : (
            ''
          )}
        </Comment>
      ))}
    </Comments>
  )
}
