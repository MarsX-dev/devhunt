import type { Comment, InsertComment, UpdateComment } from '@/utils/supabase/types';
import BaseDbService from './BaseDbService';
import { type ExtendedComment } from '@/utils/supabase/CustomTypes';
import { cache } from '@/utils/supabase/services/CacheService';

export type ProductComment = Comment & { children?: ProductComment[] };

export default class CommentService extends BaseDbService {
  private _getChildren(rows: Comment[], parentId: number): ProductComment[] | undefined {
    return rows
      .filter(i => i.parent_id === parentId)
      .map(i => ({
        ...i,
        children: this._getChildren(rows, i.id),
      }));
  }

  async insert(comment: InsertComment): Promise<ProductComment | null> {
    const { data, error } = await this.supabase.from('comment').insert(comment).select().single();
    if (error !== null) throw new Error(error.message);
    return data;
  }

  async getById(id: number): Promise<ProductComment | null> {
    const key = `comment-${id}`;

    return cache.get(key, async () => {
      const { data, error } = await this.supabase
        .from('comment')
        .select('*, profiles (full_name, avatar_url, username)')
        .or(`id.eq.${id},parent_id.eq.${id}`);

      if (error !== null) throw new Error(error.message);

      const comment = data.find(i => i.id === id);
      if (comment === undefined) return null;

      return {
        ...comment,
        children: this._getChildren(data, id),
      };
    });
  }

  async getByProductId(productId: number): Promise<ExtendedComment[] | null> {
    const key = `product-comments-${productId}`;

    return cache.get(key, async () => {
      const { data, error } = await this.supabase
        .from('comment')
        .select('*, profiles (full_name, avatar_url, username)')
        .eq('product_id', productId)
        // .eq('deleted', false)    // we can hide removed comment content but we may still want to show its replies
        .order('created_at');

      if (error !== null) throw new Error(error.message);

      return data
        .filter(i => i.parent_id === null)
        .map(i => ({
          ...i,
          children: this._getChildren(data, i.id),
        }));
    });
  }

  async update(id: number, updates: UpdateComment): Promise<Comment> {
    const { data, error } = await this.supabase
      .from('comment')
      .update(updates)
      .eq('id', id)
      .select('*, profiles (full_name, avatar_url, username)')
      .single();
    if (error != null) throw new Error(error.message);
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('comment').update({ deleted: true }).eq('id', id);
    if (error !== null) throw new Error(error.message);
  }

  async toggleVote(commentId: number, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('toggleCommentVote', { _comment_id: commentId, _user_id: userId });
    if (error !== null) throw new Error(error.message);
    return data;
  }

  private _getAllComments(rows: Comment[]): ProductComment[] {
    return rows
      .filter(i => i.parent_id === null)
      .map(i => ({
        ...i,
        children: this._getChildren(rows, i.id),
      }));
  }

  async getAllComments(): Promise<ProductComment[] | null> {
    const key = 'all-comments';

    return cache.get(key, async () => {
      const { data, error } = await this.supabase
        .from('comment')
        .select('*, profiles (full_name, avatar_url, username)')
        .order('created_at');

      if (error !== null) throw new Error(error.message);

      return this._getAllComments(data);
    });
  }
}
