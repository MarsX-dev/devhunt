'use client'

import { CommentForm, CommentTextarea, CommentUserAvatar, CommentFormWrapper } from '@/components/ui/Comment'
import { useSupabase } from '@/components/supabase/provider'

import Button from '@/components/ui/Button/Button'
import { FormEvent, useState } from 'react'
import LabelError from '../LabelError'
import LinkShiny from '../LinkShiny/LinkShiny'
import axios from 'axios'

export default ({ slug }: { slug: string }) => {
  const { supabase, session } = useSupabase()
  const user = session && session.user
  const [comment, setComment] = useState<string>('')
  const [fieldError, setFieldError] = useState<string>('')

  const formValidator = (value: string) => {
    if (value) return true
    else return false
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formValidator(comment)) {
      setFieldError('')
      axios.post('/api/comment', { user_id: user?.id, comment, slug }).then(res => {
        setComment('')
      })
    } else setFieldError('Please write a comment')
  }

  return (
    <CommentForm onSubmit={handleSubmit} className="mt-12">
      <CommentFormWrapper>
        {user ? <CommentUserAvatar src={user.user_metadata.avatar_url} /> : <CommentUserAvatar src="/user.svg" />}
        <CommentTextarea
          value={comment}
          onChange={e => setComment((e.target as HTMLTextAreaElement).value)}
          defaultValue={comment}
          placeholder="Write your feedback"
        />
      </CommentFormWrapper>
      <div className="mt-3 flex justify-end">
        {user ? (
          <Button className="text-sm bg-slate-800 hover:bg-slate-700">Comment</Button>
        ) : (
          <LinkShiny href="/login" className="text-sm bg-slate-800 hover:bg-slate-700">
            Login to comment
          </LinkShiny>
        )}
      </div>
      <LabelError>{fieldError}</LabelError>
    </CommentForm>
  )
}
