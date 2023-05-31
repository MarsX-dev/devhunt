import type { Profile, UpdateProfile } from '@/utils/supabase/types'
import BaseDbService from './BaseDbService'
import { ProductComment } from './comments'

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
  | string

export default class ProfileService extends BaseDbService {
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.from('profiles').select().eq('id', id).single()
    return data
  }

  async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.from('profiles').select().eq('username', username).single()
    return data
  }

  async getUserActivityById(userId: string): Promise<ProductComment[] | null> {
    const { data, error } = await this.supabase
      .from('comment')
      .select('*, profiles(full_name, avatar_url), products(name, slug, slug, slogan, logo_url, votes_count)')
      .eq('user_id', userId)

    if (error !== null) throw new Error(error.message)

    return data
  }

  async update(id: string, updates: UpdateProfile): Promise<UpdateProfile> {
    const { data, error } = await this.supabase.from('profiles').update(updates).eq('id', id).select().single()
    if (error != null) throw new Error(error.message)
    return data
  }

  async updateAvatar(userId: string, avatarFile: FileBody): Promise<string | null> {
    const { data, error } = await this.supabase.storage.from('avatars').upload(`${userId}/picture`, avatarFile, {
      cacheControl: '0',
      upsert: true,
    })

    if (error != null) throw new Error(error.message)
    await this.update(userId, {
      avatar_url: this.supabase.storage.from('avatars').getPublicUrl(`${userId}/picture`).data.publicUrl,
    })
    return data.path
  }
}
