'use client'
import { IconVote } from '@/components/Icons'
import Button from '@/components/ui/Button'
import React, { useState } from 'react'
import { useSupabase } from '@/components/supabase/provider'
import ProductsService from '@/libs/supabase/services/products'
import { createBrowserClient } from '@/libs/supabase/browser'

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  count: number
  className?: string
}

export default async ({ count, productId, className = '', ...props }: Props) => {
  // call to trigger a vote
  // client only -- move to client component for Voting
  const { supabase, session } = useSupabase()
  const [votesCount, setVotesCount] = useState(0)

  async function toggleVote(): Promise<void> {
    if (session !== null) {
      const productsService = new ProductsService(createBrowserClient())
      const newVotesCount = await productsService.voteUnvote(productId, session.user.id)
      console.log(newVotesCount)
      // setVotesCount(newVotesCount)
    }
  }

  return (
    <Button
      onClick={toggleVote}
      {...props}
      className={`flex items-center gap-x-3 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 ${className}`}
    >
      <div className="flex items-center gap-x-2">
        <IconVote className="w-5 h-5" />
        {votesCount}
      </div>
      <span className="w-px h-4 bg-orange-50"></span>
      Upvote
    </Button>
  )
}
