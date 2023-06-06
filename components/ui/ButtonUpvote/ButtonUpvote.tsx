'use client'
import { IconVote } from '@/components/Icons'
import Button from '@/components/ui/Button'
import React, { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase/provider'
import ProductsService from '@/utils/supabase/services/products'
import { createBrowserClient } from '@/utils/supabase/browser'
import { useRouter } from 'next/navigation'

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  count: number
  className?: string
  productId?: number
}

export default ({ count, productId, className = '', ...props }: Props) => {
  // call to trigger a vote
  // client only -- move to client component for Voting
  const { session } = useSupabase()
  const productsService = new ProductsService(createBrowserClient())
  const router = useRouter()
  const [votesCount, setVotesCount] = useState(count)
  const [isUpvoted, setUpvoted] = useState(false)

  const toggleVote = async () => {
    if (session && session.user) {
      const newVotesCount = await productsService.toggleVote(productId as number, session.user.id)
      setUpvoted(!isUpvoted)
      setVotesCount(newVotesCount)
    } else router.push('/login')
  }

  useEffect(() => {
    session && session.user
      ? productsService.getUserVoteById(session.user.id, productId as number).then(data => {
          if (data?.user_id) setUpvoted(true)
          else setUpvoted(false)
        })
      : null
  }, [])

  return (
    <Button
      onClick={toggleVote}
      {...props}
      className={`flex items-center gap-x-3 bg-transparent duration-200 ${
        isUpvoted
          ? 'border border-orange-500 hover:border-orange-600 hover:text-orange-500 group/bar'
          : 'bg-orange-500 hover:bg-orange-700 active:bg-orange-600'
      } ${className}`}
    >
      <div className="flex items-center gap-x-2">
        <IconVote className="w-5 h-5" />
        {votesCount}
      </div>
      <span className="w-px h-4 bg-orange-300 group-hover/bar:bg-orange-500"></span>
      {isUpvoted ? 'Upvoted' : 'Upvote'}
    </Button>
  )
}
