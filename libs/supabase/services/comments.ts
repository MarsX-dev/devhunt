import type { Comment, InsertComment, UpdateComment } from '@/libs/supabase/types'
import BaseDbService from './BaseDbService'
import { type ExtendedComment } from '@/libs/supabase/CustomTypes'

export type ProductComment = Comment & { children?: ProductComment[] }

export default class CommentService extends BaseDbService {
  private _getChildren(rows: Comment[], parentId: number): ProductComment[] | undefined {
    return rows
      .filter(i => i.parent_id === parentId)
      .map(i => ({
        ...i,
        children: this._getChildren(rows, i.id),
      }))
  }

  async insert(comment: InsertComment): Promise<ProductComment | null> {
    const { data, error } = await this.supabase.from('comment').insert(comment).select().single()

    console.log(error)
    if (error !== null) {
      throw new Error(error.message)
    }

    return data
  }

  async getById(id: number): Promise<ProductComment | null> {
    const { data, error } = await this.supabase
      .from('comment')
      .select('*, profiles (full_name, avatar_url)')
      .or(`id.eq.${id},parent_id.eq.${id}`)

    if (error !== null) throw new Error(error.message)

    const comment = data.find(i => i.id === id)
    if (comment === undefined) return null

    return {
      ...comment,
      children: this._getChildren(data, id),
    }
  }

  async getByProductId(productId: number): Promise<ExtendedComment[] | null> {
    const { data, error } = await this.supabase
      .from('comment')
      .select('*, profiles (full_name, avatar_url)')
      .eq('product_id', productId)
      // .eq('deleted', false)    // we can hide removed comment content but we may still want to show its replies
      .order('created_at')

    if (error !== null) throw new Error(error.message)

    return data
      .filter(i => i.parent_id === null)
      .map(i => ({
        ...i,
        children: this._getChildren(data, i.id),
      }))
  }

  async update(id: number, updates: UpdateComment): Promise<Comment> {
    const { data, error } = await this.supabase.from('comment').update(updates).eq('id', id).select().single()
    if (error != null) throw new Error(error.message)
    return data
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('comment').update({ deleted: true }).eq('id', id)
    if (error !== null) throw new Error(error.message)
  }

  async toggleVote(commentId: number, userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('toggleCommentVote', { _comment_id: commentId, _user_id: userId })
    if (error !== null) throw new Error(error.message)

    const comment = await this.getById(commentId)
    return comment?.votes_count || 0
  }
}
