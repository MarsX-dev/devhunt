import type { Profile, UpdateProfile } from '@/utils/supabase/types';
import BaseDbService from './BaseDbService';
import { type ProductComment } from './comments';
import { cache } from '@/utils/supabase/services/CacheService';

type FileBody =
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | Buffer
  | File
  | FormData
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array>
  | URLSearchParams
  | string;

interface IProduct {
  product_id: string;
  products: {
    name: string;
    slogan: string;
    votes_count: string;
    logo_url: string;
    product_pricing_types: { title: string };
    product_category_product: { name: string }[];
  };
}

export default class ProfileService extends BaseDbService {
  async getById(id: string): Promise<Profile | null> {
    const key = `users-${id}`;

    const { data } = await this.supabase.from('profiles').select().eq('id', id).single();
    return data;
  }

  async getByIdWithNoCache(id: string): Promise<Profile | null> {
    const key = `users-${id}`;

    const { data } = await this.supabase.from('profiles').select().eq('id', id).single();
    return data;
  }

  async getByUsername(username: string): Promise<Profile | null> {
    const key = `users-username-${username}`;

    return cache.get(
      key,
      async () => {
        const { data, error } = await this.supabase.from('profiles').select().eq('username', username).single();
        return data;
      },
      180,
    );
  }

  async getProfiles(): Promise<Profile[] | null> {
    const { data, error } = await this.supabase.from('profiles').select();
    return data;
  }

  async getUserActivityById(userId: string): Promise<ProductComment[] | null> {
    const { data, error } = await this.supabase
      .from('comment')
      .select('*, profiles(full_name, avatar_url), products(name, slug, slogan, logo_url, votes_count, deleted, demo_url)')
      .eq('user_id', userId);

    if (error !== null) throw new Error(error.message);

    return (data || []).filter(i => !i.products.deleted);
  }

  async getUserVoteTools(userId: string): Promise<IProduct[] | any> {
    const { data, error } = await this.supabase
      .from('product_votes_view')
      .select(
        `
        *,
        product_pricing_types (title),
        product_category_product (
          product_categories (
            name
          )
        )
        `,
      )
      .eq('user_id', userId);

    if (error !== null) throw new Error(error.message);
    return data;
  }

  async update(id: string, updates: UpdateProfile): Promise<UpdateProfile> {
    const { data, error } = await this.supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error != null) throw new Error(error.message);
    return data;
  }

  async updateAvatar(userId: string, avatarFile: FileBody): Promise<string | null> {
    const { data, error } = await this.supabase.storage.from('avatars').upload(`${userId}/picture`, avatarFile, {
      cacheControl: '0',
      upsert: true,
    });

    if (error != null) throw new Error(error.message);
    await this.update(userId, {
      avatar_url: this.supabase.storage.from('avatars').getPublicUrl(`${userId}/picture`).data.publicUrl,
    });
    return data.path;
  }
}
