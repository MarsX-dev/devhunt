'use client'

import type { Comment as CommentType } from '@/libs/supabase/types'
import { useSupabase } from '@/components/supabase/provider'
import CommentSingle from './CommentSingle'
import { Comments } from '../Comment'

interface CommentTypeProp extends CommentType {
  profiles: {
    avatar_url: string
    full_name: string
  }
}

export default ({ comments }: { comments: CommentTypeProp[] }) => {
  const { session } = useSupabase()
  const user = session && session.user

  return (
    <Comments>
      {comments.map((comment: CommentTypeProp, idx) => (
        <CommentSingle key={idx} user={user as any} comment={comment} />
      ))}
    </Comments>
  )
}
